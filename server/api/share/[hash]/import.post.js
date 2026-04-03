import { createHash } from 'node:crypto'
import { query } from '../../../utils/db.js'
import { optionalAuth } from '../../../utils/auth.js'

/**
 * POST /api/share/:hash/import — Record that someone imported this shared note.
 */
export default defineEventHandler(async (event) => {
  const hash = getRouterParam(event, 'hash')

  const result = await query(
    'SELECT id, collect_analytics FROM shared_notes WHERE hash = $1 AND deleted_at IS NULL',
    [hash]
  )

  if (result.rows.length === 0) return { ok: true }

  const row = result.rows[0]
  if (!row.collect_analytics) return { ok: true }

  const auth = await optionalAuth(event)
  const userAgent = getHeader(event, 'user-agent') || null
  const referrer = getHeader(event, 'referer') || null
  const acceptLang = getHeader(event, 'accept-language') || null
  const dnt = getHeader(event, 'dnt') || null
  const secChUa = getHeader(event, 'sec-ch-ua') || null
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIp = getHeader(event, 'x-real-ip')
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : (realIp || null)

  let viewerUserId = null
  let viewerName = null
  let recordUserAgent = null
  let recordIp = null
  let recordAcceptLang = null
  let recordDnt = null
  let recordSecChUa = null
  let privacyOn = false

  if (auth) {
    const privResult = await query(
      'SELECT privacy_no_tracking, name FROM users WHERE id = $1',
      [auth.userId]
    )
    const viewer = privResult.rows[0]
    privacyOn = !viewer || viewer.privacy_no_tracking
    if (viewer && !viewer.privacy_no_tracking) {
      viewerUserId = auth.userId
      viewerName = viewer.name || null
      recordUserAgent = userAgent
      recordIp = ipAddress
      recordAcceptLang = acceptLang
      recordDnt = dnt
      recordSecChUa = secChUa
    }
  } else {
    recordUserAgent = userAgent
    recordIp = ipAddress
    recordAcceptLang = acceptLang
    recordDnt = dnt
    recordSecChUa = secChUa
  }

  // Build fingerprint
  let fingerprint
  if (auth && !privacyOn) {
    fingerprint = `user:${auth.userId}`
  } else if (auth && privacyOn) {
    const raw = `private:${auth.userId}:${row.id}`
    fingerprint = `private:${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`
  } else {
    const raw = `anon:${ipAddress || 'no-ip'}:${userAgent || 'no-ua'}:${acceptLang || 'no-lang'}:${dnt || 'no-dnt'}`
    fingerprint = `anon:${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`
  }

  const insertRes = await query(`
    INSERT INTO share_views (shared_note_id, viewer_user_id, viewer_name, user_agent, ip_address, referrer, event_type, viewer_fingerprint, accept_language, dnt, sec_ch_ua)
    VALUES ($1, $2, $3, $4, $5, $6, 'import', $7, $8, $9, $10)
    RETURNING id
  `, [row.id, viewerUserId, viewerName, recordUserAgent, recordIp, referrer, fingerprint, recordAcceptLang, recordDnt, recordSecChUa])

  // Async geo lookup
  const geoIp = recordIp || ipAddress
  const recordId = insertRes.rows[0]?.id
  if (recordId && geoIp && !geoIp.startsWith('127.') && geoIp !== '::1') {
    fetch(`http://ip-api.com/json/${geoIp}?fields=status,country,regionName,city`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          query('UPDATE share_views SET country = $1, region = $2, city = $3 WHERE id = $4',
            [d.country || null, d.regionName || null, d.city || null, recordId])
        }
      })
      .catch(() => {})
  }

  return { ok: true }
})
