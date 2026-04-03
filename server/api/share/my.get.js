import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * GET /api/share/my — List all shared notes created by the authenticated user.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const result = await query(`
    SELECT hash, title, anonymous, expires_at, created_at
    FROM shared_notes
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [auth.userId])

  return result.rows.map(row => ({
    hash: row.hash,
    title: row.title,
    anonymous: row.anonymous,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  }))
})
