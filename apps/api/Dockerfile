# API Dockerfile - Force npm for monorepo
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package.json package-lock.json ./

# Copy workspace packages
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

# Install dependencies with npm (not pnpm)
RUN npm ci --include=dev

# Copy source code
COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["npx", "tsx", "src/main.ts"]
