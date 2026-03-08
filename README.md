# bookvoice

> GitHub template repo: click **Use this template** to create your own BookVoice app.

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
- optional MinIO / S3 object storage upload after render
- auto-create bucket support for local/dev CI
- download endpoint: `GET /v1/books/:id/download`
- when `USE_OBJECT_STORAGE=true`, download endpoint returns signed URL JSON
- GitHub Actions smoke test workflow included for both filesystem mode and object storage mode

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

Local file mode:

```bash
curl -L http://localhost:3000/v1/books/<BOOK_ID>/download -o output.mp3
```

Object storage mode (`USE_OBJECT_STORAGE=true`):

```bash
curl http://localhost:3000/v1/books/<BOOK_ID>/download
```

Returns JSON like:

```json
{
  "mode": "signed_url",
  "url": "http://...",
  "expiresInSec": 3600,
  "objectKey": "renders/<BOOK_ID>.mp3",
  "format": "mp3"
}
```

## Smoke test

Run the end-to-end local smoke test in filesystem mode:

```bash
./scripts/smoke-phase4.sh
```

Run object storage mode:

```bash
USE_OBJECT_STORAGE=true S3_BUCKET=bookvoice-dev ./scripts/smoke-phase4.sh
```

Useful overrides:

```bash
API_PORT=3301 MOCK_TTS=true ./scripts/smoke-phase4.sh
MOCK_TTS=false ./scripts/smoke-phase4.sh
USE_OBJECT_STORAGE=true S3_AUTO_CREATE_BUCKET=true ./scripts/smoke-phase4.sh
```

CI also runs `.github/workflows/smoke-test.yml` on push / PR in both modes.

Smoke script now uses a fresh random `userId` by default, so repeated local/CI runs do not get blocked by accumulated quota usage.

## Azure TTS

Set:

```bash
MOCK_TTS=false
AZURE_TTS_KEY=your_key
AZURE_TTS_REGION=eastasia
AZURE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

Current implementation calls Azure Speech REST API directly and writes MP3 files locally.

## MinIO / S3 object storage

Default local dev uses filesystem only.

To enable object storage upload + signed URL download:

```bash
USE_OBJECT_STORAGE=true
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=bookvoice-dev
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_AUTO_CREATE_BUCKET=true
SIGNED_URL_EXPIRES_SEC=3600
```

Current behavior:
- worker still renders local mp3 first
- if object storage enabled, worker uploads rendered mp3 to S3/MinIO
- API download endpoint returns a signed download URL JSON instead of direct file stream
- missing bucket can be auto-created in local/dev mode

## Template repo notes

This repo is configured as a GitHub template.

Recommended first steps after creating your own copy:
- rename repo
- update `.env`
- run smoke test
- optionally set up your own GitHub Actions secrets for real TTS

## License

MIT

## Notes

- `audio_url` currently stores local relative paths, not public URLs.
- chapter mp3 files are still local filesystem artifacts for now.
- next natural step: upload chapter audio too, add cleanup lifecycle, and persist richer asset metadata.
