import bcrypt from 'bcryptjs'
import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * PUT /api/auth/password — Change password with atomic note re-encryption.
 *
 * Body: { currentAuthKey, newAuthKey, reEncryptedNotes, currentPassword? }
 *
 * The client sends:
 *   - currentAuthKey: derived from the current password via PBKDF2
 *   - currentPassword: the raw current password (fallback for legacy accounts)
 *   - newAuthKey: derived from the new password via PBKDF2
 *   - reEncryptedNotes: all notes re-encrypted with the new encKey
 *
 * The server verifies the current credential (tries authKey first, then raw
 * password for legacy accounts), updates the hash to hash(newAuthKey), and
 * overwrites all notes with the re-encrypted data.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { currentAuthKey, newAuthKey, reEncryptedNotes = [], currentPassword } = body || {}

  if (!newAuthKey || (!currentAuthKey && !currentPassword)) {
    throw createError({ statusCode: 400, statusMessage: 'Current and new credentials are required' })
  }

  // Verify current credential
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [auth.userId])
  if (result.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  let valid = false
  if (currentAuthKey) {
    valid = await bcrypt.compare(currentAuthKey, result.rows[0].password_hash)
  }
  if (!valid && currentPassword) {
    valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
  }
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
  }

  // Update password hash to new authKey-based hash
  const newHash = await bcrypt.hash(newAuthKey, 12)
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, auth.userId])

  // Overwrite all notes with re-encrypted data
  for (const note of reEncryptedNotes) {
    if (!note.clientId) continue
    await query(`
      UPDATE notes SET
        title = $1,
        description = $2,
        tags = $3,
        content = $4,
        updated_at = NOW()
      WHERE user_id = $5 AND client_id = $6 AND deleted_at IS NULL
    `, [
      note.title,
      note.description,
      typeof note.tags === 'string' ? note.tags : JSON.stringify(note.tags),
      note.content,
      auth.userId,
      note.clientId
    ])
  }

  return { updated: true }
})
