import bcrypt from 'bcryptjs'
import { query } from '../../utils/db.js'
import { signJwt } from '../../utils/auth.js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, name, password } = body || {}

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }

  const emailNorm = email.toLowerCase().trim()

  // Check if user already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm])
  if (existing.rows.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const result = await query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [emailNorm, (name || '').trim(), passwordHash]
  )

  const user = result.rows[0]
  const secret = process.env.JWT_SECRET || useRuntimeConfig().jwtSecret
  const token = await signJwt({ userId: user.id, email: user.email }, secret)

  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
    token
  }
})
