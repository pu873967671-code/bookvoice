# Web Dockerfile - Standalone mode
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all package files for monorepo
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/ 2>/dev/null || true

# Install dependencies
RUN npm ci

# Copy source files
COPY apps/web ./apps/web
COPY packages ./packages

# Build with standalone output
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy standalone output (Next.js 14 should create this with output: 'standalone')
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 8080

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
