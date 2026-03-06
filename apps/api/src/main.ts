import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

type JobType = 'parse' | 'tts' | 'render';
type JobStatus = 'queued' | 'running' | 'done' | 'failed';

interface Book {
  id: string;
  title: string;
  sourceObjectKey: string;
  language: string;
  totalChars: number;
  createdAt: string;
}

interface Job {
  id: string;
  bookId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const books = new Map<string, Book>();
const jobs = new Map<string, Job>();

const createBookSchema = z.object({
  title: z.string().min(1),
  sourceObjectKey: z.string().min(1),
  language: z.string().default('zh-CN'),
  totalChars: z.number().int().nonnegative().default(0)
});

const createJobSchema = z.object({
  bookId: z.string().uuid(),
  type: z.enum(['parse', 'tts', 'render'])
});

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'bookvoice-api', ts: new Date().toISOString() });
});

app.post('/v1/books', (req, res) => {
  const parsed = createBookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = uuidv4();
  const now = new Date().toISOString();
  const book: Book = {
    id,
    createdAt: now,
    ...parsed.data
  };

  books.set(id, book);
  res.status(201).json(book);
});

app.get('/v1/books/:bookId', (req, res) => {
  const book = books.get(req.params.bookId);
  if (!book) return res.status(404).json({ error: 'book_not_found' });
  res.json(book);
});

app.post('/v1/jobs', (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!books.has(parsed.data.bookId)) return res.status(404).json({ error: 'book_not_found' });

  const id = uuidv4();
  const now = new Date().toISOString();
  const job: Job = {
    id,
    bookId: parsed.data.bookId,
    type: parsed.data.type,
    status: 'queued',
    progress: 0,
    createdAt: now,
    updatedAt: now
  };

  jobs.set(id, job);
  res.status(201).json(job);
});

app.get('/v1/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job_not_found' });
  res.json(job);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`[api] listening on :${port}`);
});
