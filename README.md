# bookvoice

Upload ebooks and convert them into audiobooks with AI TTS.

## Current MVP

- `apps/api`: REST API (`/health`, `/v1/books`, `/v1/jobs`, `/v1/books/:id/download`)
- `apps/worker`: BullMQ worker (`parse`, `tts`, `render`)
- `packages/db/schema.sql`: PostgreSQL schema (books/jobs/quota)
- `infra/docker-compose.yml`: postgres + redis + minio

## What works now

### Phase 3
- `sourceText` inline upload
- `.txt` / `.epub` parsing
- chapter split + store into `chapters`
- quota reserve / consume / refund flow for TTS

### Phase 4
- Azure TTS adapter wired (set `MOCK_TTS=false` + `AZURE_TTS_KEY`)
- mock TTS still available for local dev
- chapter audio rendered to local `storage/tts/<bookId>/chapter-xxx.mp3`
- full book render via `ffmpeg` concat into `storage/renders/<bookId>.mp3`
- download endpoint: `GET /v1/books/:id/download`

## Quick start

```bash
cd /home/pupu/.openclaw/workspace/bookvoice
cp .env.example .env
./scripts/run-local.sh
```

Then run in separate terminals:

```bash
npm run dev:api
npm run dev:worker
```

API default: `http://localhost:3000`

## Required local tools

- Node.js 20+
- ffmpeg + ffprobe
- Docker (for local postgres/redis/minio)

## Example flow

### 1. Create a book

```bash
curl -s http://localhost:3000/v1/books \
  -H 'content-type: application/json' \
  -d '{
    "title": "Demo Book",
    "sourceText": "第一章\n今天天气很好。\n\n第二章\n我哋继续做 Phase 4。"
  }'
```

### 2. Parse

```bash
curl -s http://localhost:3000/v1/jobs \
  -H 'content-type: application/json' \
  -d '{"bookId":"<BOOK_ID>","type":"parse"}'
```

### 3. TTS

```bash
curl -s http://localhost:3000/v1/jobs \
  -H 'content-type: application/json' \
  -d '{"bookId":"<BOOK_ID>","type":"tts"}'
```

### 4. Render

```bash
curl -s http://localhost:3000/v1/jobs \
  -H 'content-type: application/json' \
  -d '{"bookId":"<BOOK_ID>","type":"render"}'
```

### 5. Download

```bash
curl -L http://localhost:3000/v1/books/<BOOK_ID>/download -o output.mp3
```

## Azure TTS

Set:

```bash
MOCK_TTS=false
AZURE_TTS_KEY=your_key
AZURE_TTS_REGION=eastasia
AZURE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

Current implementation calls Azure Speech REST API directly and writes MP3 files locally.

## Notes

- `audio_url` currently stores local relative paths, not public URLs.
- render output is local filesystem only for now.
- next natural step: object storage upload + signed download URLs + background cleanup.
