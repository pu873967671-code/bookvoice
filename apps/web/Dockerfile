# Web Dockerfile - Standalone mode
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci --workspace @bookvoice/web

# Copy source
COPY apps/web ./apps/web

# Build standalone
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 8080

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
