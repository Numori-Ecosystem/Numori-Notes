import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * DELETE /api/notes/:id — Delete a note by server ID.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')

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
