-- BookVoice initial schema (PostgreSQL)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  plan text not null default 'free' check (plan in ('free','pro')),
  timezone text not null default 'Asia/Shanghai',
  created_at timestamptz not null default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  source_object_key text not null,
  source_text text,
  language text not null default 'zh-CN',
  status text not null default 'uploaded',
  total_chars int not null default 0,
  render_object_key text,
  render_format text,
  created_at timestamptz not null default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  chapter_index int not null,
  title text,
  text_content text not null,
  char_count int not null default 0,
  audio_url text,
  duration_sec int,
  created_at timestamptz not null default now(),
  unique (book_id, chapter_index)
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  job_type text not null check (job_type in ('parse','tts','render')),
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  error_message text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quota_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  cycle_month text not null,
  book_limit int not null default 3,
  book_used int not null default 0,
  char_limit int not null default 300000,
  char_used int not null default 0,
  bonus_book int not null default 0,
  bonus_char int not null default 0,
  reset_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cycle_month)
);

create table if not exists quota_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  cycle_month text not null,
  book_id uuid references books(id) on delete set null,
  action text not null check (action in ('reserve','consume','refund')),
  book_delta int not null default 0,
  char_delta int not null default 0,
  reason text,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_books_user_created on books(user_id, created_at desc);
create index if not exists idx_jobs_user_created on jobs(user_id, created_at desc);
create index if not exists idx_chapters_book_idx on chapters(book_id, chapter_index);
create index if not exists idx_quota_ledger_user_month on quota_ledger(user_id, cycle_month);
