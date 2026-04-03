import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * PUT /api/notes/:id — Update a note by server ID.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { title, description, tags, content } = body || {}

  const result = await query(`
    UPDATE notes
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        tags = COALESCE($3, tags),
        content = COALESCE($4, content),
        updated_at = NOW()
    WHERE id = $5 AND user_id = $6
    RETURNING id, client_id, title, description, tags, content, created_at, updated_at
  `, [
    title ?? null,
    description ?? null,
    tags ? JSON.stringify(tags) : null,
    content ?? null,
    id,
    auth.userId
  ])

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

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
