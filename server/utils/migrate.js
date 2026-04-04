import { query } from './db.js'

/**
 * Database migration — creates tables if they don't exist.
 * Safe to run multiple times (idempotent).
 */
export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL DEFAULT '',
      avatar_url    TEXT,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS notes (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id   TEXT,
      title       TEXT NOT NULL DEFAULT 'Untitled Note',
      description TEXT NOT NULL DEFAULT '',
      tags        TEXT NOT NULL DEFAULT '[]',
      content     TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  // Index for fast user lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
  `)

  // Unique constraint: one client_id per user (for sync dedup)
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_user_client_id
    ON notes(user_id, client_id) WHERE client_id IS NOT NULL
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS shared_notes (
      id              SERIAL PRIMARY KEY,
      hash            TEXT UNIQUE NOT NULL,
      user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title           TEXT NOT NULL DEFAULT 'Shared Note',
      description     TEXT NOT NULL DEFAULT '',
      tags            TEXT NOT NULL DEFAULT '[]',
      content         TEXT NOT NULL DEFAULT '',
      sharer_name     TEXT,
      sharer_email    TEXT,
      anonymous       BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at      TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_shared_notes_hash ON shared_notes(hash)
  `)

  // Add avatar_url column if missing (for existing databases)
  await query(`
    DO $do$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add deletion_requested columns if missing
  await query(`
    DO $do$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add sort_order column for manual ordering
  await query(`
    DO $do$ BEGIN
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add deleted_at column for soft-delete sync
  await query(`
    DO $do$ BEGIN
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add collect_analytics flag to shared_notes
  await query(`
    DO $do$ BEGIN
      ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS collect_analytics BOOLEAN NOT NULL DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add privacy_no_tracking flag to users (default TRUE — privacy on by default)
  await query(`
    DO $do$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_no_tracking BOOLEAN NOT NULL DEFAULT TRUE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Share views table for analytics
  await query(`
    CREATE TABLE IF NOT EXISTS share_views (
      id              SERIAL PRIMARY KEY,
      shared_note_id  INTEGER NOT NULL REFERENCES shared_notes(id) ON DELETE CASCADE,
      viewer_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      viewer_name     TEXT,
      user_agent      TEXT,
      ip_address      TEXT,
      referrer        TEXT,
      country         TEXT,
      event_type      TEXT NOT NULL DEFAULT 'view',
      viewed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_share_views_shared_note_id ON share_views(shared_note_id)
  `)

  // Add ip_address and event_type columns if missing (for existing databases)
  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'view';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add deleted_at to shared_notes for soft-delete (analytics persist)
  await query(`
    DO $do$ BEGIN
      ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add viewer_fingerprint for identifying unique viewers across repeat visits
  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS viewer_fingerprint TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add extra header columns for richer analytics
  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS accept_language TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS dnt TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS sec_ch_ua TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add city and region columns for IP geolocation
  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  await query(`
    DO $do$ BEGIN
      ALTER TABLE share_views ADD COLUMN IF NOT EXISTS region TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add encrypted flag to shared_notes for E2E encrypted shares
  await query(`
    DO $do$ BEGIN
      ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS encrypted BOOLEAN NOT NULL DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Change notes.tags and shared_notes.tags column type from JSONB to TEXT
  // to support encrypted payloads (encrypted tags are JSON strings like { iv, ct }).
  await query(`
    DO $do$ BEGIN
      ALTER TABLE notes ALTER COLUMN tags TYPE TEXT USING tags::TEXT;
    EXCEPTION WHEN others THEN NULL;
    END $do$
  `)

  await query(`
    DO $do$ BEGIN
      ALTER TABLE shared_notes ALTER COLUMN tags TYPE TEXT USING tags::TEXT;
    EXCEPTION WHEN others THEN NULL;
    END $do$
  `)

  // Add source_client_id to shared_notes so we can match shares to local notes
  // without relying on title comparison (which breaks with encrypted titles)
  await query(`
    DO $do$ BEGIN
      ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS source_client_id TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  // Add password_hint to shared_notes for password-protected shares
  await query(`
    DO $do$ BEGIN
      ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS password_hint TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $do$
  `)

  console.log('[migrate] Database tables ready')
}