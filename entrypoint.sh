#!/bin/sh

# If the volume database doesn't exist or is tiny (empty), copy the seed
DB_SIZE=$(stat -f%z /app/data/sodien.db 2>/dev/null || echo 0)
if [ ! -f /app/data/sodien.db ] || [ "$DB_SIZE" -lt 10000 ]; then
  echo "Initializing database from seed..."
  cp -f /app/data-seed/sodien.db /app/data/sodien.db
  [ -f /app/data-seed/sodien.db-wal ] && cp -f /app/data-seed/sodien.db-wal /app/data/sodien.db-wal
  echo "Database initialized."
fi

exec node server.js
