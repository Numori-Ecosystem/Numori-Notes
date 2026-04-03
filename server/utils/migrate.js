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
      tags        JSONB NOT NULL DEFAULT '[]',
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
      tags            JSONB NOT NULL DEFAULT '[]',
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
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `)

  // Add deletion_requested columns if missing
  await query(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `)

  // Add deleted_at column for soft-delete sync
  await query(`
    DO $$ BEGIN
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `)

  console.log('[migrate] Database tables ready')
}
