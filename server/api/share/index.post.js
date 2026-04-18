import { randomBytes } from 'node:crypto'
import { optionalAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

// Ensure password_hint column exists (idempotent, safe to call on every request)
async function ensurePasswordHintColumn() {
  await query(`ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS password_hint TEXT`).catch(
    () => {},
  )
}

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
  const {
    title,
    content,
    description,
    tags,
    anonymous,
    sharerName,
    sharerEmail,
    expiresInDays,
    collectAnalytics,
    encrypted,
    passwordHint,
  } = body || {}

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

  const hint = passwordHint || null

  await ensurePasswordHintColumn()

  const columns = [
    'hash',
    'user_id',
    'title',
    'description',
    'tags',
    'content',
    'sharer_name',
    'sharer_email',
    'anonymous',
    'expires_at',
    'collect_analytics',
    'encrypted',
    'source_client_id',
  ]
  const params = [
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
    body.sourceClientId || null,
  ]

  if (hint) {
    columns.push('password_hint')
    params.push(hint)
  }

  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ')
  await query(`INSERT INTO shared_notes (${columns.join(', ')}) VALUES (${placeholders})`, params)

  return { hash }
})
