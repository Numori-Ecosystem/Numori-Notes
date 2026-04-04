import bcrypt from 'bcryptjs'
import { query } from '../../utils/db.js'
import { signJwt } from '../../utils/auth.js'

/**
 * POST /api/auth/register
 *
 * Body: { email, authKey, name? }
 *
 * The client derives an authKey from the user's password via PBKDF2.
 * We store hash(authKey) — the raw password never reaches the server.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, authKey, name } = body || {}

  if (!email || !authKey) {
    throw createError({ statusCode: 400, statusMessage: 'Email and credentials are required' })
  }

  if (authKey.length < 16) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid credentials' })
  }

  const emailNorm = email.toLowerCase().trim()

  const existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm])
  if (existing.rows.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(authKey, 12)

  const result = await query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [emailNorm, (name || '').trim(), passwordHash]
  )

  const user = result.rows[0]
  const secret = process.env.JWT_SECRET
  const token = await signJwt({ userId: user.id, email: user.email }, secret)

  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
    token
  }
})
