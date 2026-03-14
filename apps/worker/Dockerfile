# ClawRead Worker - Dockerfile for Zeabur
FROM node:22-alpine

WORKDIR /app

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

# Copy ALL package.json files first (for better caching)
COPY package.json package-lock.json* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies at root (monorepo workspace)
RUN npm install

# Copy ALL source code
COPY apps/worker ./apps/worker
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

# Build from workspace root to ensure correct resolution
WORKDIR /app

CMD ["npm", "run", "start", "--workspace", "@clawread/worker"]
