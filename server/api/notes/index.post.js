import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * POST /api/notes — Create a new note (or upsert by clientId for sync).
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { clientId, title, description, tags, content } = body || {}

  if (!title && !content) {
    throw createError({ statusCode: 400, statusMessage: 'Title or content is required' })
  }

  // If clientId is provided, upsert (for sync — avoids duplicates)
  if (clientId) {
    const result = await query(`
      INSERT INTO notes (user_id, client_id, title, description, tags, content)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        content = EXCLUDED.content,
        updated_at = NOW()
      WHERE notes.deleted_at IS NULL
      RETURNING id, client_id, title, description, tags, content, created_at, updated_at
    `, [auth.userId, clientId, title || 'Untitled Note', description || '', JSON.stringify(tags || []), content || ''])

    const row = result.rows[0]
    return {
      id: row.id,
      clientId: row.client_id,
      title: row.title,
      description: row.description,
      tags: row.tags,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  const result = await query(`
    INSERT INTO notes (user_id, title, description, tags, content)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, client_id, title, description, tags, content, created_at, updated_at
  `, [auth.userId, title || 'Untitled Note', description || '', JSON.stringify(tags || []), content || ''])

  const row = result.rows[0]
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
})
