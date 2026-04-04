import { randomBytes } from 'node:crypto'
import { optionalAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * POST /api/share — Share a note. No account required.
 *
 * Body:
 *   { title, description, tags, content, anonymous?, sharerName?, sharerEmail?,
 *     expiresInDays?, collectAnalytics?, encrypted? }
 *
 * When `encrypted` is true, the title/description/tags/content fields contain
 * AES-GCM ciphertext produced by the client. The server stores them opaquely.
 *
 * If authenticated and not anonymous, sharer details come from the user account.
 * Returns: { hash }
 */
export default defineEventHandler(async (event) => {
  const auth = await optionalAuth(event)
  const body = await readBody(event)
  const { title, content, description, tags, anonymous, sharerName, sharerEmail, expiresInDays, collectAnalytics, encrypted } = body || {}

  if (!content && !title) {
    throw createError({ statusCode: 400, statusMessage: 'Title or content is required to share' })
  }

  const hash = randomBytes(16).toString('hex')

  // Determine sharer identity
  let name = null
  let email = null
  let userId = null
  const isAnonymous = anonymous === true

  if (auth && !isAnonymous) {
    userId = auth.userId
    const userResult = await query('SELECT name, email FROM users WHERE id = $1', [auth.userId])
    if (userResult.rows.length > 0) {
      name = userResult.rows[0].name || null
      email = userResult.rows[0].email || null
    }
  } else if (!isAnonymous) {
    name = sharerName || null
    email = sharerEmail || null
  }

  let expiresAt = null
  const days = Math.min(Math.max(parseInt(expiresInDays) || 30, 1), 30)
  expiresAt = new Date(Date.now() + days * 86400000).toISOString()

  // Tags may be an encrypted string or an array
  const tagsValue = typeof tags === 'string' ? tags : JSON.stringify(tags || [])

  await query(`
    INSERT INTO shared_notes (hash, user_id, title, description, tags, content, sharer_name, sharer_email, anonymous, expires_at, collect_analytics, encrypted, source_client_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `, [
    hash,
    userId,
    title || 'Shared Note',
    description || '',
    tagsValue,
    content || '',
    name,
    email,
    isAnonymous,
    expiresAt,
    collectAnalytics === true,
    encrypted === true,
    body.sourceClientId || null
  ])

  return { hash }
})
