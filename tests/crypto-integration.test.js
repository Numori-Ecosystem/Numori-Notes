/**
 * Integration tests for the full E2E encryption flow.
 *
 * Simulates the complete lifecycle:
 *   1. User registers → derives authKey + encKey
 *   2. Notes are encrypted before sync, decrypted after pull
 *   3. Shared notes use independent share keys
 *   4. Password change re-encrypts all notes
 *   5. Legacy migration detects and encrypts plaintext notes
 */
import { describe, it, expect } from 'vitest'
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

describe('full E2E encryption lifecycle', () => {
  const password = 'MySecureP@ssw0rd!'

  it('registration: derives independent authKey and encKey', async () => {
    const authKey = await deriveAuthKey(password)
    const encKey = await deriveEncKey(password)

    // authKey is a hex string suitable for sending to server
    expect(authKey).toMatch(/^[0-9a-f]{64}$/)

    // encKey is a CryptoKey that can encrypt/decrypt
    const ct = await encrypt('test', encKey)
    const pt = await decrypt(ct, encKey)
    expect(pt).toBe('test')
  })

  it('sync push: encrypts notes before sending to server', async () => {
    const encKey = await deriveEncKey(password)

    const localNotes = [
      { clientId: 'n1', title: 'Budget 2025', description: 'Monthly budget', tags: ['finance'], content: '1000 + 2000\n= 3000', sortOrder: 0 },
      { clientId: 'n2', title: 'Shopping List', description: '', tags: [], content: 'Milk\nBread\nEggs', sortOrder: 1 }
    ]

    const encrypted = await Promise.all(localNotes.map(n => encryptNote(n, encKey)))

    // All sensitive fields are encrypted
    for (const enc of encrypted) {
      expect(isEncrypted(enc.title)).toBe(true)
      expect(isEncrypted(enc.content)).toBe(true)
      expect(isEncrypted(enc.tags)).toBe(true)
      // Non-sensitive fields preserved
      expect(enc.sortOrder).toBeDefined()
      expect(enc.clientId).toBeDefined()
    }

    // Server stores opaque ciphertext — cannot read titles
    expect(encrypted[0].title).not.toContain('Budget')
    expect(encrypted[1].content).not.toContain('Milk')
  })

  it('sync pull: decrypts notes received from server', async () => {
    const encKey = await deriveEncKey(password)

    const note = { clientId: 'n1', title: 'Secret', description: 'desc', tags: ['private'], content: 'classified' }
    const encrypted = await encryptNote(note, encKey)

    // Simulate server returning encrypted data
    const fromServer = { ...encrypted, id: 42, updatedAt: '2025-01-01' }
    const decrypted = await decryptNote(fromServer, encKey)

    expect(decrypted.title).toBe('Secret')
    expect(decrypted.description).toBe('desc')
    expect(decrypted.tags).toEqual(['private'])
    expect(decrypted.content).toBe('classified')
    expect(decrypted.id).toBe(42) // non-sensitive field preserved
  })

  it('migration: detects plaintext notes and encrypts them', async () => {
    const encKey = await deriveEncKey(password)

    // Simulate legacy plaintext notes from server
    const legacyNotes = [
      { clientId: 'old1', title: 'Old Note', description: '', tags: '["legacy"]', content: 'plain text' },
      { clientId: 'old2', title: 'Another', description: 'desc', tags: '[]', content: 'also plain' }
    ]

    // Detection: these are NOT encrypted
    for (const note of legacyNotes) {
      expect(isEncrypted(note.content)).toBe(false)
      expect(isEncrypted(note.title)).toBe(false)
    }

    // Migration: encrypt each note
    const migrated = []
    for (const note of legacyNotes) {
      const tags = typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags
      const plain = { ...note, tags }
      migrated.push(await encryptNote(plain, encKey))
    }

    // Verify migration result
    for (const enc of migrated) {
      expect(isEncrypted(enc.title)).toBe(true)
      expect(isEncrypted(enc.content)).toBe(true)
    }

    // Verify round-trip
    const dec = await decryptNote(migrated[0], encKey)
    expect(dec.title).toBe('Old Note')
    expect(dec.tags).toEqual(['legacy'])
  })

  it('password change: re-encrypts all notes from old key to new key', async () => {
    const oldPassword = 'OldP@ss123'
    const newPassword = 'NewP@ss456'

    const oldEncKey = await deriveEncKey(oldPassword)
    const newEncKey = await deriveEncKey(newPassword)

    // Notes encrypted with old key
    const notes = [
      { clientId: 'n1', title: 'Note 1', description: '', tags: ['a'], content: 'content 1' },
      { clientId: 'n2', title: 'Note 2', description: 'desc', tags: [], content: 'content 2' }
    ]
    const encryptedOld = await Promise.all(notes.map(n => encryptNote(n, oldEncKey)))

    // Re-encryption process
    const reEncrypted = []
    for (const enc of encryptedOld) {
      const plain = await decryptNote(enc, oldEncKey)
      reEncrypted.push(await encryptNote(plain, newEncKey))
    }

    // Old key cannot decrypt re-encrypted notes
    for (const enc of reEncrypted) {
      await expect(decryptNote(enc, oldEncKey)).rejects.toThrow()
    }

    // New key can decrypt
    const dec1 = await decryptNote(reEncrypted[0], newEncKey)
    const dec2 = await decryptNote(reEncrypted[1], newEncKey)
    expect(dec1.title).toBe('Note 1')
    expect(dec2.title).toBe('Note 2')
    expect(dec2.description).toBe('desc')
  })

  it('shared note: password-protected flow', async () => {
    const sharePassword = 'share-secret-123'

    // Sender encrypts
    const senderKey = await deriveShareKey(sharePassword)
    const noteData = { title: 'Shared Secret', description: '', tags: ['shared'], content: 'confidential data' }
    const encrypted = await encryptSharedNote(noteData, senderKey)

    expect(encrypted.encrypted).toBe(true)
    expect(isEncrypted(encrypted.content)).toBe(true)

    // Recipient derives key from same password (shared out-of-band)
    const recipientKey = await deriveShareKey(sharePassword)
    const decrypted = await decryptSharedNote(encrypted, recipientKey)

    expect(decrypted.title).toBe('Shared Secret')
    expect(decrypted.content).toBe('confidential data')
    expect(decrypted.tags).toEqual(['shared'])
  })

  it('shared note: passwordless flow (random key in URL)', async () => {
    // Sender generates random password
    const randomPassword = generateSharePassword()
    expect(randomPassword.length).toBeGreaterThan(0)

    // Sender encrypts with derived key
    const senderKey = await deriveShareKey(randomPassword)
    const noteData = { title: 'Quick Share', description: '', tags: [], content: 'some content' }
    const encrypted = await encryptSharedNote(noteData, senderKey)

    // The randomPassword would be appended to the URL as ?key=<randomPassword>
    // Recipient extracts it from URL and derives the same key
    const recipientKey = await deriveShareKey(randomPassword)
    const decrypted = await decryptSharedNote(encrypted, recipientKey)

    expect(decrypted.title).toBe('Quick Share')
    expect(decrypted.content).toBe('some content')
  })

  it('shared note: wrong password cannot decrypt', async () => {
    const senderKey = await deriveShareKey('correct-password')
    const encrypted = await encryptSharedNote(
      { title: 'Secret', description: '', tags: [], content: 'data' },
      senderKey
    )

    const wrongKey = await deriveShareKey('wrong-password')
    await expect(decryptSharedNote(encrypted, wrongKey)).rejects.toThrow()
  })

  it('share key is independent from personal encKey', async () => {
    // Even with the same password string, share key and enc key are different
    const samePassword = 'same-password'
    const encKey = await deriveEncKey(samePassword)
    const shareKey = await deriveShareKey(samePassword)

    const note = { title: 'Test', description: '', tags: [], content: 'data' }

    // Encrypt with encKey
    const encWithPersonal = await encryptNote(note, encKey)
    // Cannot decrypt with shareKey
    await expect(decryptNote(encWithPersonal, shareKey)).rejects.toThrow()

    // Encrypt with shareKey
    const encWithShare = await encryptSharedNote(note, shareKey)
    // Cannot decrypt with encKey
    await expect(decryptSharedNote(encWithShare, encKey)).rejects.toThrow()
  })

  it('multiple encryptions of same data produce different ciphertexts', async () => {
    const encKey = await deriveEncKey(password)
    const note = { clientId: 'n1', title: 'Same', description: '', tags: [], content: 'same' }

    const enc1 = await encryptNote(note, encKey)
    const enc2 = await encryptNote(note, encKey)

    // Different ciphertexts (random IVs)
    expect(enc1.title).not.toBe(enc2.title)
    expect(enc1.content).not.toBe(enc2.content)

    // But both decrypt to the same plaintext
    const dec1 = await decryptNote(enc1, encKey)
    const dec2 = await decryptNote(enc2, encKey)
    expect(dec1.title).toBe(dec2.title)
    expect(dec1.content).toBe(dec2.content)
  })
})
