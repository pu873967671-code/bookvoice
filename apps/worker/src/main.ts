import 'dotenv/config';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import pg from 'pg';
import AdmZip from 'adm-zip';
import he from 'he';

const execFile = promisify(execFileCallback);
const { Pool } = pg;

type JobType = 'parse' | 'tts' | 'render';

type QueueJobData = {
  jobId: string;
  userId: string;
  bookId: string;
  type: JobType;
};

type ChapterInput = {
  index: number;
  title: string;
  text: string;
};

type ChapterRow = {
  id: string;
  chapter_index: number;
  title: string | null;
  text_content: string;
};

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookvoice';
const mockTts = process.env.MOCK_TTS !== 'false';
const azureTtsKey = process.env.AZURE_TTS_KEY || '';
const azureTtsRegion = process.env.AZURE_TTS_REGION || 'eastasia';
const azureVoice = process.env.AZURE_TTS_VOICE || 'zh-CN-XiaoxiaoNeural';
const azureRate = process.env.AZURE_TTS_RATE || '+0%';
const azurePitch = process.env.AZURE_TTS_PITCH || '+0Hz';
const ffmpegBin = process.env.FFMPEG_BIN || 'ffmpeg';
const ffprobeBin = process.env.FFPROBE_BIN || 'ffprobe';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const storageRoot = process.env.STORAGE_ROOT
  ? path.resolve(process.env.STORAGE_ROOT)
  : path.join(repoRoot, 'storage');

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: databaseUrl });

async function setJobState(jobId: string, status: 'queued' | 'running' | 'done' | 'failed', progress: number, errorMessage?: string) {
  await pool.query(
    `update jobs
     set status = $2,
         progress = $3,
         error_message = $4,
         updated_at = now()
     where id = $1`,
    [jobId, status, progress, errorMessage || null]
  );
}

function normalizeText(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripHtml(input: string) {
  const noScript = input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = noScript
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return normalizeText(he.decode(text));
}

function splitIntoChapters(text: string): ChapterInput[] {
  const normalized = normalizeText(text);
  const marker = /\n(?=第[一二三四五六七八九十百千0-9]+[章节回卷][^\n]{0,20}\n)/g;
  const rough = normalized.split(marker).map((s) => s.trim()).filter(Boolean);

  const chapters: ChapterInput[] = [];
  const chunks = rough.length > 1 ? rough : normalized.match(/[\s\S]{1,3000}/g) || [];

  chunks.forEach((chunk, idx) => {
    const lines = chunk.split('\n').filter(Boolean);
    const guessedTitle = lines[0]?.slice(0, 30) || `第${idx + 1}章`;
    chapters.push({ index: idx + 1, title: guessedTitle, text: chunk });
  });

  return chapters;
}

async function loadBookText(sourceObjectKey: string, sourceText: string | null) {
  if (sourceText?.trim()) return sourceText;

  if (sourceObjectKey.startsWith('inline://')) {
    throw new Error('inline_source_text_missing');
  }

  const filePath = path.isAbsolute(sourceObjectKey)
    ? sourceObjectKey
    : path.resolve(repoRoot, sourceObjectKey);

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.txt') {
    return fs.readFile(filePath, 'utf8');
  }

  if (ext === '.epub') {
    const zip = new AdmZip(filePath);
    const entries = zip
      .getEntries()
      .filter((e) => /\.(xhtml|html|htm)$/i.test(e.entryName))
      .sort((a, b) => a.entryName.localeCompare(b.entryName));

    const content = entries
      .map((entry) => stripHtml(entry.getData().toString('utf8')))
      .filter(Boolean)
      .join('\n\n');

    if (!content.trim()) throw new Error('epub_no_text_found');
    return content;
  }

  throw new Error(`unsupported_source_extension:${ext || 'none'}`);
}

function makeChapterFilename(index: number) {
  return `chapter-${String(index).padStart(3, '0')}.mp3`;
}

function chapterStorageRelPath(bookId: string, index: number) {
  return path.posix.join('tts', bookId, makeChapterFilename(index));
}

function chapterStorageAbsPath(bookId: string, index: number) {
  return path.join(storageRoot, 'tts', bookId, makeChapterFilename(index));
}

function renderStorageRelPath(bookId: string) {
  return path.posix.join('renders', `${bookId}.mp3`);
}

function renderStorageAbsPath(bookId: string) {
  return path.join(storageRoot, 'renders', `${bookId}.mp3`);
}

async function ensureDirForFile(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function xmlEscape(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSsml(text: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">
  <voice name="${xmlEscape(azureVoice)}">
    <prosody rate="${xmlEscape(azureRate)}" pitch="${xmlEscape(azurePitch)}">${xmlEscape(text)}</prosody>
  </voice>
</speak>`;
}

async function synthesizeAzureMp3(text: string, outPath: string) {
  if (!azureTtsKey) throw new Error('azure_tts_key_missing');
  const endpoint = `https://${azureTtsRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = buildSsml(text);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': azureTtsKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'bookvoice/0.1.0'
    },
    body: ssml
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`azure_tts_http_${response.status}:${body.slice(0, 200)}`);
  }

  const arr = await response.arrayBuffer();
  await ensureDirForFile(outPath);
  await fs.writeFile(outPath, Buffer.from(arr));
}

async function getAudioDurationSec(filePath: string) {
  const { stdout } = await execFile(ffprobeBin, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ]);

  const duration = Math.ceil(Number.parseFloat(stdout.trim()) || 0);
  return Math.max(1, duration);
}

async function generateMockMp3(text: string, outPath: string) {
  const seconds = Math.max(3, Math.min(20, Math.ceil(text.length / 120)));
  await ensureDirForFile(outPath);
  await execFile(ffmpegBin, [
    '-y',
    '-f', 'lavfi',
    '-i', `anullsrc=r=24000:cl=mono`,
    '-t', String(seconds),
    '-q:a', '9',
    '-acodec', 'libmp3lame',
    outPath
  ]);
}

async function concatMp3Files(inputFiles: string[], outputFile: string) {
  if (inputFiles.length === 0) throw new Error('no_audio_files_for_concat');
  await ensureDirForFile(outputFile);

  const listFile = path.join(os.tmpdir(), `bookvoice-concat-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`);
  const content = inputFiles.map((f) => `file '${f.replace(/'/g, `'\\''`)}'`).join('\n');
  await fs.writeFile(listFile, `${content}\n`, 'utf8');

  try {
    await execFile(ffmpegBin, ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outputFile]);
  } finally {
    await fs.rm(listFile, { force: true });
  }
}

async function runParse(data: QueueJobData) {
  const { rows } = await pool.query<{
    source_object_key: string;
    source_text: string | null;
  }>(
    `select source_object_key, source_text from books where id = $1 limit 1`,
    [data.bookId]
  );

  const book = rows[0];
  if (!book) throw new Error('book_not_found_for_parse');

  const text = await loadBookText(book.source_object_key, book.source_text);
  const chapters = splitIntoChapters(text);
  const totalChars = chapters.reduce((sum, c) => sum + c.text.length, 0);

  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(`delete from chapters where book_id = $1`, [data.bookId]);

    for (const c of chapters) {
      await client.query(
        `insert into chapters(book_id, chapter_index, title, text_content, char_count)
         values($1, $2, $3, $4, $5)`,
        [data.bookId, c.index, c.title, c.text, c.text.length]
      );
    }

    await client.query(`update books set status = 'parsed', total_chars = $2 where id = $1`, [data.bookId, totalChars]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function runTTS(data: QueueJobData) {
  const { rows: chapters } = await pool.query<ChapterRow>(
    `select id, chapter_index, title, text_content
     from chapters
     where book_id = $1
     order by chapter_index asc`,
    [data.bookId]
  );

  if (chapters.length === 0) throw new Error('no_chapters_for_tts');

  for (const ch of chapters) {
    const outPath = chapterStorageAbsPath(data.bookId, ch.chapter_index);
    const relPath = chapterStorageRelPath(data.bookId, ch.chapter_index);

    if (mockTts) {
      await generateMockMp3(ch.text_content, outPath);
    } else {
      await synthesizeAzureMp3(ch.text_content, outPath);
    }

    const durationSec = await getAudioDurationSec(outPath);

    await pool.query(
      `update chapters
       set audio_url = $2,
           duration_sec = $3
       where id = $1`,
      [ch.id, relPath, durationSec]
    );
  }

  await pool.query(`update books set status = 'tts_done' where id = $1`, [data.bookId]);
}

async function runRender(data: QueueJobData) {
  const { rows: chapters } = await pool.query<{
    chapter_index: number;
    audio_url: string | null;
  }>(
    `select chapter_index, audio_url
     from chapters
     where book_id = $1
     order by chapter_index asc`,
    [data.bookId]
  );

  if (chapters.length === 0) throw new Error('no_chapters_for_render');

  const inputFiles = chapters.map((c) => {
    if (!c.audio_url) throw new Error(`missing_audio_for_chapter_${c.chapter_index}`);
    return path.resolve(storageRoot, c.audio_url);
  });

  for (const file of inputFiles) {
    await fs.access(file);
  }

  const outputFile = renderStorageAbsPath(data.bookId);
  await concatMp3Files(inputFiles, outputFile);

  await pool.query(
    `update books
     set status = 'render_ready',
         render_object_key = $2,
         render_format = $3
     where id = $1`,
    [data.bookId, renderStorageRelPath(data.bookId), 'mp3']
  );
}

async function refundTtsQuota(jobData: QueueJobData) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const reserveKey = `tts:reserve:${jobData.jobId}`;
    const { rows } = await client.query<{
      cycle_month: string;
      book_delta: number;
      char_delta: number;
    }>(
      `select cycle_month, book_delta, char_delta
       from quota_ledger
       where idempotency_key = $1
       limit 1`,
      [reserveKey]
    );

    const reserve = rows[0];
    if (!reserve) {
      await client.query('rollback');
      return;
    }

    const refundKey = `tts:refund:${jobData.jobId}`;
    const { rows: exists } = await client.query(`select 1 from quota_ledger where idempotency_key = $1 limit 1`, [refundKey]);
    if (exists[0]) {
      await client.query('rollback');
      return;
    }

    await client.query(
      `update quota_cycles
       set book_used = greatest(0, book_used - $3),
           char_used = greatest(0, char_used - $4),
           updated_at = now()
       where user_id = $1 and cycle_month = $2`,
      [jobData.userId, reserve.cycle_month, reserve.book_delta, reserve.char_delta]
    );

    await client.query(
      `insert into quota_ledger(user_id, cycle_month, book_id, action, book_delta, char_delta, reason, idempotency_key)
       values($1, $2, $3, 'refund', $4, $5, 'tts_refund', $6)`,
      [jobData.userId, reserve.cycle_month, jobData.bookId, -reserve.book_delta, -reserve.char_delta, refundKey]
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function markTtsConsume(jobData: QueueJobData) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const reserveKey = `tts:reserve:${jobData.jobId}`;
    const consumeKey = `tts:consume:${jobData.jobId}`;

    const { rows } = await client.query<{
      cycle_month: string;
      book_delta: number;
      char_delta: number;
    }>(
      `select cycle_month, book_delta, char_delta
       from quota_ledger where idempotency_key = $1 limit 1`,
      [reserveKey]
    );

    const reserve = rows[0];
    if (!reserve) {
      await client.query('rollback');
      return;
    }

    await client.query(
      `insert into quota_ledger(user_id, cycle_month, book_id, action, book_delta, char_delta, reason, idempotency_key)
       values($1, $2, $3, 'consume', $4, $5, 'tts_consume', $6)
       on conflict (idempotency_key) do nothing`,
      [jobData.userId, reserve.cycle_month, jobData.bookId, reserve.book_delta, reserve.char_delta, consumeKey]
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

function createWorker(queueName: JobType) {
  return new Worker(
    queueName,
    async (bullJob) => {
      const data = bullJob.data as QueueJobData;

      await fs.mkdir(storageRoot, { recursive: true });
      await setJobState(data.jobId, 'running', 10);
      await bullJob.updateProgress(10);

      try {
        if (queueName === 'parse') await runParse(data);
        if (queueName === 'tts') await runTTS(data);
        if (queueName === 'render') await runRender(data);

        if (queueName === 'tts') {
          await markTtsConsume(data);
        }

        await setJobState(data.jobId, 'done', 100);
        await bullJob.updateProgress(100);

        console.log(`[worker] ${queueName} done`, { bullmqId: bullJob.id, jobId: data.jobId, bookId: data.bookId });
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const maxAttempts = bullJob.opts.attempts ?? 1;
        const finalFailure = bullJob.attemptsMade + 1 >= maxAttempts;

        if (queueName === 'tts' && finalFailure) {
          await refundTtsQuota(data);
        }

        await setJobState(data.jobId, 'failed', Number(bullJob.progress || 0), message);
        console.error(`[worker] ${queueName} failed`, { jobId: data.jobId, message });
        throw err;
      }
    },
    { connection }
  );
}

createWorker('parse');
createWorker('tts');
createWorker('render');

console.log('[worker] up with redis:', redisUrl);
console.log('[worker] db:', databaseUrl);
console.log('[worker] mockTts:', mockTts);
console.log('[worker] storageRoot:', storageRoot);
console.log('[worker] azureVoice:', azureVoice);
