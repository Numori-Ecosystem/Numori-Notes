import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * DELETE /api/notes/:id — Delete a note by server ID.
 *
 * Query params:
 *   ?soft=true — Soft-delete (move to bin) by setting deleted_at
 *   ?restore=true — Restore from bin by clearing deleted_at
 *
 * Without query params, performs a permanent (hard) delete.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const queryParams = getQuery(event)

  // Soft delete (move to bin)
  if (queryParams.soft === 'true') {
    const result = await query(
      'UPDATE notes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING client_id',
      [id, auth.userId],
    )
    if (result.rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Note not found' })
    }
    return { softDeleted: true }
  }

  // Restore from bin
  if (queryParams.restore === 'true') {
    const result = await query(
      'UPDATE notes SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING client_id',
      [id, auth.userId],
    )
    if (result.rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Note not found' })
    }
    return { restored: true }
  }

  // Hard delete (permanent)
  const result = await query(
    'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING client_id',
    [id, auth.userId],
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  // Record tombstone so other devices learn about the deletion
  const clientId = result.rows[0].client_id
  if (clientId) {
    await query(
      'INSERT INTO deleted_notes (user_id, client_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [auth.userId, clientId],
    )
  }

  return { deleted: true }
})
