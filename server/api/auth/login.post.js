import bcrypt from 'bcryptjs'
import { query } from '../../utils/db.js'
import { signJwt } from '../../utils/auth.js'

/**
 * POST /api/auth/login
 *
 * Body: { email, authKey, password }
 *
 * Supports two authentication flows:
 *   1. New (E2E): client sends `authKey` derived from password via PBKDF2.
 *      Server compares against hash(authKey) stored in the DB.
 *   2. Legacy: existing accounts created before E2E have hash(rawPassword).
 *      Client also sends the raw `password` as a fallback.
 *
 * When a legacy account logs in successfully via the raw password, the server
 * upgrades the stored hash to hash(authKey) so all future logins use the
 * new E2E flow. This is a transparent one-time migration per account.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, authKey, password } = body || {}

  if (!email || (!authKey && !password)) {
    throw createError({ statusCode: 400, statusMessage: 'Email and credentials are required' })
  }

  const emailNorm = email.toLowerCase().trim()

  const result = await query(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
    [emailNorm]
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const user = result.rows[0]

  // Try the new authKey first (accounts created/migrated with E2E)
  let valid = false
  let needsUpgrade = false

  if (authKey) {
    valid = await bcrypt.compare(authKey, user.password_hash)
  }

  // Fall back to raw password for legacy accounts
  if (!valid && password) {
    valid = await bcrypt.compare(password, user.password_hash)
    if (valid) {
      // Legacy account — upgrade the hash to use authKey for future logins
      needsUpgrade = true
    }
  }

  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  // Upgrade legacy hash to authKey-based hash
  if (needsUpgrade && authKey) {
    const newHash = await bcrypt.hash(authKey, 12)
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, user.id])
  }

  const secret = process.env.JWT_SECRET
  const token = await signJwt({ userId: user.id, email: user.email }, secret)

  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
    token
  }
})
