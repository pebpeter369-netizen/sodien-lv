#!/bin/sh
# Off-site backup of the tavadiena production SQLite database.
#
# Pulls a *consistent* snapshot (SQLite online .backup, WAL merged) from the
# Fly volume down to ./backups/, validates it, and rotates old copies.
# Runs daily via ~/Library/LaunchAgents/lv.tavadiena.dbbackup.plist, and can
# also be run by hand:  sh scripts/backup-prod-db.sh
set -eu

APP="tavadiena"
PROJECT_DIR="/Users/peterisp/sodien-lv"
BACKUP_DIR="$PROJECT_DIR/backups"
KEEP=14                      # how many daily backups to retain locally
LOG="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

# launchd runs with a minimal PATH — locate the tools explicitly.
FLY="$(command -v fly 2>/dev/null || true)"
[ -z "$FLY" ] && [ -x /opt/homebrew/bin/fly ] && FLY=/opt/homebrew/bin/fly
[ -z "$FLY" ] && [ -x /usr/local/bin/fly ] && FLY=/usr/local/bin/fly
if [ -z "$FLY" ]; then log "ERROR: fly CLI not found"; exit 1; fi

SQLITE="$(command -v sqlite3 2>/dev/null || echo /usr/bin/sqlite3)"

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/sodien-prod-$TS.db"

log "starting backup"

# 1. Create a consistent backup file on the volume (online .backup, readonly source)
"$FLY" ssh console -a "$APP" -C 'node -e "const d=require(\"/app/node_modules/better-sqlite3\")(\"/app/data/sodien.db\",{readonly:true}); d.backup(\"/app/data/sodien-backup.db\").then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})"' >> "$LOG" 2>&1

# 2. Download it
"$FLY" ssh sftp get /app/data/sodien-backup.db "$OUT" -a "$APP" >> "$LOG" 2>&1

# 3. Remove the temp file from the volume
"$FLY" ssh console -a "$APP" -C "rm -f /app/data/sodien-backup.db" >> "$LOG" 2>&1

# 4. Validate: file must be non-empty and contain published articles
if [ ! -s "$OUT" ]; then log "ERROR: backup empty/missing — aborting"; rm -f "$OUT"; exit 1; fi
COUNT="$("$SQLITE" "$OUT" "SELECT COUNT(*) FROM articles;" 2>/dev/null || echo 0)"
if [ "$COUNT" -lt 1 ]; then log "ERROR: backup has 0 articles — keeping file but failing"; exit 1; fi
log "ok: $(wc -c < "$OUT" | tr -d ' ') bytes, $COUNT articles -> $OUT"

# 5. Rotate: keep the newest $KEEP
ls -1t "$BACKUP_DIR"/sodien-prod-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r f; do
  rm -f "$f"; log "rotated out $f"
done

log "backup complete"
