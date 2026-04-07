import { query } from './db.js'
import { enrichSession } from './geo.js'

/**
 * Hash a JWT token to store in the sessions table.
 * We don't store the raw token — just a SHA-256 hash for lookup.
 */
export async function hashToken(token) {
  const data = new TextEncoder().encode(token)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('hex')
}

/**
 * Parse a user-agent string into a friendly device name.
 */
export function parseDeviceName(ua) {
  if (!ua) return 'Unknown device'

  // Mobile apps
  if (ua.includes('Capacitor')) {
    if (ua.includes('Android')) return 'Android App'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS App'
    return 'Mobile App'
  }

  // Detect OS
  let os = 'Unknown OS'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('CrOS')) os = 'ChromeOS'

  // Detect browser
  let browser = ''
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'

  return browser ? `${browser} on ${os}` : os
}

/**
 * Create a session record for a newly issued token.
 * Location is resolved asynchronously via IP geolocation.
 */
export async function createSession(userId, token, event) {
  const tokenHash = await hashToken(token)
  const ua = getHeader(event, 'user-agent') || ''
  const deviceName = parseDeviceName(ua)

  const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getHeader(event, 'x-real-ip')
    || event.node?.req?.socket?.remoteAddress
    || null

  const result = await query(
    `INSERT INTO sessions (user_id, token_hash, device_name, ip_address)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [userId, tokenHash, deviceName, ip]
  )

  const sessionId = result.rows[0]?.id
  if (sessionId) {
    enrichSession(event, ip, sessionId)
  }
}

/**
 * Update last_used_at for a session identified by token hash.
 * Returns the session row or null if not found (revoked).
 */
export async function touchSession(tokenHash) {
  const result = await query(
    `UPDATE sessions SET last_used_at = NOW() WHERE token_hash = $1 RETURNING id`,
    [tokenHash]
  )
  return result.rows[0] || null
}

/**
 * Delete all sessions for a user except the current one.
 */
export async function revokeOtherSessions(userId, currentTokenHash) {
  await query(
    'DELETE FROM sessions WHERE user_id = $1 AND token_hash != $2',
    [userId, currentTokenHash]
  )
}

/**
 * Delete a specific session by id (must belong to user).
 */
export async function revokeSession(userId, sessionId) {
  const result = await query(
    'DELETE FROM sessions WHERE id = $1 AND user_id = $2 RETURNING id',
    [sessionId, userId]
  )
  return result.rows.length > 0
}

/**
 * Delete all sessions for a user.
 */
export async function revokeAllSessions(userId) {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId])
}
