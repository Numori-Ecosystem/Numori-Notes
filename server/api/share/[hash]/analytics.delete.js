import { requireAuth } from '../../../utils/auth.js'
import { query } from '../../../utils/db.js'

/**
 * DELETE /api/share/:hash/analytics — Delete analytics data.
 * Body: { ids?: number[] }
 *   - If ids provided: delete those specific view records (granular)
 *   - If no ids: delete ALL analytics for this shared note (bulk)
 * Only the owner can do this.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const hash = getRouterParam(event, 'hash')

  // Verify ownership (include soft-deleted)
  const noteResult = await query('SELECT id FROM shared_notes WHERE hash = $1 AND user_id = $2', [
    hash,
    auth.userId,
  ])

  if (noteResult.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Shared note not found or not owned by you',
    })
  }

  const sharedNoteId = noteResult.rows[0].id
  const body = await readBody(event).catch(() => null)
  const ids = body?.ids

  if (Array.isArray(ids) && ids.length > 0) {
    // Granular delete — only delete records belonging to this shared note
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ')
    const result = await query(
      `DELETE FROM share_views WHERE shared_note_id = $1 AND id IN (${placeholders}) RETURNING id`,
      [sharedNoteId, ...ids],
    )
    return { deleted: result.rows.length }
  }

  // Bulk delete all
  const result = await query('DELETE FROM share_views WHERE shared_note_id = $1 RETURNING id', [
    sharedNoteId,
  ])
  return { deleted: result.rows.length }
})
