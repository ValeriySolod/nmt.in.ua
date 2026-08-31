#!/usr/bin/env bash
# Manual deploy to ukraine.com.ua shared hosting (nmt.in.ua).
# Build locally (modern glibc), upload over SSH pipe, restart Node on server.
#
# Prerequisites:
#   - SSH key access: levelhst@levelhst.ftp.tools
#   - .env.production already on server at $REMOTE_SITE/.env.production
#
# Usage (from repo root, Git Bash / Linux / macOS):
#   bash scripts/manual-deploy-hosting.sh

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-levelhst}"
REMOTE_HOST="${REMOTE_HOST:-levelhst.ftp.tools}"
REMOTE_SITE="${REMOTE_SITE:-/home/levelhst/nmt.in.ua/www}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
REMOTE_HOST_IP="${REMOTE_HOST_IP:-127.1.10.37}"
REMOTE_PORT="${REMOTE_PORT:-3000}"

SSH=(ssh -i "$SSH_KEY" -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=30)
SCP_VIA_SSH() { "${SSH[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "$@"; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building locally..."
npm ci
npm run build

ARCHIVE="$(mktemp /tmp/nmt-site-XXXXXX.tar.gz)"
trap 'rm -f "$ARCHIVE"' EXIT

echo "==> Packing (no node_modules, no .git)..."
tar \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env.local \
  --exclude=.env \
  --exclude='*.tar.gz' \
  -czf "$ARCHIVE" .

ls -lh "$ARCHIVE"

echo "==> Uploading to ${REMOTE_USER}@${REMOTE_HOST}..."
SCP_VIA_SSH "cat > /home/levelhst/nmt-manual-deploy.tar.gz" < "$ARCHIVE"

echo "==> Installing on server and restarting..."
SCP_VIA_SSH bash -s <<REMOTE
set -euo pipefail
export PATH="/usr/local/node24/bin:/usr/local/bin:/usr/bin:\${PATH}"
SITE="${REMOTE_SITE}"
ENV_BAK="\${HOME}/nmt.env.production.bak"

killall -9 node 2>/dev/null || true
sleep 2

if [ -f "\$SITE/.env.production" ]; then
  cp -a "\$SITE/.env.production" "\$ENV_BAK"
fi

chmod -R u+w "\$SITE" 2>/dev/null || true
find "\$SITE" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
mkdir -p "\$SITE"
tar -xzf /home/levelhst/nmt-manual-deploy.tar.gz -C "\$SITE"
rm -f /home/levelhst/nmt-manual-deploy.tar.gz

if [ -f "\$ENV_BAK" ]; then
  cp -a "\$ENV_BAK" "\$SITE/.env.production"
  chmod 640 "\$SITE/.env.production"
fi

cd "\$SITE"
npm install --omit=dev --no-audit --no-fund --prefer-offline

export NODE_ENV=production
export PORT=${REMOTE_PORT}
export HOST=${REMOTE_HOST_IP}
LOG="/home/levelhst/.system/nodejs/logs/www.nmt.in.ua.log"
mkdir -p "\$(dirname "\$LOG")"
nohup node server.js >>"\$LOG" 2>&1 &

sleep 4
curl -sf --max-time 10 "http://\${HOST}:\${PORT}/" >/dev/null
echo "OK: nmt.in.ua is up (BUILD_ID=\$(cat .next/BUILD_ID))"
REMOTE

echo "==> Done. Check https://nmt.in.ua/"
