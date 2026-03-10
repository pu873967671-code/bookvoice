# Web Dockerfile - Copy all workspace files
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy ALL workspace packages (important!)
COPY apps ./apps
COPY packages ./packages

# Install all dependencies
RUN npm ci

# Build web app
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app/apps/web

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
