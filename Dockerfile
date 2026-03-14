# ClawRead - Root Dockerfile for Zeabur
# 默认部署合并的 API + Worker 服务
# 使用 Dockerfile.combined 解决存储不共享问题

FROM node:22-alpine

WORKDIR /app

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

# Copy root package files
COPY package.json package-lock.json* ./

# Copy ALL workspace package.json files (monorepo)
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (use npm install for flexibility)
RUN npm install

# Copy ALL source code
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

# Create storage directory (will be overridden by Volume mount)
RUN mkdir -p /data/storage && chmod 777 /data/storage

ENV PORT=8080
ENV STORAGE_ROOT=/data/storage
EXPOSE 8080

# Start script for both API and Worker in same container
RUN printf '#!/bin/sh\n\
echo "[combined] Starting Worker..."\n\
cd /app/apps/worker && npx tsx src/main.ts &\n\
WORKER_PID=$!\n\
echo "[combined] Worker started with PID $WORKER_PID"\n\
echo "[combined] Starting API..."\n\
cd /app/apps/api && exec npx tsx src/main.ts\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
