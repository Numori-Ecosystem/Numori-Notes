import bcrypt from 'bcryptjs'
import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * POST /api/auth/delete — Request account deletion or delete data.
 * Body: { type: 'account' | 'data', password }
 *
 * - 'data': Deletes all notes and shared notes but keeps the account.
 * - 'account': Marks account for deletion (sets deletion_requested_at).
 *              A background job or manual process handles final removal.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { type, authKey, password } = body || {}

  // Support both authKey (new E2E flow) and password (legacy)
  const credential = authKey || password
  if (!credential) {
    throw createError({ statusCode: 400, statusMessage: 'Password is required to confirm this action' })
  }

  // Verify credential
  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [auth.userId])
  if (userResult.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const valid = await bcrypt.compare(credential, userResult.rows[0].password_hash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  if (type === 'data') {
    await query('DELETE FROM notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM shared_notes WHERE user_id = $1', [auth.userId])
    return { deleted: 'data' }
  }

  if (type === 'account') {
    // Mark for deletion — cascade will clean up notes/shares
    await query('UPDATE users SET deletion_requested_at = NOW() WHERE id = $1', [auth.userId])
    return { deleted: 'account_requested' }
  }

  throw createError({ statusCode: 400, statusMessage: 'Type must be "account" or "data"' })
})
