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

// fetch is available globally in Node 18+
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

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/clawread';
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
const port = Number(process.env.PORT || 3000);

const pool = new Pool({ connectionString: databaseUrl });
const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

async function ensureSchema() {
  const schemaPath = path.join(repoRoot, 'packages', 'db', 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);
}

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
  : undefined;

const queues: Record<JobType, Queue> = {
  parse: new Queue('parse', { connection: redis }),
  tts: new Queue('tts', { connection: redis }),
  render: new Queue('render', { connection: redis })
};

const app = express();
app.use(cors({
  origin(origin, callback) {
    // 允许所有来源，避免不同部署域名导致前端 fetch 失败
    // （当前接口不依赖 Cookie 会话）
    return callback(null, true);
  },
  credentials: false
}));
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
    [userId, 'solo@clawread.local']
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
  return input.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim() || 'clawread';
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

app.get('/', (_, res) => {
  res.status(200).json({
    ok: true,
    service: 'clawread-api',
    message: 'alive',
    ts: new Date().toISOString()
  });
});

app.get('/health', async (_, res) => {
  try {
    await pool.query('select 1');
    res.json({
      ok: true,
      service: 'clawread-api',
      db: 'ok',
      storageRoot,
      useObjectStorage,
      s3Bucket: s3Bucket || null,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ ok: false, service: 'clawread-api', db: 'error', error: String(error) });
  }
});

app.post('/v1/books', async (req, res) => {
  const parsed = createBookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = parsed.data.userId || (await ensureDefaultUser());
  await pool.query(
    `insert into users(id, email, plan, timezone)
     values($1, $2, 'free', 'Asia/Shanghai')
     on conflict (id) do nothing`,
    [userId, `user-${userId}@clawread.local`]
  );
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

  // TTS job 创建后，自动创建 render job（依赖 TTS job 完成）
  if (parsed.data.type === 'tts') {
    const renderJobId = uuidv4();
    await pool.query(
      `insert into jobs(id, user_id, book_id, job_type, status, progress)
       values($1, $2, $3, 'render', 'queued', 0)`,
      [renderJobId, userId, parsed.data.bookId]
    );

    await queues.render.add(
      `render-book-${parsed.data.bookId}`,
      {
        jobId: renderJobId,
        userId,
        bookId: parsed.data.bookId,
        type: 'render'
      },
      { 
        jobId: renderJobId, 
        attempts: 3, 
        removeOnComplete: 50, 
        removeOnFail: 200,
        // 等待 TTS job 完成后才执行
        dependencies: [{ jobId: id }]
      }
    );
    
    console.log(`[api] auto-created render job ${renderJobId} for book ${parsed.data.bookId}`);
  }

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

// LLM 转换端点（用于粤语转换助手）
app.post('/v1/translate/cantonese', async (req, res) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text_required' });
  }

  try {
    const glmKey = process.env.GLM_API_KEY;
    
    if (!glmKey) {
      return res.status(501).json({ 
        error: 'glm_not_configured',
        message: '请配置 GLM_API_KEY' 
      });
    }

    // 调用智谱 GLM API
    const glmRes = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${glmKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: `你是香港本地人，帮手将普通话转成最自然嘅粤语口语，可以适当加入香港潮语同网络用语。

**用词替换：**
- 东西 → 嘢
- 小朋友 → 细路/小朋友
- 市场 → 街市
- 吃饭 → 食饭
- 什么 → 咩
- 怎么 → 点
- 这个 → 呢个
- 那个 → 嗰个
- 这里 → 呢度
- 那里 → 嗰度
- 很/好 → 好/好X（加强语气）
- 喜欢 → 钟意
- 讨厌 → 憎
- 麻烦 → 论尽/麻烦

**香港潮语/网络用语（适当使用）：**
- 很 → 超/X（如：超好、劲好）
- 非常 → 爆/超级
- 没关系 → 唔紧要/冇问题
- 没事 → 冇嘢
- 很厉害 → 劲/超劲/屈机
- 很开心 → 超开心/开心到爆
- 气死我了 → 激死我/嬲到爆
- 太好了 → 正/超正
- 傻瓜 → 论尽/傻更更
- 漂亮 → 靓/索
- 帅气 → 型/Chok
- 可爱 → 得意/Cute
- 无聊 → 冇厘瘾/闷到爆
- 不管/无论如何 → 唔理
- 真的 → 真系/真㗎
- 很累 → 索/攰到爆
- 很饿 → 饿到晕
- 发呆 → 发吽哣/Hea
- 随便 → 求其/是但
- 很多人 → 多到爆/逼爆
- 很便宜 → 平/超值
- 很贵 → 贵到飞起/抢钱
- 不知道 → 唔知/唔清楚
- 怎么办 → 点算/点好
- 完蛋了 → 完蛋/死火/ PK
- 糟糕 → 冇眼睇/收皮
- 很烦 → 烦到爆/激气
- 没想到 → 谂唔到/估唔到
- 好厉害 → 勁/正/屈機
- 超赞 → 正/超正/Great
- 不行 → 唔得/冇得
- 等一下 → 等阵/阵间
- 慢慢 → 慢慢/慢慢嚟

**网络用语：**
- XD → XD
- 笑死 → 笑死/XD
- 哈哈 → 哈哈/哈哈哈
- 超好笑 → 超好笑/笑到肚痛
- 真的假的 → 真系假㗎
- 不是吧 → 唔系挂
- 天啊 → 天呀/哗
- 赞 → 赞/Like
- 支持 → 支持/撑
- 厉害 → 劲/Pro
- 高手 → 高手/大神
- 新手 → 新手/萌新

**语法调整：**
- 在 → 喺
- 的 → 嘅
- 了 → 咗
- 着 → 住
- 得 → 得

**语气词（自然适量）：**
- 句尾：呀、㗎、啰、啫、嘞、喇
- 疑问：咩、呢
- 感叹：呀、㗎、哇

**例子：**
输入 → 输出
今天天气很好 → 今日天气超好呀
你在干什么 → 你做紧咩呀
这个东西太贵了 → 呢个嘢贵到飞起
小朋友很可爱 → 细路超得意
我累死了 → 我攰到爆呀
气死我了 → 激死我呀
太棒了 → 正！超正㗎
这个东西很便宜 → 呢个嘢超值
我不知道怎么办 → 我唔知点算好
真的很厉害 → 真系好劲㗎

只返回粤语结果，无解释`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.75,
        max_tokens: 2000
      })
    });

    if (!glmRes.ok) {
      const error = await glmRes.text();
      console.error('[translate] GLM error:', glmRes.status, error);
      return res.status(glmRes.status).json({ 
        error: 'glm_failed', 
        detail: error 
      });
    }

    const glmData = await glmRes.json();
    const translated = glmData.choices?.[0]?.message?.content || text;

    return res.json({ 
      original: text,
      translated,
      model: 'glm-4-flash'
    });

  } catch (error) {
    console.error('[translate] Error:', error);
    return res.status(500).json({ error: 'translate_failed', detail: String(error) });
  }
});

// 简单 TTS 端点（用于粤语转换助手）
app.post('/v1/tts/speak', async (req, res) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text_required' });
  }

  try {
    // Mock 模式：返回浏览器可以播放的提示音
    if (process.env.MOCK_TTS === 'true' || !process.env.AZURE_TTS_KEY) {
      // 返回一个简单的音频数据（1秒静音）
      const silentBase64 = '//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
      
      return res.json({ 
        audio: silentBase64,
        mode: 'mock',
        message: 'Mock 模式：请配置 AZURE_TTS_KEY 以使用真实语音'
      });
    }

    // 真实 Azure TTS 调用
    const azureKey = process.env.AZURE_TTS_KEY!;
    const azureRegion = process.env.AZURE_TTS_REGION || 'eastasia';
    const azureVoice = process.env.AZURE_TTS_VOICE || 'zh-HK-HiuGaaiNeural';
    const azureRate = process.env.AZURE_TTS_RATE || '+0%';
    const azurePitch = process.env.AZURE_TTS_PITCH || '+0Hz';

    // 构建 SSML
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="${azureVoice}">
          <prosody rate="${azureRate}" pitch="${azurePitch}">
            ${text}
          </prosody>
        </voice>
      </speak>
    `.trim();

    // 调用 Azure TTS API
    const azureUrl = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const azureRes = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'ClawRead-TTS'
      },
      body: ssml
    });

    if (!azureRes.ok) {
      const error = await azureRes.text();
      console.error('[tts] Azure TTS error:', azureRes.status, error);
      return res.status(azureRes.status).json({ 
        error: 'azure_tts_failed', 
        detail: error 
      });
    }

    // 获取音频数据
    const audioBuffer = await azureRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return res.json({ 
      audio: audioBase64,
      mode: 'azure',
      voice: azureVoice
    });

  } catch (error) {
    console.error('[tts] Error:', error);
    return res.status(500).json({ error: 'tts_failed', detail: String(error) });
  }
});

app.listen(port, '0.0.0.0', async () => {
  await fs.mkdir(storageRoot, { recursive: true });
  await ensureSchema();
  console.log(`[api] listening on :${port}`);
  console.log(`[api] db=${databaseUrl}`);
  console.log(`[api] redis=${redisUrl}`);
  console.log(`[api] storageRoot=${storageRoot}`);
  console.log(`[api] useObjectStorage=${useObjectStorage}`);
  console.log(`[api] s3Bucket=${s3Bucket || ''}`);
});
