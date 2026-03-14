# Next.js Web App Dockerfile (monorepo aware)
FROM node:20-alpine

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./
COPY package-lock.json* ./

# Copy all workspace package.json files
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/ 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy all source code
COPY apps/web ./apps/web
COPY packages ./packages

# Build
WORKDIR /app/apps/web
RUN npm run build

EXPOSE 8080

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
