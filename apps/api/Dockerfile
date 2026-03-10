# Bookvoice API - Clean Dockerfile for Zeabur
FROM node:22-alpine

WORKDIR /app

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

# Copy root package files
COPY package.json package-lock.json ./
COPY .npmrc ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# Copy packages source (needed for workspace references)
COPY packages ./packages

# Install all dependencies
RUN npm ci

# Copy apps source
COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["npx", "tsx", "src/main.ts"]
