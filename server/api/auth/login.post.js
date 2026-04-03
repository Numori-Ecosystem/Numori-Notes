import bcrypt from 'bcryptjs'
import { query } from '../../utils/db.js'
import { signJwt } from '../../utils/auth.js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body || {}

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
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
  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const secret = process.env.JWT_SECRET
  const token = await signJwt({ userId: user.id, email: user.email }, secret)

  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
    token
  }
})
