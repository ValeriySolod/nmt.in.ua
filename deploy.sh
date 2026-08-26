#!/bin/bash
set -euo pipefail

SITE_DIR="/home/levelhst/nmt.in.ua/www"
LOCK_FILE="/tmp/nmt.in.ua.deploy.lock"

if [ ! -d "$SITE_DIR" ]; then
  echo "nmt.in.ua directory not found"
  exit 1
fi

cd "$SITE_DIR"

if [ "$(pwd -P)" != "$(cd "$SITE_DIR" && pwd -P)" ]; then
  echo "Refusing to deploy outside nmt.in.ua"
  exit 1
fi

# One deploy at a time for this site (avoids stuck parallel npm/build).
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "Another nmt.in.ua deploy is already running"
    exit 1
  fi
fi

export PATH="/usr/local/node24/bin:/usr/local/bin:/usr/bin:${PATH}"

echo "Deploying nmt.in.ua"
git fetch origin main
git checkout main
git reset --hard origin/main

npm install
npm run build

echo "Restarting nmt.in.ua Node.js"
# Kill only running app processes for this site (never the deploy shell itself).
while read -r pid; do
  [ -n "$pid" ] || continue
  [ "$pid" = "$$" ] && continue
  [ "$pid" = "$PPID" ] && continue
  kill "$pid" 2>/dev/null || true
done < <(pgrep -f '/home/levelhst/nmt.in.ua/www.*(npm run start|node server\.js)' || true)
sleep 2

export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOST="${HOST:-127.1.10.37}"

nohup node server.js >> /home/levelhst/.system/nodejs/logs/www.nmt.in.ua.log 2>&1 &
echo "Started node PID $!"
sleep 5

if curl -sf --max-time 5 "http://${HOST}:${PORT}/" >/dev/null; then
  echo "nmt.in.ua is up on ${HOST}:${PORT}"
else
  echo "nmt.in.ua did not respond on ${HOST}:${PORT}" >&2
  tail -n 50 /home/levelhst/.system/nodejs/logs/www.nmt.in.ua.log || true
  exit 1
fi

echo "Deploy finished: $(git rev-parse --short HEAD)"
