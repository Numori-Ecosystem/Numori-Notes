/**
 * Unit tests for server/api/share/index.post.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn()
const mockOptionalAuth = vi.fn()

vi.mock('../../server/utils/db.js', () => ({ query: (...args) => mockQuery(...args) }))
vi.mock('../../server/utils/auth.js', () => ({ optionalAuth: (...args) => mockOptionalAuth(...args) }))

globalThis.defineEventHandler = (handler) => handler
globalThis.readBody = vi.fn()
globalThis.createError = (opts) => {
  const err = new Error(opts.statusMessage)
  err.statusCode = opts.statusCode
  return err
}

const handler = (await import('../../server/api/share/index.post.js')).default

beforeEach(() => {
  vi.clearAllMocks()
  mockOptionalAuth.mockResolvedValue(null) // unauthenticated by default
  // Default: resolve with empty rows (covers migration ALTER TABLE + INSERT calls)
  mockQuery.mockResolvedValue({ rows: [] })
})

// Helper: find the INSERT call (the one whose SQL starts with INSERT)
const findInsertCall = () => mockQuery.mock.calls.find(c => typeof c[0] === 'string' && c[0].includes('INSERT'))

describe('POST /api/share', () => {
  it('rejects empty body', async () => {
    readBody.mockResolvedValue({})
    await expect(handler({})).rejects.toThrow('Title or content is required')
  })

  it('creates a share with encrypted fields', async () => {
    const encTitle = '{"iv":"a","ct":"b"}'
    const encContent = '{"iv":"c","ct":"d"}'
    const encTags = '{"iv":"e","ct":"f"}'

    readBody.mockResolvedValue({
      title: encTitle,
      content: encContent,
      tags: encTags,
      description: '{"iv":"g","ct":"h"}',
      encrypted: true,
      sourceClientId: 'client-1'
    })

    const result = await handler({})
    expect(result.hash).toBeDefined()
    expect(result.hash).toHaveLength(32)

    // Verify INSERT params
    const insertCall = findInsertCall()
    const params = insertCall[1]
    expect(params[2]).toBe(encTitle) // title stored as encrypted string
    expect(params[4]).toBe(encTags) // tags stored as encrypted string
    expect(params[5]).toBe(encContent) // content
    expect(params[11]).toBe(true) // encrypted flag
    expect(params[12]).toBe('client-1') // sourceClientId
  })

  it('stores array tags as JSON string', async () => {
    readBody.mockResolvedValue({
      title: 'Test',
      content: 'content',
      tags: ['a', 'b']
    })

    await handler({})

    const params = findInsertCall()[1]
    expect(params[4]).toBe('["a","b"]')
    expect(params[11]).toBe(false) // not encrypted
  })

  it('sets encrypted=false when not specified', async () => {
    readBody.mockResolvedValue({ title: 'Test', content: 'c' })

    await handler({})

    const params = findInsertCall()[1]
    expect(params[11]).toBe(false)
  })

  it('uses authenticated user identity when not anonymous', async () => {
    mockOptionalAuth.mockResolvedValue({ userId: 42 })
    readBody.mockResolvedValue({ title: 'Test', content: 'c' })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ name: 'Alice', email: 'alice@example.com' }] }) // user lookup
      .mockResolvedValueOnce({ rows: [] }) // ALTER TABLE ensurePasswordHintColumn
      // INSERT uses default mockResolvedValue

    await handler({})

    const insertParams = findInsertCall()[1]
    expect(insertParams[1]).toBe(42) // user_id
    expect(insertParams[6]).toBe('Alice') // sharer_name
    expect(insertParams[7]).toBe('alice@example.com') // sharer_email
  })

  it('hides identity when anonymous', async () => {
    mockOptionalAuth.mockResolvedValue({ userId: 42 })
    readBody.mockResolvedValue({ title: 'Test', content: 'c', anonymous: true })

    await handler({})

    const params = findInsertCall()[1]
    expect(params[1]).toBeNull() // user_id
    expect(params[6]).toBeNull() // sharer_name
    expect(params[7]).toBeNull() // sharer_email
    expect(params[8]).toBe(true) // anonymous
  })

  it('stores sourceClientId as null when not provided', async () => {
    readBody.mockResolvedValue({ title: 'Test', content: 'c' })

    await handler({})

    const params = findInsertCall()[1]
    expect(params[12]).toBeNull()
  })

  it('clamps expiration to 1-30 days', async () => {
    readBody.mockResolvedValue({ title: 'Test', content: 'c', expiresInDays: 999 })

    await handler({})

    const params = findInsertCall()[1]
    const expiresAt = new Date(params[9])
    const now = new Date()
    const diffDays = (expiresAt - now) / 86400000
    expect(diffDays).toBeGreaterThan(29)
    expect(diffDays).toBeLessThanOrEqual(31)
  })
})
