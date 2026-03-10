# API Dockerfile - monorepo aware
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

# Copy root package files
COPY package*.json ./
COPY package-lock.json ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install all dependencies from root
RUN npm ci --include=dev

# Build if needed (TypeScript projects)
# RUN npm run build --workspace @bookvoice/api

WORKDIR /app/apps/api

# Expose port
EXPOSE 3001

# Start
CMD ["npx", "tsx", "src/main.ts"]
