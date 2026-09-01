#!/usr/bin/env bash
# Ensure MAX_BODY_BYTES=8388608 in hosting .env.production (task 2.3).
#
# Usage:
#   bash scripts/ensure-hosting-max-body-bytes.sh

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-levelhst}"
REMOTE_HOST="${REMOTE_HOST:-levelhst.ftp.tools}"
REMOTE_SITE="${REMOTE_SITE:-/home/levelhst/nmt.in.ua/www}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"

SSH=(ssh -i "$SSH_KEY" -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=30)

"${SSH[@]}" "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<REMOTE
set -euo pipefail
ENV_FILE="${REMOTE_SITE}/.env.production"
touch "\$ENV_FILE"
chmod 640 "\$ENV_FILE"
if grep -q '^MAX_BODY_BYTES=' "\$ENV_FILE"; then
  sed -i 's/^MAX_BODY_BYTES=.*/MAX_BODY_BYTES=8388608/' "\$ENV_FILE"
else
  printf '\nMAX_BODY_BYTES=8388608\n' >> "\$ENV_FILE"
fi
grep '^MAX_BODY_BYTES=' "\$ENV_FILE"
REMOTE

echo "OK: MAX_BODY_BYTES set on ${REMOTE_HOST}"
