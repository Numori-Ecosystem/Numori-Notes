import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * GET /api/notes — List all notes for the authenticated user.
 * Supports ?since=ISO_DATE to fetch only notes updated after a timestamp (for sync).
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const { since } = getQuery(event)

  let sql = `
    SELECT id, client_id, title, description, tags, content, created_at, updated_at
    FROM notes WHERE user_id = $1
  `
  const params = [auth.userId]

  if (since) {
    sql += ' AND updated_at > $2'
    params.push(since)
  }

  sql += ' ORDER BY updated_at DESC'

  const result = await query(sql, params)

  return result.rows.map(row => ({
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
})
