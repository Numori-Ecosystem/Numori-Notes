import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * DELETE /api/notes/:id — Soft-delete a note by server ID.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const result = await query(
    `UPDATE notes SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, auth.userId]
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  return { deleted: true }
})
