export type JobType = 'parse' | 'tts' | 'render';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Book {
  id: string;
  title: string;
  sourceObjectKey: string;
  language: string;
  totalChars: number;
  createdAt: string;
}

export interface Job {
  id: string;
  bookId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
