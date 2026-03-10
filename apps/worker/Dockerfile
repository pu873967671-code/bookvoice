# Worker Dockerfile - Force npm for monorepo
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package.json package-lock.json ./

# Copy workspace packages
COPY apps/worker/package.json ./apps/worker/
COPY packages ./packages

# Install dependencies with npm (not pnpm)
RUN npm ci --include=dev

# Copy source code
COPY apps/worker ./apps/worker

WORKDIR /app/apps/worker

CMD ["npx", "tsx", "src/main.ts"]
