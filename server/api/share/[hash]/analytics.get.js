import { createHash } from 'node:crypto'
import { optionalAuth } from '../../../utils/auth.js'
import { query } from '../../../utils/db.js'

/**
 * GET /api/share/:hash/analytics — Get view analytics for a shared note.
 * Only the owner can access. Works even after soft-delete (unshare).
 *
 * Authorization: either
 *   1. Authenticated user who owns the share (user_id matches), OR
 *   2. Valid delete/owner token passed via `X-Delete-Token` header (for anonymous shares).
 *
 * Query params:
 *   page (default 1), limit (default 20, max 100)
 */
export default defineEventHandler(async (event) => {
  const auth = await optionalAuth(event)
  const hash = getRouterParam(event, 'hash')
  const deleteToken = getHeader(event, 'x-delete-token')

  if (!auth && !deleteToken) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication or owner token required' })
  }

  let noteResult
  if (auth) {
    noteResult = await query(
      'SELECT id, collect_analytics, deleted_at FROM shared_notes WHERE hash = $1 AND user_id = $2',
      [hash, auth.userId],
    )
  } else {
    const tokenHash = createHash('sha256').update(deleteToken).digest('hex')
    noteResult = await query(
      'SELECT id, collect_analytics, deleted_at FROM shared_notes WHERE hash = $1 AND delete_token_hash = $2',
      [hash, tokenHash],
    )
  }

  if (noteResult.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Shared note not found or not owned by you',
    })
  }

  const sharedNote = noteResult.rows[0]

  if (!sharedNote.collect_analytics) {
    return {
      enabled: false,
      totalViews: 0,
      totalImports: 0,
      uniqueViewers: 0,
      views: [],
      page: 1,
      totalPages: 0,
      totalRecords: 0,
    }
  }

  const urlParams = getQuery(event)
  const page = Math.max(1, parseInt(urlParams.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(urlParams.limit) || 20))
  const offset = (page - 1) * limit

  // Aggregates
  const [totalViewsRes, totalImportsRes, uniqueRes, totalRecordsRes] = await Promise.all([
    query(
      "SELECT COUNT(*) as count FROM share_views WHERE shared_note_id = $1 AND event_type = 'view'",
      [sharedNote.id],
    ),
    query(
      "SELECT COUNT(*) as count FROM share_views WHERE shared_note_id = $1 AND event_type = 'import'",
      [sharedNote.id],
    ),
    query(
      'SELECT COUNT(DISTINCT viewer_fingerprint) as count FROM share_views WHERE shared_note_id = $1 AND viewer_fingerprint IS NOT NULL',
      [sharedNote.id],
    ),
    query('SELECT COUNT(*) as count FROM share_views WHERE shared_note_id = $1', [sharedNote.id]),
  ])

  // Unique viewers breakdown
  const [knownRes, anonFpRes] = await Promise.all([
    query(
      "SELECT COUNT(DISTINCT viewer_fingerprint) as count FROM share_views WHERE shared_note_id = $1 AND viewer_fingerprint LIKE 'user:%'",
      [sharedNote.id],
    ),
    query(
      "SELECT COUNT(DISTINCT viewer_fingerprint) as count FROM share_views WHERE shared_note_id = $1 AND (viewer_fingerprint LIKE 'anon:%' OR viewer_fingerprint LIKE 'private:%')",
      [sharedNote.id],
    ),
  ])

  // Paginated events
  const viewsResult = await query(
    `
    SELECT id, viewer_name, viewer_fingerprint, user_agent, ip_address, referrer, event_type, viewed_at, accept_language, dnt, sec_ch_ua, country, region, city
    FROM share_views
    WHERE shared_note_id = $1
    ORDER BY viewed_at DESC
    LIMIT $2 OFFSET $3
  `,
    [sharedNote.id, limit, offset],
  )

  // For each fingerprint in this page, get their total view count for context
  const fingerprints = [
    ...new Set(viewsResult.rows.map((r) => r.viewer_fingerprint).filter(Boolean)),
  ]
  let fpCounts = {}
  if (fingerprints.length > 0) {
    const placeholders = fingerprints.map((_, i) => `$${i + 2}`).join(', ')
    const countRes = await query(
      `SELECT viewer_fingerprint, COUNT(*) as count FROM share_views WHERE shared_note_id = $1 AND viewer_fingerprint IN (${placeholders}) GROUP BY viewer_fingerprint`,
      [sharedNote.id, ...fingerprints],
    )
    for (const r of countRes.rows) {
      fpCounts[r.viewer_fingerprint] = parseInt(r.count)
    }
  }

  const totalRecords = parseInt(totalRecordsRes.rows[0].count)

  const views = viewsResult.rows.map((v) => ({
    id: v.id,
    viewerName: v.viewer_name || null,
    fingerprint: v.viewer_fingerprint || null,
    totalVisits: fpCounts[v.viewer_fingerprint] || 1,
    eventType: v.event_type,
    raw: {
      userAgent: v.user_agent || null,
      ip: v.ip_address || null,
      referrer: v.referrer || null,
      acceptLanguage: v.accept_language || null,
      dnt: v.dnt || null,
      secChUa: v.sec_ch_ua || null,
    },
    location:
      v.country || v.city || v.region
        ? {
            country: v.country || null,
            region: v.region || null,
            city: v.city || null,
          }
        : null,
    parsed: parseUserAgent(v.user_agent),
    parsedLang: parseAcceptLanguage(v.accept_language),
    parsedSecChUa: parseSecChUa(v.sec_ch_ua),
    viewedAt: v.viewed_at,
  }))

  return {
    enabled: true,
    isActive: !sharedNote.deleted_at,
    totalViews: parseInt(totalViewsRes.rows[0].count),
    totalImports: parseInt(totalImportsRes.rows[0].count),
    uniqueViewers: parseInt(uniqueRes.rows[0].count),
    knownViewers: parseInt(knownRes.rows[0].count),
    anonymousViewers: parseInt(anonFpRes.rows[0].count),
    views,
    page,
    limit,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit),
  }
})

function parseUserAgent(ua) {
  if (!ua) return null

  let os = 'Unknown OS'
  let osVersion = ''
  let browser = 'Unknown browser'
  let browserVersion = ''
  let deviceType = 'Desktop'

  const winMatch = ua.match(/Windows NT ([\d.]+)/)
  const macMatch = ua.match(/Mac OS X ([\d_.]+)/)
  const iosMatch = ua.match(/(?:iPhone|iPad|iPod).*?OS ([\d_]+)/)
  const androidMatch = ua.match(/Android ([\d.]+)/)
  const linuxMatch = /Linux/.test(ua) && !ua.includes('Android')
  const chromeoMatch = /CrOS/.test(ua)

  if (iosMatch) {
    os = ua.includes('iPad') ? 'iPadOS' : 'iOS'
    osVersion = iosMatch[1].replace(/_/g, '.')
    deviceType = ua.includes('iPad') ? 'Tablet' : 'Mobile'
  } else if (androidMatch) {
    os = 'Android'
    osVersion = androidMatch[1]
    deviceType = /Mobile/.test(ua) ? 'Mobile' : 'Tablet'
  } else if (winMatch) {
    os = 'Windows'
    const winVersions = { '10.0': '10/11', 6.3: '8.1', 6.2: '8', 6.1: '7' }
    osVersion = winVersions[winMatch[1]] || winMatch[1]
  } else if (macMatch) {
    os = 'macOS'
    osVersion = macMatch[1].replace(/_/g, '.')
  } else if (chromeoMatch) {
    os = 'Chrome OS'
  } else if (linuxMatch) {
    os = 'Linux'
  }

  const edgeMatch = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/)
  const firefoxMatch = ua.match(/Firefox\/([\d.]+)/)
  const chromeMatch = ua.match(/Chrome\/([\d.]+)/)
  const safariMatch = ua.match(/Version\/([\d.]+).*Safari/)
  const operaMatch = ua.match(/OPR\/([\d.]+)/)
  const samsungMatch = ua.match(/SamsungBrowser\/([\d.]+)/)

  if (samsungMatch) {
    browser = 'Samsung Internet'
    browserVersion = samsungMatch[1]
  } else if (operaMatch) {
    browser = 'Opera'
    browserVersion = operaMatch[1]
  } else if (edgeMatch) {
    browser = 'Edge'
    browserVersion = edgeMatch[1]
  } else if (firefoxMatch) {
    browser = 'Firefox'
    browserVersion = firefoxMatch[1]
  } else if (chromeMatch && !ua.includes('Edg')) {
    browser = 'Chrome'
    browserVersion = chromeMatch[1]
  } else if (safariMatch) {
    browser = 'Safari'
    browserVersion = safariMatch[1]
  }

  if (/bot|crawl|spider|slurp|Googlebot|Bingbot/i.test(ua)) {
    deviceType = 'Bot'
  }

  const summary = `${browser} ${browserVersion.split('.')[0]} on ${os}${osVersion ? ' ' + osVersion.split('.').slice(0, 2).join('.') : ''}`

  return { os, osVersion, browser, browserVersion, deviceType, summary }
}

/**
 * Parse Accept-Language header into a human-readable primary language.
 * e.g. "en-US,en;q=0.9,fr;q=0.8" → { primary: "en-US", all: ["en-US", "en", "fr"] }
 */
function parseAcceptLanguage(header) {
  if (!header) return null
  const parts = header
    .split(',')
    .map((p) => {
      const [lang, q] = p.trim().split(';q=')
      return { lang: lang.trim(), q: parseFloat(q) || 1 }
    })
    .sort((a, b) => b.q - a.q)

  return {
    primary: parts[0]?.lang || null,
    all: parts.map((p) => p.lang),
  }
}

/**
 * Parse Sec-CH-UA client hints header.
 * e.g. '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"'
 * → { brands: [{ brand: "Google Chrome", version: "124" }, ...] }
 */
function parseSecChUa(header) {
  if (!header) return null
  const brands = []
  const regex = /"([^"]+)";v="([^"]+)"/g
  let match
  while ((match = regex.exec(header)) !== null) {
    const brand = match[1]
    // Skip the "Not A;Brand" / "Not-A.Brand" filler entries
    if (!/^Not[-_\s]?A/i.test(brand)) {
      brands.push({ brand, version: match[2] })
    }
  }
  return brands.length ? { brands } : null
}
