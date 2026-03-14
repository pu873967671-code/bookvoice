#!/bin/sh
# Start Worker in background
cd /app/apps/worker
npx tsx src/main.ts &

# Start API in foreground
cd /app/apps/api
exec npx tsx src/main.ts
