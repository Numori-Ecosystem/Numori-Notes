/**
 * Unit tests for server/api/auth/delete.post.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

const mockQuery = vi.fn()
const mockRequireAuth = vi.fn()

vi.mock('../../server/utils/db.js', () => ({ query: (...args) => mockQuery(...args) }))
vi.mock('../../server/utils/auth.js', () => ({ requireAuth: (...args) => mockRequireAuth(...args) }))

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
  it('rejects missing credential', async () => {
    readBody.mockResolvedValue({ type: 'data' })
    await expect(handler({})).rejects.toThrow('Password is required')
  })

  it('accepts authKey (new E2E flow)', async () => {
    const authKey = 'derived-auth-key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'data', authKey })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
      .mockResolvedValueOnce({ rows: [] }) // DELETE notes
      .mockResolvedValueOnce({ rows: [] }) // DELETE shared_notes

    const result = await handler({})
    expect(result).toEqual({ deleted: 'data' })
  })

  it('accepts password (legacy flow)', async () => {
    const password = 'legacy-password'
    const hash = await bcrypt.hash(password, 4)
    readBody.mockResolvedValue({ type: 'data', password })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await handler({})
    expect(result).toEqual({ deleted: 'data' })
  })

  it('rejects wrong credential', async () => {
    const hash = await bcrypt.hash('correct', 4)
    readBody.mockResolvedValue({ type: 'data', authKey: 'wrong' })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
    await expect(handler({})).rejects.toThrow('Incorrect password')
  })

  it('handles type=data — deletes notes and shared notes', async () => {
    const authKey = 'key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'data', authKey })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await handler({})
    expect(result).toEqual({ deleted: 'data' })
    // 3 queries: SELECT password + DELETE notes + DELETE shared_notes
    expect(mockQuery).toHaveBeenCalledTimes(3)
  })

  it('handles type=account — marks for deletion', async () => {
    const authKey = 'key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'account', authKey })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE deletion_requested_at

    const result = await handler({})
    expect(result).toEqual({ deleted: 'account_requested' })
  })

  it('rejects invalid type', async () => {
    const authKey = 'key'
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ type: 'invalid', authKey })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
    await expect(handler({})).rejects.toThrow('Type must be "account" or "data"')
  })
})
