import bcrypt from 'bcryptjs'
import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'
import { notifyDataWipe } from '../../utils/syncBroadcast.js'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { type, authKey } = body || {}

  if (!authKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required to confirm this action',
    })
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
    // Record tombstones for ALL existing notes/groups BEFORE deleting them.
    // This prevents offline devices from reviving data when they sync later.
    await query(
      `INSERT INTO deleted_notes (user_id, client_id)
       SELECT user_id, client_id FROM notes WHERE user_id = $1 AND client_id IS NOT NULL
       ON CONFLICT DO NOTHING`,
      [auth.userId],
    )
    await query(
      `INSERT INTO deleted_groups (user_id, client_id)
       SELECT user_id, client_id FROM groups WHERE user_id = $1 AND client_id IS NOT NULL
       ON CONFLICT DO NOTHING`,
      [auth.userId],
    )

    await query('DELETE FROM notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM groups WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM shared_notes WHERE user_id = $1', [auth.userId])
    await query(`UPDATE users SET welcome_created = FALSE, data_wiped_at = NOW() WHERE id = $1`, [
      auth.userId,
    ])
    notifyDataWipe(auth.userId, null)
    return { deleted: 'data' }
  }

  if (type === 'account') {
    await query('DELETE FROM sessions WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM shared_notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM groups WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM deleted_notes WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM deleted_groups WHERE user_id = $1', [auth.userId])
    await query('DELETE FROM users WHERE id = $1', [auth.userId])
    return { deleted: 'account' }
  }

  throw createError({ statusCode: 400, statusMessage: 'Type must be "account" or "data"' })
})
