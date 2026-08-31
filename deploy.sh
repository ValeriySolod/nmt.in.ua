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
pkill -f '/home/levelhst/nmt.in.ua/www/ && .*npm run start' || true

echo "Deploy finished: $(git rev-parse --short HEAD)"
