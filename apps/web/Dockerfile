# Next.js Web App Dockerfile (monorepo aware)
FROM node:20-alpine

WORKDIR /app

# Copy ALL package.json files first (for better caching)
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies at root (monorepo workspace)
RUN npm install

# Copy ALL source code
COPY apps/web ./apps/web
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

# Build from workspace root to ensure correct resolution
WORKDIR /app
RUN npm run build --workspace @clawread/web

EXPOSE 8080

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

WORKDIR /app/apps/web
CMD ["npm", "run", "start", "--workspace", "@clawread/web"]
