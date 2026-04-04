/**
 * Unit tests for server/api/auth/login.post.js
 *
 * Covers both the new authKey flow and legacy raw-password fallback,
 * including the transparent hash upgrade on legacy login.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

const mockQuery = vi.fn()
const mockSignJwt = vi.fn()

vi.mock('../../server/utils/db.js', () => ({ query: (...args) => mockQuery(...args) }))
vi.mock('../../server/utils/auth.js', () => ({ signJwt: (...args) => mockSignJwt(...args) }))

globalThis.defineEventHandler = (handler) => handler
globalThis.readBody = vi.fn()
globalThis.createError = (opts) => {
  const err = new Error(opts.statusMessage)
  err.statusCode = opts.statusCode
  return err
}

const handler = (await import('../../server/api/auth/login.post.js')).default

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

describe('POST /api/auth/login', () => {
  it('rejects missing email', async () => {
    readBody.mockResolvedValue({ authKey: 'abc' })
    await expect(handler({})).rejects.toThrow('Email and credentials are required')
  })

  it('rejects missing both authKey and password', async () => {
    readBody.mockResolvedValue({ email: 'test@example.com' })
    await expect(handler({})).rejects.toThrow('Email and credentials are required')
  })

  it('rejects non-existent user', async () => {
    readBody.mockResolvedValue({ email: 'nobody@example.com', authKey: 'abc' })
    mockQuery.mockResolvedValueOnce({ rows: [] })
    await expect(handler({})).rejects.toThrow('Invalid email or password')
  })

  it('succeeds with correct authKey (new E2E account)', async () => {
    const authKey = 'a'.repeat(64)
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ email: 'test@example.com', authKey })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', name: 'Test', password_hash: hash, created_at: '2025-01-01' }]
    })
    mockSignJwt.mockResolvedValue('jwt-token')

    const result = await handler({})
    expect(result.token).toBe('jwt-token')
    expect(result.user.email).toBe('test@example.com')
    // No upgrade query since authKey matched directly
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('falls back to raw password for legacy accounts', async () => {
    const rawPassword = 'myOldPassword123'
    const legacyHash = await bcrypt.hash(rawPassword, 4)
    const authKey = 'derived-auth-key-that-wont-match'

    readBody.mockResolvedValue({ email: 'test@example.com', authKey, password: rawPassword })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', name: 'Test', password_hash: legacyHash, created_at: '2025-01-01' }]
    })
    // Upgrade query
    mockQuery.mockResolvedValueOnce({ rows: [] })
    mockSignJwt.mockResolvedValue('jwt-token')

    const result = await handler({})
    expect(result.token).toBe('jwt-token')

    // Should have upgraded the hash
    expect(mockQuery).toHaveBeenCalledTimes(2)
    const upgradeCall = mockQuery.mock.calls[1]
    expect(upgradeCall[0]).toContain('UPDATE users SET password_hash')
    // The new hash should be bcrypt(authKey)
    const newHash = upgradeCall[1][0]
    expect(await bcrypt.compare(authKey, newHash)).toBe(true)
  })

  it('rejects wrong authKey AND wrong password', async () => {
    const correctHash = await bcrypt.hash('correct-password', 4)
    readBody.mockResolvedValue({ email: 'test@example.com', authKey: 'wrong-key', password: 'wrong-password' })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', name: 'Test', password_hash: correctHash, created_at: '2025-01-01' }]
    })
    await expect(handler({})).rejects.toThrow('Invalid email or password')
  })

  it('does not upgrade hash if authKey is not provided', async () => {
    const rawPassword = 'myPassword'
    const hash = await bcrypt.hash(rawPassword, 4)
    readBody.mockResolvedValue({ email: 'test@example.com', password: rawPassword })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', name: 'Test', password_hash: hash, created_at: '2025-01-01' }]
    })
    mockSignJwt.mockResolvedValue('token')

    await handler({})

    // No upgrade — only the SELECT query
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('normalizes email to lowercase', async () => {
    const authKey = 'a'.repeat(64)
    const hash = await bcrypt.hash(authKey, 4)
    readBody.mockResolvedValue({ email: '  TEST@Example.COM  ', authKey })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', name: '', password_hash: hash, created_at: '2025-01-01' }]
    })
    mockSignJwt.mockResolvedValue('token')

    await handler({})
    expect(mockQuery.mock.calls[0][1][0]).toBe('test@example.com')
  })
})
