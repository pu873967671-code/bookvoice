import 'dotenv/config';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import pg from 'pg';

const { Pool } = pg;

type JobType = 'parse' | 'tts' | 'render';

type QueueJobData = {
  jobId: string;
  bookId: string;
  type: JobType;
};

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookvoice';

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

async function runParse(data: QueueJobData) {
  // phase2 stub: parser pipeline placeholder (txt/epub next commit)
  await new Promise((r) => setTimeout(r, 800));
  await pool.query(`update books set status = 'parsed' where id = $1`, [data.bookId]);
}

async function runTTS(_data: QueueJobData) {
  // phase2 stub: azure adapter next commit
  await new Promise((r) => setTimeout(r, 1000));
}

async function runRender(_data: QueueJobData) {
  await new Promise((r) => setTimeout(r, 600));
}

function createWorker(queueName: JobType) {
  return new Worker(
    queueName,
    async (bullJob) => {
      const data = bullJob.data as QueueJobData;

      await setJobState(data.jobId, 'running', 10);
      await bullJob.updateProgress(10);

      try {
        if (queueName === 'parse') await runParse(data);
        if (queueName === 'tts') await runTTS(data);
        if (queueName === 'render') await runRender(data);

        await setJobState(data.jobId, 'done', 100);
        await bullJob.updateProgress(100);

        console.log(`[worker] ${queueName} done`, { bullmqId: bullJob.id, jobId: data.jobId, bookId: data.bookId });
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
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
