import bcrypt from 'bcryptjs'
import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'
import { notifySync } from '../../utils/syncBroadcast.js'

/**
 * POST /api/auth/delete — Delete account data or the entire account.
 * Body: { type: 'account' | 'data', password }
 *
 * - 'data': Deletes all notes and shared notes but keeps the account.
 * - 'account': Permanently deletes the account and all associated data immediately.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { type, authKey } = body || {}

  if (!authKey) {
    throw createError({ statusCode: 400, statusMessage: 'Password is required to confirm this action' })
  }

  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [auth.userId])
  if (userResult.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const valid = await bcrypt.compare(authKey, userResult.rows[0].password_hash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  if (type === 'data') {
    await query('DELETE FROM notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM deleted_notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM shared_notes WHERE user_id = $1', [auth.userId])
    await query('UPDATE users SET welcome_created = FALSE WHERE id = $1', [auth.userId])
    // Notify other devices so they sync immediately
    notifySync(auth.userId, null)
    return { deleted: 'data' }
  }

  if (type === 'account') {
    // Permanently delete account and all associated data
    await query('DELETE FROM shared_notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM deleted_notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM users WHERE id = $1', [auth.userId])
    return { deleted: 'account' }
  }

  throw createError({ statusCode: 400, statusMessage: 'Type must be "account" or "data"' })
})
