import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const result = await query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [auth.userId]
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const user = result.rows[0]
  return { id: user.id, email: user.email, name: user.name, createdAt: user.created_at }
})
