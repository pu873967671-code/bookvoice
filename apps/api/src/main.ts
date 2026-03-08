import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import pg from 'pg';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const { Pool } = pg;

type JobType = 'parse' | 'tts' | 'render';

type BookRow = {
  id: string;
  user_id: string;
  title: string;
  source_object_key: string;
  source_text: string | null;
  language: string;
  total_chars: number;
  render_object_key: string | null;
  render_format: string | null;
  created_at: Date;
};

type JobRow = {
  id: string;
  book_id: string;
  job_type: JobType;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
};

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookvoice';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const storageRoot = process.env.STORAGE_ROOT
  ? path.resolve(process.env.STORAGE_ROOT)
  : path.join(repoRoot, 'storage');
const s3Bucket = process.env.S3_BUCKET || '';
const s3Endpoint = process.env.S3_ENDPOINT || '';
const s3Region = process.env.S3_REGION || 'us-east-1';
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || '';
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
const signedUrlExpiresSec = Number(process.env.SIGNED_URL_EXPIRES_SEC || 3600);
const useObjectStorage = process.env.USE_OBJECT_STORAGE === 'true';

const pool = new Pool({ connectionString: databaseUrl });
const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const s3 = useObjectStorage && s3Bucket && s3Endpoint && s3AccessKeyId && s3SecretAccessKey
  ? new S3Client({
      region: s3Region,
      endpoint: s3Endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey
      }
    })
  : null;

const queues: Record<JobType, Queue> = {
  parse: new Queue('parse', { connection: redis }),
  tts: new Queue('tts', { connection: redis }),
  render: new Queue('render', { connection: redis })
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const createBookSchema = z
  .object({
    title: z.string().min(1),
    sourceObjectKey: z.string().min(1).optional(),
    sourceText: z.string().min(1).optional(),
    language: z.string().default('zh-CN'),
    totalChars: z.number().int().nonnegative().optional(),
    userId: z.string().uuid().optional()
  })
  .refine((d) => Boolean(d.sourceObjectKey || d.sourceText), {
    message: 'sourceObjectKey_or_sourceText_required'
  });

const createJobSchema = z.object({
  bookId: z.string().uuid(),
  type: z.enum(['parse', 'tts', 'render']),
  userId: z.string().uuid().optional()
});

function getCycleMonthInShanghai(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  if (!year || !month) throw new Error('cycle_month_parse_failed');
  return `${year}-${month}`;
}

const ensureDefaultUser = async () => {
  const userId = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';
  await pool.query(
    `insert into users(id, email, plan, timezone)
     values($1, $2, 'free', 'Asia/Shanghai')
     on conflict (id) do nothing`,
    [userId, 'solo@bookvoice.local']
  );
  return userId;
};

async function reserveTtsQuota(userId: string, bookId: string, charCost: number, jobId: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const cycleMonth = getCycleMonthInShanghai();
    const [year, month] = cycleMonth.split('-').map(Number);
    const resetAt = new Date(Date.UTC(year, month - 1, 1, -8, 0, 0));

    await client.query(
      `insert into quota_cycles(user_id, cycle_month, reset_at)
       values($1, $2, $3)
       on conflict (user_id, cycle_month) do nothing`,
      [userId, cycleMonth, resetAt]
    );

    const { rows } = await client.query<{
      book_limit: number;
      book_used: number;
      char_limit: number;
      char_used: number;
      bonus_book: number;
      bonus_char: number;
    }>(
      `select book_limit, book_used, char_limit, char_used, bonus_book, bonus_char
       from quota_cycles
       where user_id=$1 and cycle_month=$2
       for update`,
      [userId, cycleMonth]
    );

    const cycle = rows[0];
    if (!cycle) throw new Error('quota_cycle_not_found');

    const remainBooks = cycle.book_limit + cycle.bonus_book - cycle.book_used;
    const remainChars = cycle.char_limit + cycle.bonus_char - cycle.char_used;

    if (remainBooks < 1 || remainChars < charCost) {
      await client.query('rollback');
      return { ok: false as const, remainBooks, remainChars };
    }

    await client.query(
      `update quota_cycles
       set book_used = book_used + 1,
           char_used = char_used + $3,
           updated_at = now()
       where user_id = $1 and cycle_month = $2`,
      [userId, cycleMonth, charCost]
    );

    await client.query(
      `insert into quota_ledger(user_id, cycle_month, book_id, action, book_delta, char_delta, reason, idempotency_key)
       values($1, $2, $3, 'reserve', 1, $4, 'tts_reserve', $5)
       on conflict (idempotency_key) do nothing`,
      [userId, cycleMonth, bookId, charCost, `tts:reserve:${jobId}`]
    );

    await client.query('commit');
    return { ok: true as const };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

const mapBook = (r: BookRow) => ({
  id: r.id,
  title: r.title,
  sourceObjectKey: r.source_object_key,
  hasSourceText: Boolean(r.source_text),
  language: r.language,
  totalChars: r.total_chars,
  renderObjectKey: r.render_object_key,
  renderFormat: r.render_format,
  createdAt: r.created_at.toISOString()
});

const mapJob = (r: JobRow) => ({
  id: r.id,
  bookId: r.book_id,
  type: r.job_type,
  status: r.status,
  progress: r.progress,
  error: r.error_message,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString()
});

function safeFilename(input: string) {
  return input.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim() || 'bookvoice';
}

async function getSignedDownloadUrl(objectKey: string, downloadName: string) {
  if (!s3 || !s3Bucket) throw new Error('object_storage_not_configured');

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: s3Bucket,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${safeFilename(downloadName)}"`
    }),
    { expiresIn: signedUrlExpiresSec }
  );
}

app.get('/health', async (_, res) => {
  try {
    await pool.query('select 1');
    res.json({
      ok: true,
      service: 'bookvoice-api',
      db: 'ok',
      storageRoot,
      useObjectStorage,
      s3Bucket: s3Bucket || null,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ ok: false, service: 'bookvoice-api', db: 'error', error: String(error) });
  }
});

app.post('/v1/books', async (req, res) => {
  const parsed = createBookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = parsed.data.userId || (await ensureDefaultUser());
  const id = uuidv4();
  const sourceObjectKey = parsed.data.sourceObjectKey || `inline://${id}.txt`;
  const estimatedChars = parsed.data.totalChars ?? parsed.data.sourceText?.length ?? 0;

  const { rows } = await pool.query<BookRow>(
    `insert into books(id, user_id, title, source_object_key, source_text, language, total_chars, status)
     values($1, $2, $3, $4, $5, $6, $7, 'uploaded')
     returning id, user_id, title, source_object_key, source_text, language, total_chars, render_object_key, render_format, created_at`,
    [id, userId, parsed.data.title, sourceObjectKey, parsed.data.sourceText || null, parsed.data.language, estimatedChars]
  );

  res.status(201).json(mapBook(rows[0]));
});

app.get('/v1/books/:bookId', async (req, res) => {
  const { rows } = await pool.query<BookRow>(
    `select id, user_id, title, source_object_key, source_text, language, total_chars, render_object_key, render_format, created_at
     from books where id = $1 limit 1`,
    [req.params.bookId]
  );

  if (!rows[0]) return res.status(404).json({ error: 'book_not_found' });
  res.json(mapBook(rows[0]));
});

app.post('/v1/jobs', async (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = parsed.data.userId || (await ensureDefaultUser());
  const { rows: bookRows } = await pool.query<BookRow>(
    `select id, user_id, title, source_object_key, source_text, language, total_chars, render_object_key, render_format, created_at
     from books where id = $1 limit 1`,
    [parsed.data.bookId]
  );

  const book = bookRows[0];
  if (!book) return res.status(404).json({ error: 'book_not_found' });

  const id = uuidv4();
  const idempotencyKey = `${parsed.data.type}:${parsed.data.bookId}:${id}`;

  if (parsed.data.type === 'tts') {
    const reserve = await reserveTtsQuota(userId, parsed.data.bookId, Math.max(1, book.total_chars), id);
    if (!reserve.ok) {
      return res.status(402).json({
        error: 'quota_exceeded',
        remainBooks: reserve.remainBooks,
        remainChars: reserve.remainChars
      });
    }
  }

  const { rows } = await pool.query<JobRow>(
    `insert into jobs(id, user_id, book_id, job_type, status, progress, idempotency_key)
     values($1, $2, $3, $4, 'queued', 0, $5)
     returning id, book_id, job_type, status, progress, error_message, created_at, updated_at`,
    [id, userId, parsed.data.bookId, parsed.data.type, idempotencyKey]
  );

  await queues[parsed.data.type].add(
    `${parsed.data.type}-book`,
    {
      jobId: id,
      userId,
      bookId: parsed.data.bookId,
      type: parsed.data.type
    },
    { jobId: id, attempts: 3, removeOnComplete: 50, removeOnFail: 200 }
  );

  res.status(201).json(mapJob(rows[0]));
});

app.get('/v1/jobs/:jobId', async (req, res) => {
  const { rows } = await pool.query<JobRow>(
    `select id, book_id, job_type, status, progress, error_message, created_at, updated_at
     from jobs where id = $1 limit 1`,
    [req.params.jobId]
  );

  if (!rows[0]) return res.status(404).json({ error: 'job_not_found' });
  res.json(mapJob(rows[0]));
});

app.get('/v1/books/:bookId/download', async (req, res) => {
  const { rows } = await pool.query<Pick<BookRow, 'id' | 'title' | 'render_object_key' | 'render_format'>>(
    `select id, title, render_object_key, render_format
     from books where id = $1 limit 1`,
    [req.params.bookId]
  );

  const book = rows[0];
  if (!book) return res.status(404).json({ error: 'book_not_found' });
  if (!book.render_object_key) return res.status(409).json({ error: 'render_not_ready' });

  const ext = book.render_format || path.extname(book.render_object_key).replace(/^\./, '') || 'bin';
  const downloadName = `${safeFilename(book.title)}.${ext}`;

  if (useObjectStorage) {
    try {
      const url = await getSignedDownloadUrl(book.render_object_key, downloadName);
      return res.json({
        mode: 'signed_url',
        url,
        expiresInSec: signedUrlExpiresSec,
        objectKey: book.render_object_key,
        format: ext
      });
    } catch (error) {
      return res.status(500).json({ error: 'signed_url_failed', detail: String(error) });
    }
  }

  const fullPath = path.resolve(storageRoot, book.render_object_key);
  try {
    await fs.access(fullPath);
  } catch {
    return res.status(404).json({ error: 'render_file_missing', fullPath });
  }

  if (ext === 'm3u8') {
    return res.sendFile(fullPath);
  }

  return res.download(fullPath, downloadName);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, async () => {
  await fs.mkdir(storageRoot, { recursive: true });
  console.log(`[api] listening on :${port}`);
  console.log(`[api] db=${databaseUrl}`);
  console.log(`[api] redis=${redisUrl}`);
  console.log(`[api] storageRoot=${storageRoot}`);
  console.log(`[api] useObjectStorage=${useObjectStorage}`);
  console.log(`[api] s3Bucket=${s3Bucket || ''}`);
});
