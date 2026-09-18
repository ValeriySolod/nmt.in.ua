#!/usr/bin/env bash
# Remove leftover PHP uploads from the account-wide tmp (ukraine.com.ua).
# Does not touch PHP session files (sess_*). Run after the host AV flags
# files in ~/.system/tmp, then rescan in the panel.
#
#   bash scripts/hosting-clean-php-tmp.sh

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-levelhst}"
REMOTE_HOST="${REMOTE_HOST:-levelhst.ftp.tools}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"

if [ ! -f "$SSH_KEY" ]; then
  echo "SSH key not found: $SSH_KEY" >&2
  exit 1
fi

ssh -i "$SSH_KEY" -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=30 \
  "${REMOTE_USER}@${REMOTE_HOST}" 'bash -s' <<'REMOTE'
set -euo pipefail
dir="${HOME}/.system/tmp"
if [ ! -d "$dir" ]; then
  echo "no $dir"
  exit 0
fi
removed=0
for f in "$dir"/*; do
  [ -f "$f" ] || continue
  base="$(basename "$f")"
  case "$base" in
    sess_*) continue ;;
  esac
  head="$(dd if="$f" bs=5 count=1 2>/dev/null || true)"
  if [ "$head" = "<?php" ]; then
    rm -f "$f"
    echo "removed $base"
    removed=$((removed + 1))
  fi
done
echo "done, removed ${removed} php tmp file(s)"
ls -la "$dir"
REMOTE
