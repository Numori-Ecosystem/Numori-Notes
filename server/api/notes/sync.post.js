import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * POST /api/notes/sync — Bulk sync endpoint.
 *
 * Client sends:
 *   { notes: [...], lastSyncedAt: ISO_DATE | null }
 *
 * Server responds with:
 *   { pushed: [...], pulled: [...], syncedAt: ISO_DATE }
 *
 * - `pushed`: server versions of notes the client sent (with server IDs)
 * - `pulled`: notes updated on server since lastSyncedAt that client doesn't have
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { notes: clientNotes = [], lastSyncedAt } = body || {}

  const pushed = []

  // Upsert each client note
  for (const note of clientNotes) {
    if (!note.clientId) continue

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

  // Pull notes updated since last sync that weren't just pushed
  const clientIds = clientNotes.map(n => n.clientId).filter(Boolean)
  let pullSql = `
    SELECT id, client_id, title, description, tags, content, created_at, updated_at
    FROM notes WHERE user_id = $1
  `
  const pullParams = [auth.userId]

  if (lastSyncedAt) {
    pullSql += ` AND updated_at > $${pullParams.length + 1}`
    pullParams.push(lastSyncedAt)
  }

  if (clientIds.length > 0) {
    pullSql += ` AND (client_id IS NULL OR client_id != ALL($${pullParams.length + 1}))`
    pullParams.push(clientIds)
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
    syncedAt: new Date().toISOString()
  }
})
