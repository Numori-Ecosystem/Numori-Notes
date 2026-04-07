/**
 * Unit tests for server/api/auth/delete.post.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

const mockQuery = vi.fn()
const mockRequireAuth = vi.fn()
const mockNotifySync = vi.fn()

vi.mock('../../server/utils/db.js', () => ({ query: (...args) => mockQuery(...args) }))
vi.mock('../../server/utils/auth.js', () => ({ requireAuth: (...args) => mockRequireAuth(...args) }))
vi.mock('../../server/utils/syncBroadcast.js', () => ({ notifyDataWipe: (...args) => mockNotifySync(...args) }))

globalThis.defineEventHandler = (handler) => handler
globalThis.readBody = vi.fn()
globalThis.createError = (opts) => {
  const err = new Error(opts.statusMessage)
  err.statusCode = opts.statusCode
  return err
}

const handler = (await import('../../server/api/auth/delete.post.js')).default

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireAuth.mockResolvedValue({ userId: 1 })
})

describe('POST /api/auth/delete', () => {
  it('rejects missing authKey', async () => {
    readBody.mockResolvedValue({ type: 'data' })
    await expect(handler({})).rejects.toThrow('Password is required')
  })

  it('rejects wrong authKey', async () => {
    const hash = await bcrypt.hash('correct-key', 4)
    readBody.mockResolvedValue({ type: 'data', authKey: 'wrong-key' })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
    await expect(handler({})).rejects.toThrow('Incorrect password')
  })

  it('handles type=data — deletes notes, tombstones, shared notes and resets welcome', async () => {
    const authKey = 'key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'data', authKey })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: hash }] }) // SELECT password
      .mockResolvedValueOnce({ rows: [] }) // DELETE notes
      .mockResolvedValueOnce({ rows: [] }) // DELETE deleted_notes
      .mockResolvedValueOnce({ rows: [] }) // DELETE shared_notes
      .mockResolvedValueOnce({ rows: [] }) // UPDATE welcome_created

    const result = await handler({})
    expect(result).toEqual({ deleted: 'data' })
    expect(mockQuery).toHaveBeenCalledTimes(5)
    expect(mockNotifySync).toHaveBeenCalledWith(1, null)
  })

  it('handles type=account — deletes account and all data', async () => {
    const authKey = 'key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'account', authKey })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: hash }] }) // SELECT password
      .mockResolvedValueOnce({ rows: [] }) // DELETE shared_notes
      .mockResolvedValueOnce({ rows: [] }) // DELETE notes
      .mockResolvedValueOnce({ rows: [] }) // DELETE deleted_notes
      .mockResolvedValueOnce({ rows: [] }) // DELETE users

    const result = await handler({})
    expect(result).toEqual({ deleted: 'account' })
    expect(mockQuery).toHaveBeenCalledTimes(5)
  })

  it('rejects invalid type', async () => {
    const authKey = 'key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'invalid', authKey })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
    await expect(handler({})).rejects.toThrow('Type must be "account" or "data"')
  })
})
