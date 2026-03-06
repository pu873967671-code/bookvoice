#!/usr/bin/env bash
set -e

echo "[1/3] starting infra..."
docker compose -f infra/docker-compose.yml up -d

echo "[2/3] install deps..."
npm install

echo "[3/3] run api + worker in two terminals:"
echo "npm run dev:api"
echo "npm run dev:worker"
