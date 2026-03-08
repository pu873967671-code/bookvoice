#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

API_PORT="${API_PORT:-3301}"
MOCK_TTS="${MOCK_TTS:-true}"
WAIT_SECS="${WAIT_SECS:-60}"
TEST_TITLE="${TEST_TITLE:-Phase4 Smoke Test}"
OUT_FILE="${OUT_FILE:-/tmp/bookvoice-smoke-output.mp3}"
LOG_DIR="${LOG_DIR:-/tmp/bookvoice-smoke}"
USE_OBJECT_STORAGE="${USE_OBJECT_STORAGE:-false}"
S3_BUCKET="${S3_BUCKET:-bookvoice-dev}"
S3_AUTO_CREATE_BUCKET="${S3_AUTO_CREATE_BUCKET:-true}"
USER_ID="${USER_ID:-$(python3 -c 'import uuid; print(uuid.uuid4())')}"
mkdir -p "$LOG_DIR"

API_LOG="$LOG_DIR/api.log"
WORKER_LOG="$LOG_DIR/worker.log"
HEALTH_JSON="$LOG_DIR/health.json"
BOOK_JSON="$LOG_DIR/book.json"
BOOK_STATE_JSON="$LOG_DIR/book-state.json"
DOWNLOAD_JSON="$LOG_DIR/download.json"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then kill "$API_PID" 2>/dev/null || true; fi
  if [[ -n "${WORKER_PID:-}" ]]; then kill "$WORKER_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[smoke] missing command: $1" >&2
    exit 1
  }
}

json_get() {
  local key="$1"
  python3 -c 'import json,sys; print(json.load(sys.stdin)[sys.argv[1]])' "$key"
}

wait_job_done() {
  local job_id="$1"
  local label="$2"
  local url="http://127.0.0.1:${API_PORT}/v1/jobs/${job_id}"

  for _ in $(seq 1 "$WAIT_SECS"); do
    local body
    body="$(curl -sf "$url")"
    local status
    status="$(printf '%s' "$body" | python3 -c 'import sys,json;print(json.load(sys.stdin)["status"])')"
    echo "[smoke] ${label} status=${status}"
    if [[ "$status" == "done" ]]; then
      return 0
    fi
    if [[ "$status" == "failed" ]]; then
      echo "[smoke] ${label} failed: $body" >&2
      return 1
    fi
    sleep 1
  done

  echo "[smoke] ${label} timeout after ${WAIT_SECS}s" >&2
  return 1
}

need_cmd docker
need_cmd curl
need_cmd ffprobe
need_cmd python3
need_cmd npm

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

echo "[smoke] starting infra"
docker compose -f infra/docker-compose.yml up -d >/dev/null

echo "[smoke] applying schema"
python3 - <<'PY'
import os, time, subprocess, sys
root = os.getcwd()
for _ in range(60):
    p = subprocess.run([
        'docker','compose','-f','infra/docker-compose.yml','exec','-T','postgres',
        'psql','-U','postgres','-d','bookvoice','-c','select 1'
    ], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if p.returncode == 0:
        break
    time.sleep(1)
else:
    print('[smoke] postgres not ready', file=sys.stderr)
    sys.exit(1)
subprocess.run([
    'docker','compose','-f','infra/docker-compose.yml','exec','-T','postgres',
    'psql','-U','postgres','-d','bookvoice'
], cwd=root, input=open(os.path.join(root,'packages/db/schema.sql'),'rb').read(), check=True)
PY

echo "[smoke] ensuring deps"
npm install >/dev/null

echo "[smoke] starting api on :${API_PORT}"
PORT="$API_PORT" \
USE_OBJECT_STORAGE="$USE_OBJECT_STORAGE" \
S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:9000}" \
S3_REGION="${S3_REGION:-us-east-1}" \
S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-minioadmin}" \
S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-minioadmin}" \
S3_BUCKET="$S3_BUCKET" \
S3_AUTO_CREATE_BUCKET="$S3_AUTO_CREATE_BUCKET" \
npm run start:api >"$API_LOG" 2>&1 &
API_PID=$!

echo "[smoke] starting worker (MOCK_TTS=${MOCK_TTS}, USE_OBJECT_STORAGE=${USE_OBJECT_STORAGE})"
MOCK_TTS="$MOCK_TTS" \
USE_OBJECT_STORAGE="$USE_OBJECT_STORAGE" \
S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:9000}" \
S3_REGION="${S3_REGION:-us-east-1}" \
S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-minioadmin}" \
S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-minioadmin}" \
S3_BUCKET="$S3_BUCKET" \
S3_AUTO_CREATE_BUCKET="$S3_AUTO_CREATE_BUCKET" \
npm run start:worker >"$WORKER_LOG" 2>&1 &
WORKER_PID=$!

echo "[smoke] waiting for api health"
for _ in $(seq 1 "$WAIT_SECS"); do
  if curl -sf "http://127.0.0.1:${API_PORT}/health" >"$HEALTH_JSON"; then
    cat "$HEALTH_JSON"
    echo
    break
  fi
  sleep 1
done

if [[ ! -s "$HEALTH_JSON" ]]; then
  echo "[smoke] api health failed" >&2
  echo "--- api log ---" >&2
  tail -100 "$API_LOG" >&2 || true
  exit 1
fi

BOOK_PAYLOAD=$(cat <<JSON
{
  "title": "${TEST_TITLE}",
  "sourceText": "第一章\n今天天气很好，我哋开始测试。\n\n第二章\n而家进入 render 阶段。\n\n第三章\n下载接口都要通。",
  "userId": "${USER_ID}"
}
JSON
)

printf '%s' "$BOOK_PAYLOAD" | curl -sf "http://127.0.0.1:${API_PORT}/v1/books" \
  -H 'content-type: application/json' \
  -d @- >"$BOOK_JSON"
cat "$BOOK_JSON"
echo
BOOK_ID="$(cat "$BOOK_JSON" | json_get id)"

echo "[smoke] created book: ${BOOK_ID}"
echo "[smoke] userId=${USER_ID}"

for TYPE in parse tts render; do
  JOB_JSON="$LOG_DIR/${TYPE}-job.json"
  curl -sf "http://127.0.0.1:${API_PORT}/v1/jobs" \
    -H 'content-type: application/json' \
    -d "{\"bookId\":\"${BOOK_ID}\",\"type\":\"${TYPE}\",\"userId\":\"${USER_ID}\"}" >"$JOB_JSON"
  cat "$JOB_JSON"
  echo
  JOB_ID="$(cat "$JOB_JSON" | json_get id)"
  wait_job_done "$JOB_ID" "$TYPE"
done

curl -sf "http://127.0.0.1:${API_PORT}/v1/books/${BOOK_ID}" >"$BOOK_STATE_JSON"
cat "$BOOK_STATE_JSON"
echo

RENDER_KEY="$(cat "$BOOK_STATE_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("renderObjectKey") or "")')"
RENDER_FORMAT="$(cat "$BOOK_STATE_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("renderFormat") or "")')"

if [[ -z "$RENDER_KEY" || "$RENDER_FORMAT" != "mp3" ]]; then
  echo "[smoke] render metadata invalid: key=${RENDER_KEY} format=${RENDER_FORMAT}" >&2
  exit 1
fi

if [[ "$USE_OBJECT_STORAGE" == "true" ]]; then
  curl -sf "http://127.0.0.1:${API_PORT}/v1/books/${BOOK_ID}/download" >"$DOWNLOAD_JSON"
  cat "$DOWNLOAD_JSON"
  echo
  SIGNED_URL="$(cat "$DOWNLOAD_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("url") or "")')"
  MODE="$(cat "$DOWNLOAD_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("mode") or "")')"
  if [[ -z "$SIGNED_URL" || "$MODE" != "signed_url" ]]; then
    echo "[smoke] invalid signed download response" >&2
    exit 1
  fi
  curl -fL "$SIGNED_URL" -o "$OUT_FILE"
else
  curl -fL "http://127.0.0.1:${API_PORT}/v1/books/${BOOK_ID}/download" -o "$OUT_FILE"
fi

ls -lh "$OUT_FILE"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT_FILE"

echo
if [[ "$USE_OBJECT_STORAGE" == "true" ]]; then
  echo "[smoke] PASS (object storage mode)"
else
  echo "[smoke] PASS (filesystem mode)"
fi
echo "[smoke] bookId=${BOOK_ID}"
echo "[smoke] userId=${USER_ID}"
echo "[smoke] output=${OUT_FILE}"
echo "[smoke] logs=${LOG_DIR}"
