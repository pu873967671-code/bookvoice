# Web Dockerfile - monorepo aware
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY package-lock.json ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install all dependencies
RUN npm ci

WORKDIR /app/apps/web

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app/apps/web

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
