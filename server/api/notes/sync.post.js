import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'
import { notifySync } from '../../utils/syncBroadcast.js'

/**
 * POST /api/notes/sync — Bulk sync endpoint with soft-delete support.
 *
 * Client sends:
 *   { notes: [...], deletedClientIds: [...], lastSyncedAt: ISO_DATE | null }
 *
 * Server responds:
 *   { pushed: [...], pulled: [...], deletedClientIds: [...], syncedAt: ISO_DATE }
 *
 * Deletion strategy: soft-delete (deleted_at timestamp).
 * - Client sends deletedClientIds → server marks those as soft-deleted.
 * - Server tells client which of its notes are soft-deleted → client removes locally.
 * - Upserts skip soft-deleted notes (won't resurrect them).
 * - Pulls exclude soft-deleted notes.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { notes: clientNotes = [], deletedClientIds = [], lastSyncedAt } = body || {}

  const deletedSet = new Set(deletedClientIds)

  // 1. Soft-delete notes the client deleted
  if (deletedClientIds.length > 0) {
    await query(
      `UPDATE notes SET deleted_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND client_id = ANY($2) AND deleted_at IS NULL`,
      [auth.userId, deletedClientIds]
    )
  }

  // 2. Upsert each client note — but ONLY if it's not soft-deleted on server
  const pushed = []

  for (const note of clientNotes) {
    if (!note.clientId || deletedSet.has(note.clientId)) continue

    // Check if this note is soft-deleted on server
    const checkDeleted = await query(
      'SELECT deleted_at FROM notes WHERE user_id = $1 AND client_id = $2',
      [auth.userId, note.clientId]
    )

    // If it exists and is soft-deleted, skip — don't resurrect it
    if (checkDeleted.rows.length > 0 && checkDeleted.rows[0].deleted_at) {
      continue
    }

    const result = await query(`
      INSERT INTO notes (user_id, client_id, title, description, tags, content, sort_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        content = EXCLUDED.content,
        sort_order = EXCLUDED.sort_order,
        updated_at = EXCLUDED.updated_at
      WHERE notes.deleted_at IS NULL AND EXCLUDED.updated_at >= notes.updated_at
      RETURNING id, client_id, title, description, tags, content, sort_order, created_at, updated_at
    `, [
      auth.userId,
      note.clientId,
      note.title || 'Untitled Note',
      note.description || '',
      JSON.stringify(note.tags || []),
      note.content || '',
      note.sortOrder ?? 0,
      note.createdAt || new Date().toISOString(),
      note.updatedAt || new Date().toISOString()
    ])

    if (result.rows.length > 0) {
      const row = result.rows[0]
      pushed.push({
        id: row.id,
        clientId: row.client_id,
        title: row.title,
        description: row.description,
        tags: row.tags,
        content: row.content,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })
    }
  }

  // 3. Tell the client which of its notes are soft-deleted on server
  const allClientIds = clientNotes.map(n => n.clientId).filter(Boolean)
  let serverDeletedIds = []
  if (allClientIds.length > 0) {
    const deletedResult = await query(
      `SELECT client_id FROM notes
       WHERE user_id = $1 AND client_id = ANY($2) AND deleted_at IS NOT NULL`,
      [auth.userId, allClientIds]
    )
    serverDeletedIds = deletedResult.rows.map(r => r.client_id)
  }

  // 4. Pull ALL active notes from server — client-side merge handles dedup
  const pullResult = await query(`
    SELECT id, client_id, title, description, tags, content, sort_order, created_at, updated_at
    FROM notes WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY sort_order ASC
  `, [auth.userId])

  const pulled = pullResult.rows.map(row => ({
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    content: row.content,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))

  // Notify other connected clients for this user
  notifySync(auth.userId, event.node.res)

  return {
    pushed,
    pulled,
    deletedClientIds: serverDeletedIds,
    syncedAt: new Date().toISOString()
  }
})
