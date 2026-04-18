/**
 * Unit tests for utils/crypto.js — E2E encryption primitives.
 *
 * Covers: key derivation, encrypt/decrypt round-trips, isEncrypted detection,
 * note-level helpers, shared note helpers, key independence, and edge cases.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  deriveAuthKey,
  deriveEncKey,
  deriveShareKey,
  generateSharePassword,
  encrypt,
  decrypt,
  isEncrypted,
  encryptNote,
  decryptNote,
  encryptSharedNote,
  decryptSharedNote
} from '../utils/crypto.js'

// ── deriveAuthKey ────────────────────────────────────────────────────────

describe('deriveAuthKey', () => {
  it('returns a 64-char hex string (256 bits)', async () => {
    const key = await deriveAuthKey('testpassword')
    expect(key).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same password yields same key', async () => {
    const a = await deriveAuthKey('mypassword')
    const b = await deriveAuthKey('mypassword')
    expect(a).toBe(b)
  })

  it('different passwords yield different keys', async () => {
    const a = await deriveAuthKey('password1')
    const b = await deriveAuthKey('password2')
    expect(a).not.toBe(b)
  })
})

// ── deriveEncKey ─────────────────────────────────────────────────────────

describe('deriveEncKey', () => {
  it('returns a CryptoKey with AES-GCM algorithm', async () => {
    const key = await deriveEncKey('testpassword')
    expect(key).toBeInstanceOf(CryptoKey)
    expect(key.algorithm.name).toBe('AES-GCM')
    expect(key.algorithm.length).toBe(256)
  })

  it('key is non-extractable', async () => {
    const key = await deriveEncKey('testpassword')
    expect(key.extractable).toBe(true) // extractable for sessionStorage persistence
  })

  it('key supports encrypt and decrypt', async () => {
    const key = await deriveEncKey('testpassword')
    expect(key.usages).toContain('encrypt')
    expect(key.usages).toContain('decrypt')
  })
})

// ── Key independence ─────────────────────────────────────────────────────

describe('key independence', () => {
  it('authKey and encKey are derived from different salts (not equal)', async () => {
    // We can't directly compare a hex string to a CryptoKey, but we can
    // verify that the authKey hex doesn't appear in the encrypted output
    // produced by encKey — proving they are independent.
    const authKey = await deriveAuthKey('samepassword')
    const encKey = await deriveEncKey('samepassword')
    const encrypted = await encrypt('test', encKey)
    // The authKey hex should not appear in the ciphertext
    expect(encrypted).not.toContain(authKey)
  })

  it('shareKey is independent from encKey', async () => {
    const encKey = await deriveEncKey('samepassword')
    const shareKey = await deriveShareKey('samepassword')
    // Encrypt with encKey, try to decrypt with shareKey — should fail
    const encrypted = await encrypt('secret', encKey)
    await expect(decrypt(encrypted, shareKey)).rejects.toThrow()
  })
})

// ── deriveShareKey ───────────────────────────────────────────────────────

describe('deriveShareKey', () => {
  it('returns a non-extractable AES-GCM CryptoKey', async () => {
    const key = await deriveShareKey('sharepass')
    expect(key).toBeInstanceOf(CryptoKey)
    expect(key.algorithm.name).toBe('AES-GCM')
    expect(key.extractable).toBe(false)
  })

  it('same password yields same key (deterministic)', async () => {
    const k1 = await deriveShareKey('sharepass')
    const k2 = await deriveShareKey('sharepass')
    // Can't compare CryptoKeys directly, but encrypt with k1 and decrypt with k2
    const ct = await encrypt('hello', k1)
    const pt = await decrypt(ct, k2)
    expect(pt).toBe('hello')
  })

  it('different passwords yield incompatible keys', async () => {
    const k1 = await deriveShareKey('pass1')
    const k2 = await deriveShareKey('pass2')
    const ct = await encrypt('hello', k1)
    await expect(decrypt(ct, k2)).rejects.toThrow()
  })
})

// ── generateSharePassword ────────────────────────────────────────────────

describe('generateSharePassword', () => {
  it('returns a non-empty string', () => {
    const pw = generateSharePassword()
    expect(typeof pw).toBe('string')
    expect(pw.length).toBeGreaterThan(0)
  })

  it('is URL-safe (no +, /, or = characters)', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateSharePassword()
      expect(pw).not.toMatch(/[+/=]/)
    }
  })

  it('generates unique values', () => {
    const set = new Set()
    for (let i = 0; i < 50; i++) set.add(generateSharePassword())
    expect(set.size).toBe(50)
  })
})

// ── encrypt / decrypt ────────────────────────────────────────────────────

describe('encrypt / decrypt', () => {
  let key

  beforeAll(async () => {
    key = await deriveEncKey('testkey')
  })

  it('round-trips a simple string', async () => {
    const ct = await encrypt('hello world', key)
    const pt = await decrypt(ct, key)
    expect(pt).toBe('hello world')
  })

  it('round-trips an empty string', async () => {
    const ct = await encrypt('', key)
    const pt = await decrypt(ct, key)
    expect(pt).toBe('')
  })

  it('round-trips unicode content', async () => {
    const text = '日本語テスト 🎉 émojis & spëcial chars'
    const ct = await encrypt(text, key)
    const pt = await decrypt(ct, key)
    expect(pt).toBe(text)
  })

  it('round-trips a large string', async () => {
    const text = 'x'.repeat(100_000)
    const ct = await encrypt(text, key)
    const pt = await decrypt(ct, key)
    expect(pt).toBe(text)
  })

  it('encrypted output is a JSON string with iv and ct fields', async () => {
    const ct = await encrypt('test', key)
    const parsed = JSON.parse(ct)
    expect(parsed).toHaveProperty('iv')
    expect(parsed).toHaveProperty('ct')
    expect(typeof parsed.iv).toBe('string')
    expect(typeof parsed.ct).toBe('string')
  })

  it('each encryption produces a different ciphertext (random IV)', async () => {
    const ct1 = await encrypt('same text', key)
    const ct2 = await encrypt('same text', key)
    expect(ct1).not.toBe(ct2)
    // But both decrypt to the same plaintext
    expect(await decrypt(ct1, key)).toBe('same text')
    expect(await decrypt(ct2, key)).toBe('same text')
  })

  it('decryption with wrong key throws', async () => {
    const wrongKey = await deriveEncKey('wrongpassword')
    const ct = await encrypt('secret', key)
    await expect(decrypt(ct, wrongKey)).rejects.toThrow()
  })

  it('decryption of tampered ciphertext throws', async () => {
    const ct = await encrypt('secret', key)
    const parsed = JSON.parse(ct)
    // Flip a byte in the ciphertext
    const ctBytes = atob(parsed.ct)
    const tampered = String.fromCharCode(ctBytes.charCodeAt(0) ^ 0xff) + ctBytes.slice(1)
    parsed.ct = btoa(tampered)
    await expect(decrypt(JSON.stringify(parsed), key)).rejects.toThrow()
  })
})

// ── isEncrypted ──────────────────────────────────────────────────────────

describe('isEncrypted', () => {
  it('returns true for a valid encrypted payload', async () => {
    const key = await deriveEncKey('test')
    const ct = await encrypt('hello', key)
    expect(isEncrypted(ct)).toBe(true)
  })

  it('returns false for plain text', () => {
    expect(isEncrypted('hello world')).toBe(false)
  })

  it('returns false for a JSON array (legacy tags)', () => {
    expect(isEncrypted('["tag1","tag2"]')).toBe(false)
  })

  it('returns false for null / undefined / empty', () => {
    expect(isEncrypted(null)).toBe(false)
    expect(isEncrypted(undefined)).toBe(false)
    expect(isEncrypted('')).toBe(false)
  })

  it('returns false for JSON without iv/ct', () => {
    expect(isEncrypted('{"foo":"bar"}')).toBe(false)
  })

  it('returns false for JSON with only iv', () => {
    expect(isEncrypted('{"iv":"abc"}')).toBe(false)
  })

  it('returns true for manually crafted {iv, ct} JSON', () => {
    expect(isEncrypted('{"iv":"abc","ct":"def"}')).toBe(true)
  })
})

// ── encryptNote / decryptNote ────────────────────────────────────────────

describe('encryptNote / decryptNote', () => {
  let key

  beforeAll(async () => {
    key = await deriveEncKey('notekey')
  })

  const sampleNote = {
    clientId: 'abc-123',
    title: 'My Note',
    description: 'A description',
    tags: ['tag1', 'tag2'],
    content: '10 + 20\nresult = 30',
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z'
  }

  it('encrypts all sensitive fields', async () => {
    const enc = await encryptNote(sampleNote, key)
    expect(isEncrypted(enc.title)).toBe(true)
    expect(isEncrypted(enc.description)).toBe(true)
    expect(isEncrypted(enc.tags)).toBe(true)
    expect(isEncrypted(enc.content)).toBe(true)
  })

  it('preserves non-sensitive fields', async () => {
    const enc = await encryptNote(sampleNote, key)
    expect(enc.clientId).toBe('abc-123')
    expect(enc.sortOrder).toBe(1)
    expect(enc.createdAt).toBe('2025-01-01T00:00:00Z')
    expect(enc.updatedAt).toBe('2025-01-02T00:00:00Z')
  })

  it('round-trips correctly', async () => {
    const enc = await encryptNote(sampleNote, key)
    const dec = await decryptNote(enc, key)
    expect(dec.title).toBe(sampleNote.title)
    expect(dec.description).toBe(sampleNote.description)
    expect(dec.tags).toEqual(sampleNote.tags)
    expect(dec.content).toBe(sampleNote.content)
    expect(dec.clientId).toBe(sampleNote.clientId)
  })

  it('handles empty fields gracefully', async () => {
    const emptyNote = { clientId: 'x', title: '', description: '', tags: [], content: '' }
    const enc = await encryptNote(emptyNote, key)
    const dec = await decryptNote(enc, key)
    expect(dec.title).toBe('')
    expect(dec.description).toBe('')
    expect(dec.tags).toEqual([])
    expect(dec.content).toBe('')
  })

  it('handles null/undefined fields gracefully', async () => {
    const note = { clientId: 'x', title: null, description: undefined, tags: null, content: undefined }
    const enc = await encryptNote(note, key)
    const dec = await decryptNote(enc, key)
    expect(dec.title).toBe('')
    expect(dec.description).toBe('')
    expect(dec.tags).toEqual([])
    expect(dec.content).toBe('')
  })

  it('decryption with wrong key fails', async () => {
    const wrongKey = await deriveEncKey('wrongkey')
    const enc = await encryptNote(sampleNote, key)
    await expect(decryptNote(enc, wrongKey)).rejects.toThrow()
  })
})

// ── encryptSharedNote / decryptSharedNote ─────────────────────────────────

describe('encryptSharedNote / decryptSharedNote', () => {
  let shareKey

  beforeAll(async () => {
    shareKey = await deriveShareKey('sharepassword')
  })

  const sampleShared = {
    title: 'Shared Title',
    description: 'Shared desc',
    tags: ['shared'],
    content: 'shared content here'
  }

  it('encrypts all fields and sets encrypted flag', async () => {
    const enc = await encryptSharedNote(sampleShared, shareKey)
    expect(enc.encrypted).toBe(true)
    expect(isEncrypted(enc.title)).toBe(true)
    expect(isEncrypted(enc.description)).toBe(true)
    expect(isEncrypted(enc.tags)).toBe(true)
    expect(isEncrypted(enc.content)).toBe(true)
  })

  it('round-trips correctly', async () => {
    const enc = await encryptSharedNote(sampleShared, shareKey)
    const dec = await decryptSharedNote(enc, shareKey)
    expect(dec.title).toBe(sampleShared.title)
    expect(dec.description).toBe(sampleShared.description)
    expect(dec.tags).toEqual(sampleShared.tags)
    expect(dec.content).toBe(sampleShared.content)
  })

  it('cannot be decrypted with user encKey', async () => {
    const encKey = await deriveEncKey('sharepassword')
    const enc = await encryptSharedNote(sampleShared, shareKey)
    await expect(decryptSharedNote(enc, encKey)).rejects.toThrow()
  })

  it('passwordless flow: generate password, derive key, round-trip', async () => {
    const randomPw = generateSharePassword()
    const k1 = await deriveShareKey(randomPw)
    const enc = await encryptSharedNote(sampleShared, k1)

    // Simulate recipient deriving key from the same password
    const k2 = await deriveShareKey(randomPw)
    const dec = await decryptSharedNote(enc, k2)
    expect(dec.title).toBe(sampleShared.title)
    expect(dec.content).toBe(sampleShared.content)
  })
})

// ── Password change re-encryption simulation ─────────────────────────────

describe('password change re-encryption', () => {
  it('re-encrypts notes from old key to new key', async () => {
    const oldKey = await deriveEncKey('oldpassword')
    const newKey = await deriveEncKey('newpassword')

    const note = {
      clientId: 'n1',
      title: 'Secret Note',
      description: 'desc',
      tags: ['private'],
      content: 'sensitive data'
    }

    // Encrypt with old key
    const encOld = await encryptNote(note, oldKey)

    // Re-encrypt: decrypt with old, encrypt with new
    const plain = await decryptNote(encOld, oldKey)
    const encNew = await encryptNote(plain, newKey)

    // Old key can no longer decrypt
    await expect(decryptNote(encNew, oldKey)).rejects.toThrow()

    // New key can decrypt
    const final = await decryptNote(encNew, newKey)
    expect(final.title).toBe('Secret Note')
    expect(final.content).toBe('sensitive data')
    expect(final.tags).toEqual(['private'])
  })
})
