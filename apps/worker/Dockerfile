FROM node:20-alpine

WORKDIR /app

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Start worker
CMD ["npm", "start"]
