import bcrypt from 'bcryptjs'
import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'
import { notifyDataWipe } from '../../utils/syncBroadcast.js'

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

  console.log('[delete] request received:', { type, hasAuthKey: !!authKey, userId: auth.userId })

  if (!authKey) {
    console.log('[delete] rejected: no authKey')
    throw createError({ statusCode: 400, statusMessage: 'Password is required to confirm this action' })
  }

  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [auth.userId])
  if (userResult.rows.length === 0) {
    console.log('[delete] rejected: user not found')
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const valid = await bcrypt.compare(authKey, userResult.rows[0].password_hash)
  console.log('[delete] bcrypt compare result:', valid)
  if (!valid) {
    console.log('[delete] rejected: incorrect password')
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  if (type === 'data') {
    console.log('[delete] executing data deletion for user', auth.userId)
    const r1 = await query('DELETE FROM notes WHERE user_id = $1', [auth.userId])
    console.log('[delete] deleted notes:', r1.rowCount)
    const r2 = await query('DELETE FROM deleted_notes WHERE user_id = $1', [auth.userId])
    console.log('[delete] deleted tombstones:', r2.rowCount)
    const r3 = await query('DELETE FROM shared_notes WHERE user_id = $1', [auth.userId])
    console.log('[delete] deleted shared_notes:', r3.rowCount)
    await query('UPDATE users SET welcome_created = FALSE WHERE id = $1', [auth.userId])
    notifyDataWipe(auth.userId, null)
    console.log('[delete] data deletion complete')
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
