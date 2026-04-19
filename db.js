/**
 * Numori — Dexie (IndexedDB) local database
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHEMA DESIGN DECISIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module is the single source of truth for the local IndexedDB schema.
 * It is intentionally framework-agnostic: no Vue imports, no composable
 * dependencies. Composables import from here — never the other way around.
 *
 * Tables
 * ------
 * • notes        — One row per note. Indexed by `id` (client-generated) and
 *                  `sortOrder` so the sidebar list can be fetched in order
 *                  without a full table scan.
 *
 * • preferences  — Single-row key/value store (key = 'locale'). Holds the
 *                  full preferences object. Using a table lets us participate
 *                  in Dexie transactions and liveQuery reactivity.
 *
 * • appState     — Lightweight key/value pairs for small scalars:
 *                    auth_token, last_synced_at, welcome_completed,
 *                    pending_import
 *                  Indexed by `key` for O(1) lookups.
 *
 * Why attachments / blobs are NOT stored here (yet)
 * -------------------------------------------------
 * Avatars are currently stored as data-URLs sent to the API. If the app
 * ever needs to cache large binary attachments (images, PDFs) locally,
 * they should go in a dedicated `attachments` table with its own indexes
 * (e.g. `noteId`, `mimeType`). Keeping them separate from `notes` avoids
 * bloating the notes table and lets us apply different retention / eviction
 * policies. When that time comes, add a new Dexie version (see below).
 *
 * Adding a new Dexie version / migration
 * ---------------------------------------
 * Dexie handles schema migrations declaratively. To evolve the schema:
 *
 *   1. Bump the version number (e.g. .version(2)).
 *   2. Declare the NEW stores/indexes for that version.
 *   3. Optionally chain .upgrade(tx => { … }) for data transforms.
 *
 * Example:
 *
 *   db.version(2).stores({
 *     notes: 'id, sortOrder, folderId',   // added folderId index
 *     folders: 'id, name',                // new table
 *     attachments: 'id, noteId, mimeType' // new table for blobs
 *   });
 *
 * Only declare tables/indexes that CHANGE or are NEW in each version.
 * Dexie carries forward unchanged tables automatically.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import Dexie from 'dexie'

const db = new Dexie('NumoriDB')

// ── Version 1 — initial schema ──────────────────────────────────────────
db.version(1).stores({
  notes: 'id, sortOrder',
  preferences: 'key',
  appState: 'key',
})

// ── Version 2 — internal names + note groups ───────────────────────────
db.version(2)
  .stores({
    notes: 'id, sortOrder, groupId',
    groups: 'id, sortOrder',
  })
  .upgrade(async (tx) => {
    // Add default internalName to existing notes with uniqueness
    const allNotes = await tx.table('notes').toArray()
    const usedNames = new Set()

    for (const note of allNotes) {
      let base =
        (note.title || '')
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '') || 'untitled_note'

      let name = base
      if (usedNames.has(name)) {
        let i = 1
        while (usedNames.has(`${base}_${i}`)) i++
        name = `${base}_${i}`
      }
      usedNames.add(name)

      await tx.table('notes').update(note.id, {
        internalName: name,
        groupId: note.groupId === undefined ? null : note.groupId,
      })
    }
  })

// ── Version 3 — soft-delete bin (deletedAt index) ──────────────────────
db.version(3)
  .stores({
    notes: 'id, sortOrder, groupId, deletedAt',
  })
  .upgrade(async (tx) => {
    // Ensure existing notes have deletedAt = null
    const allNotes = await tx.table('notes').toArray()
    for (const note of allNotes) {
      if (note.deletedAt === undefined) {
        await tx.table('notes').update(note.id, { deletedAt: null })
      }
    }
  })

export default db
