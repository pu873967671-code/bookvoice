# Web Dockerfile - Force npm for monorepo
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy workspace packages
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

# Install dependencies with npm (not pnpm)
RUN npm ci

# Copy source code
COPY apps/web ./apps/web

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
