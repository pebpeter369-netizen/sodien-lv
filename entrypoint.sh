#!/bin/sh

# If the volume database doesn't exist, try seed first then create tables
if [ ! -f /app/data/sodien.db ]; then
  echo "Initializing database..."
  if [ -f /app/data-seed/sodien.db ]; then
    cp -f /app/data-seed/sodien.db /app/data/sodien.db
    [ -f /app/data-seed/sodien.db-wal ] && cp -f /app/data-seed/sodien.db-wal /app/data/sodien.db-wal
    echo "Database copied from seed."
  fi
fi

# Always ensure tables exist (handles empty db or missing seed)
node -e "
const db=require('better-sqlite3')('/app/data/sodien.db');
db.exec(\`
CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, meta_description TEXT NOT NULL, content TEXT NOT NULL, excerpt TEXT NOT NULL, topic TEXT NOT NULL, type TEXT NOT NULL, source_urls TEXT, thumbnail_url TEXT, thumbnail_author TEXT, status TEXT NOT NULL DEFAULT 'draft', views INTEGER DEFAULT 0, published_at INTEGER, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS name_days (id INTEGER PRIMARY KEY AUTOINCREMENT, date_month INTEGER NOT NULL, date_day INTEGER NOT NULL, names TEXT NOT NULL, extended_names TEXT);
CREATE TABLE IF NOT EXISTS holidays (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, date_month INTEGER, date_day INTEGER, date_rule TEXT, is_public_holiday INTEGER NOT NULL, description TEXT NOT NULL, traditions TEXT, year_dates TEXT);
CREATE TABLE IF NOT EXISTS trending_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, source_type TEXT NOT NULL, source_url TEXT, last_checked INTEGER, is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS trending_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, source_type TEXT NOT NULL, source_url TEXT, first_seen INTEGER NOT NULL, mention_count INTEGER DEFAULT 1, is_processed INTEGER DEFAULT 0, article_id INTEGER REFERENCES articles(id));
CREATE TABLE IF NOT EXISTS subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'active', subscribed_at INTEGER DEFAULT (unixepoch()), unsubscribed_at INTEGER);
CREATE TABLE IF NOT EXISTS name_details (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, origin TEXT, meaning TEXT, famous_persons TEXT, popularity TEXT, description TEXT);
\`);
console.log('Database tables verified.');
"
echo "Database ready."

exec node server.js
