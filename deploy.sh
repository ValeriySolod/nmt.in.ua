#!/bin/bash
set -euo pipefail

SITE_DIR="/home/levelhst/nmt.in.ua/www"

if [ ! -d "$SITE_DIR" ]; then
  echo "nmt.in.ua directory not found"
  exit 1
fi

cd "$SITE_DIR"

if [ "$(pwd -P)" != "$(cd "$SITE_DIR" && pwd -P)" ]; then
  echo "Refusing to deploy outside nmt.in.ua"
  exit 1
fi

export PATH="/usr/local/node24/bin:/usr/local/bin:/usr/bin:${PATH}"

echo "Deploying nmt.in.ua"
git fetch origin main
git checkout main
git reset --hard origin/main

npm install
npm run build

echo "Restarting nmt.in.ua Node.js"
pkill -f 'nmt.in.ua/www.*(npm run start|server\.js)' || true
sleep 2

export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOST="${HOST:-127.1.10.37}"

nohup npm run start >> /home/levelhst/.system/nodejs/logs/www.nmt.in.ua.log 2>&1 &
sleep 5

if curl -sf --max-time 5 "http://${HOST}:${PORT}/" >/dev/null; then
  echo "nmt.in.ua is up on ${HOST}:${PORT}"
else
  echo "nmt.in.ua did not respond on ${HOST}:${PORT}" >&2
  tail -n 50 /home/levelhst/.system/nodejs/logs/www.nmt.in.ua.log || true
  exit 1
fi

echo "Deploy finished: $(git rev-parse --short HEAD)"
