# bookvoice

Upload ebooks and convert them into audiobooks with AI TTS.

## Current scaffold (solo-friendly MVP)

- `apps/api`: REST API skeleton (`/health`, `/v1/books`, `/v1/jobs/:id`)
- `apps/worker`: BullMQ worker skeleton (`parse`, `tts`, `render`)
- `packages/db/schema.sql`: PostgreSQL schema (books/jobs/quota)
- `infra/docker-compose.yml`: postgres + redis + minio

## Quick start

```bash
cd /home/pupu/.openclaw/workspace/bookvoice
./scripts/run-local.sh
```

Then run in separate terminals:

```bash
npm run dev:api
npm run dev:worker
```

API default: `http://localhost:3000`

## Next implementation steps

1. Replace in-memory API storage with PostgreSQL
2. Wire API -> BullMQ (create job into queue)
3. Implement parser workers (epub/txt first)
4. Implement Azure TTS adapter
5. Add quota reserve/consume/refund flow

