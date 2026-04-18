import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const result = await query(
    'SELECT id, email, name, avatar_url, created_at, privacy_no_tracking, email_verified, password_recovery_enabled, session_duration FROM users WHERE id = $1',
    [auth.userId],
  )

  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const user = result.rows[0]

  // Fetch summary stats
  const notesResult = await query('SELECT COUNT(*) as count FROM notes WHERE user_id = $1', [
    auth.userId,
  ])
  const sharesResult = await query(
    'SELECT COUNT(*) as count FROM shared_notes WHERE user_id = $1',
    [auth.userId],
  )

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    privacyNoTracking: user.privacy_no_tracking,
    emailVerified: user.email_verified,
    passwordRecoveryEnabled: user.password_recovery_enabled,
    sessionDuration: user.session_duration,
    stats: {
      notesCount: parseInt(notesResult.rows[0].count),
      sharedCount: parseInt(sharesResult.rows[0].count),
    },
  }
})
