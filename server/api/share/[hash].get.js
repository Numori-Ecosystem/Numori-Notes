import { query } from '../../utils/db.js'
import { optionalAuth } from '../../utils/auth.js'

/**
 * GET /api/share/:hash — Retrieve a shared note by its hash.
 * No authentication required. Records a view if analytics are enabled.
 */
export default defineEventHandler(async (event) => {
  const hash = getRouterParam(event, 'hash')

  if (!hash || hash.length !== 32) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid share link' })
  }

  const result = await query(`
    SELECT id, hash, title, description, tags, content, sharer_name, sharer_email, anonymous, expires_at, created_at, collect_analytics
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

  // Record view if analytics enabled
  if (row.collect_analytics) {
    const auth = await optionalAuth(event)
    const userAgent = getHeader(event, 'user-agent') || null
    const referrer = getHeader(event, 'referer') || null

    let viewerUserId = null
    let viewerName = null
    let recordUserAgent = null

    if (auth) {
      // Check if viewer has privacy_no_tracking enabled
      const privResult = await query(
        'SELECT privacy_no_tracking, name FROM users WHERE id = $1',
        [auth.userId]
      )
      const viewer = privResult.rows[0]
      if (viewer && !viewer.privacy_no_tracking) {
        // Viewer allows tracking — record identity and device info
        viewerUserId = auth.userId
        viewerName = viewer.name || null
        recordUserAgent = userAgent
      }
      // If privacy_no_tracking is true, we still record the view but without identity/device
    } else {
      // Anonymous viewer — record user agent (no account = no privacy preference)
      recordUserAgent = userAgent
    }

    // Fire and forget — don't block the response
    query(`
      INSERT INTO share_views (shared_note_id, viewer_user_id, viewer_name, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5)
    `, [row.id, viewerUserId, viewerName, recordUserAgent, referrer]).catch(() => {})
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
