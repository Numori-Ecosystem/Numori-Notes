import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * DELETE /api/share/:hash — Stop sharing or permanently remove a shared note.
 * 
 * Query params:
 *   ?purge=true — Hard-delete the shared note and all its analytics data.
 *   (default)   — Soft-delete (stop sharing). Analytics data is preserved.
 * 
 * Only the owner can do this.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const hash = getRouterParam(event, 'hash')
  const { purge } = getQuery(event)

  if (purge === 'true') {
    // Hard-delete: removes shared note + analytics (via CASCADE)
    const result = await query(
      'DELETE FROM shared_notes WHERE hash = $1 AND user_id = $2 RETURNING id',
      [hash, auth.userId]
    )
    if (result.rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Shared note not found or not owned by you' })
    }
    return { deleted: true, purged: true }
  }

  // Soft-delete: stop sharing but keep analytics
  const result = await query(
    'UPDATE shared_notes SET deleted_at = NOW() WHERE hash = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
    [hash, auth.userId]
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Shared note not found or not owned by you' })
  }

  return { deleted: true }
})
