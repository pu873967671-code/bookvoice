import 'dotenv/config';
import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const parseQueue = new Queue('parse', { connection });
const ttsQueue = new Queue('tts', { connection });
const renderQueue = new Queue('render', { connection });

new Worker(
  'parse',
  async (job) => {
    console.log(`[worker] parse start: ${job.id}`, job.data);
    await job.updateProgress(100);
    return { ok: true };
  },
  { connection }
);

new Worker(
  'tts',
  async (job) => {
    console.log(`[worker] tts start: ${job.id}`, job.data);
    await job.updateProgress(100);
    return { ok: true };
  },
  { connection }
);

new Worker(
  'render',
  async (job) => {
    console.log(`[worker] render start: ${job.id}`, job.data);
    await job.updateProgress(100);
    return { ok: true };
  },
  { connection }
);

async function seedDemoJobs() {
  await parseQueue.add('parse-book', { bookId: 'demo-book-id' });
  await ttsQueue.add('tts-book', { bookId: 'demo-book-id', voice: 'azure-zh-CN' });
  await renderQueue.add('render-book', { bookId: 'demo-book-id', format: 'mp3' });
}

seedDemoJobs().catch((err) => {
  console.error('[worker] seed failed', err);
});

console.log('[worker] up with redis:', redisUrl);
