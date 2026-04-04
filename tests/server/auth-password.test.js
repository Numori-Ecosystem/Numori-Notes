/**
 * Unit tests for server/api/auth/password.put.js
 *
 * Covers authKey verification, raw password fallback for legacy accounts,
 * hash upgrade, and note re-encryption storage.
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

const handler = (await import('../../server/api/auth/password.put.js')).default

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireAuth.mockResolvedValue({ userId: 1 })
})

describe('PUT /api/auth/password', () => {
  it('rejects missing newAuthKey', async () => {
    readBody.mockResolvedValue({ currentAuthKey: 'old' })
    await expect(handler({})).rejects.toThrow('Current and new credentials are required')
  })

  it('rejects missing both currentAuthKey and currentPassword', async () => {
    readBody.mockResolvedValue({ newAuthKey: 'new' })
    await expect(handler({})).rejects.toThrow('Current and new credentials are required')
  })

  it('rejects wrong credentials', async () => {
    const correctHash = await bcrypt.hash('correct-key', 4)
    readBody.mockResolvedValue({ currentAuthKey: 'wrong-key', currentPassword: 'wrong-pw', newAuthKey: 'new-key' })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: correctHash }] })
    await expect(handler({})).rejects.toThrow('Current password is incorrect')
  })

  it('rejects if user not found', async () => {
    readBody.mockResolvedValue({ currentAuthKey: 'key', newAuthKey: 'new' })
    mockQuery.mockResolvedValueOnce({ rows: [] })
    await expect(handler({})).rejects.toThrow('User not found')
  })

  it('verifies via currentAuthKey (new E2E account)', async () => {
    const currentAuthKey = 'current-auth-key'
    const currentHash = await bcrypt.hash(currentAuthKey, 4)
    const newAuthKey = 'new-auth-key'

    readBody.mockResolvedValue({ currentAuthKey, newAuthKey, reEncryptedNotes: [] })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: currentHash }] })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE password

    const result = await handler({})
    expect(result).toEqual({ updated: true })

    const updateCall = mockQuery.mock.calls[1]
    const newHash = updateCall[1][0]
    expect(await bcrypt.compare(newAuthKey, newHash)).toBe(true)
  })

  it('falls back to currentPassword for legacy accounts', async () => {
    const rawPassword = 'legacy-password'
    const legacyHash = await bcrypt.hash(rawPassword, 4)
    const newAuthKey = 'new-auth-key'

    readBody.mockResolvedValue({
      currentAuthKey: 'wrong-derived-key',
      currentPassword: rawPassword,
      newAuthKey,
      reEncryptedNotes: []
    })
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: legacyHash }] })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE password

    const result = await handler({})
    expect(result).toEqual({ updated: true })

    // New hash should be based on newAuthKey
    const newHash = mockQuery.mock.calls[1][1][0]
    expect(await bcrypt.compare(newAuthKey, newHash)).toBe(true)
  })

  it('updates password hash and re-encrypts notes', async () => {
    const currentAuthKey = 'current-auth-key'
    const currentHash = await bcrypt.hash(currentAuthKey, 4)
    const newAuthKey = 'new-auth-key'

    const reEncryptedNotes = [
      { clientId: 'n1', title: 'enc-title-1', description: 'enc-desc', tags: 'enc-tags', content: 'enc-content' },
      { clientId: 'n2', title: 'enc-title-2', description: 'enc-desc', tags: ['tag'], content: 'enc-content' }
    ]

    readBody.mockResolvedValue({ currentAuthKey, newAuthKey, reEncryptedNotes })

    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: currentHash }] })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE password
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE note 1
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE note 2

    const result = await handler({})
    expect(result).toEqual({ updated: true })
    expect(mockQuery).toHaveBeenCalledTimes(4)

    // Note 1: tags is a string, stored as-is
    const note1Call = mockQuery.mock.calls[2]
    expect(note1Call[1][0]).toBe('enc-title-1')
    expect(note1Call[1][2]).toBe('enc-tags')

    // Note 2: tags is an array, JSON.stringified
    const note2Call = mockQuery.mock.calls[3]
    expect(note2Call[1][2]).toBe('["tag"]')
  })

  it('skips notes without clientId', async () => {
    const currentAuthKey = 'key'
    const currentHash = await bcrypt.hash(currentAuthKey, 4)

    readBody.mockResolvedValue({
      currentAuthKey,
      newAuthKey: 'new',
      reEncryptedNotes: [{ title: 'no-id', content: 'x' }]
    })

    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: currentHash }] })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE password

    const result = await handler({})
    expect(result).toEqual({ updated: true })
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })
})
