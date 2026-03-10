# Web Dockerfile - Simple and direct
FROM node:20-alpine AS builder

WORKDIR /app/apps/web

# Copy web app files only
COPY apps/web/package*.json ./
COPY apps/web ./

# Install and build
RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
