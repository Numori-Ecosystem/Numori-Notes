import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * POST /api/notes/sync — Bulk sync endpoint.
 *
 * Client sends:
 *   { notes: [...], deletedClientIds: [...], lastSyncedAt: ISO_DATE | null }
 *
 * Server responds with:
 *   { pushed: [...], pulled: [...], deletedClientIds: [...], syncedAt: ISO_DATE }
 *
 * - `pushed`: server versions of notes the client sent (with server IDs)
 * - `pulled`: notes on server that client doesn't have yet
 * - `deletedClientIds`: client IDs that were deleted on server (no longer exist)
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { notes: clientNotes = [], deletedClientIds = [], lastSyncedAt } = body || {}

  // 1. Delete notes the client deleted
  if (deletedClientIds.length > 0) {
    await query(
      'DELETE FROM notes WHERE user_id = $1 AND client_id = ANY($2)',
      [auth.userId, deletedClientIds]
    )
  }

  // 2. Upsert each client note (skip any that were just deleted)
  const deletedSet = new Set(deletedClientIds)
  const pushed = []

  for (const note of clientNotes) {
    if (!note.clientId || deletedSet.has(note.clientId)) continue

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

  // 3. Find which client IDs no longer exist on server (deleted from another device)
  const allClientIds = clientNotes.map(n => n.clientId).filter(Boolean)
  let serverDeletedIds = []
  if (allClientIds.length > 0) {
    const existResult = await query(
      'SELECT client_id FROM notes WHERE user_id = $1 AND client_id = ANY($2)',
      [auth.userId, allClientIds]
    )
    const existingSet = new Set(existResult.rows.map(r => r.client_id))
    // IDs the client sent that don't exist on server (and weren't just pushed — meaning they were deleted)
    serverDeletedIds = allClientIds.filter(id => !existingSet.has(id) && !deletedSet.has(id))
  }

  // 4. Pull notes from server that client doesn't have
  const clientIdSet = new Set(allClientIds)
  let pullSql = `
    SELECT id, client_id, title, description, tags, content, created_at, updated_at
    FROM notes WHERE user_id = $1
  `
  const pullParams = [auth.userId]

  // Only pull notes the client doesn't already have
  if (allClientIds.length > 0) {
    pullSql += ` AND (client_id IS NULL OR client_id != ALL($2))`
    pullParams.push(allClientIds)
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
