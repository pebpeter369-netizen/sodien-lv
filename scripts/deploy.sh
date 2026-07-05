#!/bin/sh
# Deploy tavadiena to Fly.io with real build-time data.
#
# Content pages are ISR (prerendered at build, revalidated at runtime), so the
# Docker build must see a realistic database — otherwise the first minutes
# after a deploy serve pages baked from the near-empty local dev DB. This
# script refreshes data/sodien.db from the newest validated prod backup
# (scripts/backup-prod-db.sh) before building.
#   sh scripts/deploy.sh
set -eu

PROJECT_DIR="/Users/peterisp/sodien-lv"
cd "$PROJECT_DIR"

LATEST="$(ls -1t backups/sodien-prod-*.db 2>/dev/null | head -1 || true)"
if [ -z "$LATEST" ]; then
  echo "ERROR: no prod backup in backups/ — run: sh scripts/backup-prod-db.sh" >&2
  exit 1
fi

NOW="$(date +%s)"
MTIME="$(stat -f %m "$LATEST")"
AGE_DAYS=$(( (NOW - MTIME) / 86400 ))
echo "Seeding build DB from $LATEST (${AGE_DAYS} day(s) old)"
if [ "$AGE_DAYS" -gt 3 ]; then
  echo "WARNING: backup is ${AGE_DAYS} days old — consider running scripts/backup-prod-db.sh first" >&2
fi

cp -f "$LATEST" data/sodien.db
rm -f data/sodien.db-wal data/sodien.db-shm

fly deploy
