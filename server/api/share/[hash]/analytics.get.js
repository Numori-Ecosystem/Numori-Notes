import { requireAuth } from '../../../utils/auth.js'
import { query } from '../../../utils/db.js'

/**
 * GET /api/share/:hash/analytics — Get view analytics for a shared note.
 * Only the owner can access this. Returns aggregated + recent view data.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const hash = getRouterParam(event, 'hash')

  // Verify ownership and get shared note
  const noteResult = await query(
    'SELECT id, collect_analytics FROM shared_notes WHERE hash = $1 AND user_id = $2',
    [hash, auth.userId]
  )

  if (noteResult.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Shared note not found or not owned by you' })
  }

  const sharedNote = noteResult.rows[0]

  if (!sharedNote.collect_analytics) {
    return { enabled: false, totalViews: 0, uniqueViewers: 0, views: [] }
  }

  // Total views
  const totalResult = await query(
    'SELECT COUNT(*) as count FROM share_views WHERE shared_note_id = $1',
    [sharedNote.id]
  )

  // Unique viewers (by user_id where not null, plus count of anonymous)
  const uniqueResult = await query(`
    SELECT COUNT(DISTINCT viewer_user_id) as known
    FROM share_views
    WHERE shared_note_id = $1 AND viewer_user_id IS NOT NULL
  `, [sharedNote.id])

  const anonResult = await query(`
    SELECT COUNT(*) as count
    FROM share_views
    WHERE shared_note_id = $1 AND viewer_user_id IS NULL
  `, [sharedNote.id])

  // Recent views (last 50)
  const viewsResult = await query(`
    SELECT viewer_name, user_agent, referrer, viewed_at
    FROM share_views
    WHERE shared_note_id = $1
    ORDER BY viewed_at DESC
    LIMIT 50
  `, [sharedNote.id])

  const views = viewsResult.rows.map(v => {
    // Parse a simple device description from user agent
    let device = null
    if (v.user_agent) {
      const ua = v.user_agent
      if (/iPhone/.test(ua)) device = 'iPhone'
      else if (/iPad/.test(ua)) device = 'iPad'
      else if (/Android/.test(ua)) device = 'Android'
      else if (/Mac OS/.test(ua)) device = 'Mac'
      else if (/Windows/.test(ua)) device = 'Windows'
      else if (/Linux/.test(ua)) device = 'Linux'
      else device = 'Unknown device'

      if (/Firefox/.test(ua)) device += ' · Firefox'
      else if (/Edg\//.test(ua)) device += ' · Edge'
      else if (/Chrome/.test(ua)) device += ' · Chrome'
      else if (/Safari/.test(ua)) device += ' · Safari'
    }

    return {
      viewerName: v.viewer_name || null,
      device,
      referrer: v.referrer || null,
      viewedAt: v.viewed_at
    }
  })

  return {
    enabled: true,
    totalViews: parseInt(totalResult.rows[0].count),
    knownViewers: parseInt(uniqueResult.rows[0].known),
    anonymousViews: parseInt(anonResult.rows[0].count),
    views
  }
})
