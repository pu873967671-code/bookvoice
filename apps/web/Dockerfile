# Simple Next.js Dockerfile - Direct build
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci --workspace @bookvoice/web

# Copy web app source
COPY apps/web ./apps/web

# Build
WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
