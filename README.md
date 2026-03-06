# bookvoice

Upload ebooks and convert them into audiobooks with AI TTS.

## Monorepo layout

- `apps/api` - API service (NestJS planned)
- `apps/worker` - async workers (parse/tts/render)
- `packages/db` - database schema + migrations
- `packages/shared` - shared DTO/types
- `infra` - local infra (postgres/redis/minio)
- `scripts` - helper scripts

## Quick plan

1. Upload + parse epub/txt
2. Chapter preview
3. TTS per chapter (Azure)
4. Render full mp3
5. Quota system (free: 3 books / 300k chars)

