import { query } from '../../utils/db.js'

/**
 * GET /api/share/:hash — Retrieve a shared note by its hash.
 * No authentication required.
 */
export default defineEventHandler(async (event) => {
  const hash = getRouterParam(event, 'hash')

  if (!hash || hash.length !== 32) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid share link' })
  }

  const result = await query(`
    SELECT hash, title, description, tags, content, sharer_name, sharer_email, anonymous, expires_at, created_at
    FROM shared_notes WHERE hash = $1
  `, [hash])

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Shared note not found' })
  }

  const row = result.rows[0]

  // Check expiration
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'This shared note has expired' })
  }

  return {
    hash: row.hash,
    title: row.title,
    description: row.description,
    tags: row.tags,
    content: row.content,
    sharer: row.anonymous ? null : {
      name: row.sharer_name,
      email: row.sharer_email
    },
    createdAt: row.created_at,
    expiresAt: row.expires_at
  }
})
