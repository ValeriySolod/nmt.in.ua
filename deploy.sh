#!/bin/bash
set -euo pipefail

SITE_DIR="/home/levelhst/nmt.in.ua/www"
LOCK_DIR="${HOME}/.cache"
LOCK_FILE="${LOCK_DIR}/nmt.in.ua.deploy.lock"
LOG_FILE="/home/levelhst/.system/nodejs/logs/www.nmt.in.ua.log"
DEPLOY_ARCHIVE="${DEPLOY_ARCHIVE:-/home/levelhst/nmt.in.ua/next-build.tar.gz}"

if [ ! -d "$SITE_DIR" ]; then
  echo "nmt.in.ua directory not found"
  exit 1
fi

cd "$SITE_DIR"

if [ "$(pwd -P)" != "$(cd "$SITE_DIR" && pwd -P)" ]; then
  echo "Refusing to deploy outside nmt.in.ua"
  exit 1
fi

mkdir -p "$LOCK_DIR" 2>/dev/null || true
if command -v flock >/dev/null 2>&1; then
  if ( : >>"$LOCK_FILE" ) 2>/dev/null; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
      echo "Another nmt.in.ua deploy is already running"
      exit 1
    fi
  else
    echo "Warning: deploy lock unavailable, continuing without flock"
  fi
fi

export PATH="/usr/local/node24/bin:/usr/local/bin:/usr/bin:${PATH}"
export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOST="${HOST:-127.1.10.37}"

stop_app() {
  echo "Stopping nmt.in.ua Node.js"
  while read -r pid; do
    [ -n "$pid" ] || continue
    [ "$pid" = "$$" ] && continue
    [ "$pid" = "$PPID" ] && continue
    kill "$pid" 2>/dev/null || true
  done < <(pgrep -f '/home/levelhst/nmt.in.ua/www.*(npm run start|node server\.js)' || true)
  sleep 2
}

clear_next_dir() {
  if [ -e .next ]; then
    chmod -R u+w .next 2>/dev/null || true
    rm -rf .next
  fi
  if [ -e .next ]; then
    echo "Cannot remove .next — directory is not writable" >&2
    ls -ld .next >&2 || true
    exit 1
  fi
}

echo "Deploying nmt.in.ua"
stop_app

git fetch origin main
git checkout main
git reset --hard origin/main

echo "Installing production dependencies"
npm install --omit=dev --no-audit --no-fund --prefer-offline

if [ ! -f "$DEPLOY_ARCHIVE" ]; then
  echo "Build archive not found: $DEPLOY_ARCHIVE" >&2
  echo "CI must upload next-build.tar.gz before running deploy.sh" >&2
  exit 1
fi

echo "Unpacking CI build into .next"
clear_next_dir
tar -xzf "$DEPLOY_ARCHIVE" -C "$SITE_DIR"
if [ ! -d .next ]; then
  echo "Archive did not contain .next" >&2
  exit 1
fi
rm -f "$DEPLOY_ARCHIVE"

echo "Starting nmt.in.ua Node.js"
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
nohup node server.js >>"$LOG_FILE" 2>&1 &
echo "Started node PID $!"

ok=0
for _ in 1 2 3 4 5 6 7 8; do
  sleep 3
  if curl -sf --max-time 5 "http://${HOST}:${PORT}/" >/dev/null; then
    ok=1
    break
  fi
done

if [ "$ok" -eq 1 ]; then
  echo "nmt.in.ua is up on ${HOST}:${PORT}"
else
  echo "nmt.in.ua did not respond on ${HOST}:${PORT}" >&2
  tail -n 80 "$LOG_FILE" 2>/dev/null || true
  exit 1
fi

echo "Deploy finished: $(git rev-parse --short HEAD)"
