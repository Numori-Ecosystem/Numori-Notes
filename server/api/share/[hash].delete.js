import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * DELETE /api/share/:hash — Delete a shared note.
 * Only the owner (authenticated user who created it) can delete.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const hash = getRouterParam(event, 'hash')

  const result = await query(
    'DELETE FROM shared_notes WHERE hash = $1 AND user_id = $2 RETURNING id',
    [hash, auth.userId]
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Shared note not found or not owned by you' })
  }

  return { deleted: true }
})
