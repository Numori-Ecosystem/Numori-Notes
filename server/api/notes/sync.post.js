import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

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
      INSERT INTO notes (user_id, client_id, title, description, tags, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL
      DO UPDATE SET
        title = CASE WHEN EXCLUDED.updated_at > notes.updated_at THEN EXCLUDED.title ELSE notes.title END,
        description = CASE WHEN EXCLUDED.updated_at > notes.updated_at THEN EXCLUDED.description ELSE notes.description END,
        tags = CASE WHEN EXCLUDED.updated_at > notes.updated_at THEN EXCLUDED.tags ELSE notes.tags END,
        content = CASE WHEN EXCLUDED.updated_at > notes.updated_at THEN EXCLUDED.content ELSE notes.content END,
        updated_at = GREATEST(EXCLUDED.updated_at, notes.updated_at)
      WHERE notes.deleted_at IS NULL
      RETURNING id, client_id, title, description, tags, content, created_at, updated_at
    `, [
      auth.userId,
      note.clientId,
      note.title || 'Untitled Note',
      note.description || '',
      JSON.stringify(note.tags || []),
      note.content || '',
      note.createdAt || new Date().toISOString()
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

  // 4. Pull active notes from server that client doesn't have
  // Exclude soft-deleted and notes the client already sent
  const excludeIds = [...allClientIds, ...serverDeletedIds]
  let pullSql = `
    SELECT id, client_id, title, description, tags, content, created_at, updated_at
    FROM notes WHERE user_id = $1 AND deleted_at IS NULL
  `
  const pullParams = [auth.userId]

  if (excludeIds.length > 0) {
    pullSql += ` AND (client_id IS NULL OR client_id != ALL($2))`
    pullParams.push(excludeIds)
  }

  pullSql += ' ORDER BY updated_at DESC'

  const pullResult = await query(pullSql, pullParams)
  const pulled = pullResult.rows.map(row => ({
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))

  return {
    pushed,
    pulled,
    deletedClientIds: serverDeletedIds,
    syncedAt: new Date().toISOString()
  }
})
