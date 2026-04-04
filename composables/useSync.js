/**
 * Cloud sync composable with end-to-end encryption.
 *
 * Triggers: syncNow() for create/delete/reorder, debouncedSync() for edits,
 * 2-minute interval, and SSE push from other clients.
 * No deep watcher on notes to avoid feedback loops.
 *
 * Encryption flow:
 *   - All note data is encrypted with the user's encKey before being sent
 *     to the server, and decrypted after being received.
 *   - Local IndexedDB storage remains unencrypted.
 *   - If encKey is null (session restored without password), sync is skipped.
 *
 * Migration:
 *   On the first sync after E2E is deployed, the composable detects
 *   unencrypted notes from the server and re-uploads them encrypted.
 *   A progress callback is provided for UI feedback.
 */
import db from '~/db.js'
import { encryptNote, decryptNote, isEncrypted } from '~/utils/crypto.js'

/** Safely parse tags that may be a JSON string, array, or garbage. */
function parseTags(tags) {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try { return JSON.parse(tags) } catch { return [] }
  }
  return []
}

export const useSync = (auth, notes, saveNotes, deletedIds, clearDeletedIds) => {
  const { apiFetch, apiUrl } = useApi()

  const syncing = ref(false)
  const lastSyncedAt = ref(null)
  const syncError = ref(null)

  /** Migration progress: { current, total } or null when not migrating */
  const migrationProgress = ref(null)

  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  let expectingSelfEcho = false
  let echoTimer = null
  let intervalId = null
  let debounceTimer = null
  let pendingSync = null

  const AUTO_SYNC_INTERVAL = 2 * 60 * 1000
  const DEBOUNCE_DELAY = 3000

  onMounted(async () => {
    if (import.meta.client) {
      const row = await db.appState.get('last_synced_at')
      lastSyncedAt.value = row?.value || null
    }
  })

  const sync = async (source = 'unknown') => {
    if (!auth.isLoggedIn.value) return
    // encKey is required for E2E encryption. If the user restored a session
    // without entering their password, we can't encrypt/decrypt.
    if (!auth.encKey.value) return
    if (syncing.value) {
      pendingSync = source
      return
    }

    syncing.value = true
    syncError.value = null

    const shouldBroadcast = source !== 'sse'
    const key = auth.encKey.value

    try {
      // Encrypt client notes before sending
      const encryptedClientNotes = []
      for (const n of notes.value) {
        const plain = {
          clientId: n.id,
          title: n.title,
          description: n.description,
          tags: n.tags || [],
          content: n.content,
          sortOrder: n.sortOrder ?? 0,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt
        }
        const encrypted = await encryptNote(plain, key)
        encryptedClientNotes.push(encrypted)
      }

      const data = await apiFetch('/api/notes/sync', {
        method: 'POST',
        headers: auth.authHeaders.value,
        body: {
          notes: encryptedClientNotes,
          deletedClientIds: [...deletedIds.value],
          lastSyncedAt: lastSyncedAt.value,
          sessionId,
          broadcast: shouldBroadcast
        }
      })

      if (data.deletedClientIds?.length) {
        for (const id of data.deletedClientIds) {
          const idx = notes.value.findIndex(n => n.id === id)
          if (idx !== -1) notes.value.splice(idx, 1)
        }
      }

      // Decrypt pulled notes and detect migration need
      const needsMigration = []

      for (const remote of data.pulled) {
        const localId = remote.clientId || remote.id.toString()

        // Check if this note is encrypted or plaintext (legacy)
        let decrypted
        if (isEncrypted(remote.content)) {
          decrypted = await decryptNote(remote, key)
        } else {
          // Legacy unencrypted note — use as-is but mark for migration
          decrypted = remote
          // Tags from TEXT column may be a JSON string — parse it
          decrypted.tags = parseTags(remote.tags)
          needsMigration.push({ ...remote, clientId: localId })
        }

        const existing = notes.value.find(n => n.id === localId)
        if (existing) {
          if (new Date(decrypted.updatedAt) > new Date(existing.updatedAt)) {
            if (existing.title !== decrypted.title) existing.title = decrypted.title
            if (existing.description !== decrypted.description) existing.description = decrypted.description
            if (JSON.stringify(existing.tags) !== JSON.stringify(decrypted.tags)) existing.tags = decrypted.tags
            if (existing.content !== decrypted.content) existing.content = decrypted.content
            existing.updatedAt = decrypted.updatedAt
          }
          existing.sortOrder = decrypted.sortOrder ?? existing.sortOrder
        } else {
          notes.value.push({
            id: localId,
            title: decrypted.title,
            description: decrypted.description,
            tags: decrypted.tags || [],
            content: decrypted.content,
            sortOrder: decrypted.sortOrder ?? 0,
            createdAt: decrypted.createdAt,
            updatedAt: decrypted.updatedAt
          })
        }
      }

      notes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

      await clearDeletedIds()
      lastSyncedAt.value = data.syncedAt
      await db.appState.put({ key: 'last_synced_at', value: data.syncedAt })
      await saveNotes()

      if (shouldBroadcast) {
        expectingSelfEcho = true
        clearTimeout(echoTimer)
        echoTimer = setTimeout(() => { expectingSelfEcho = false }, 500)
      }

      // ── One-time migration of legacy unencrypted notes ──
      if (needsMigration.length > 0) {
        await migrateUnencryptedNotes(needsMigration, key)
      }
    } catch (err) {
      syncError.value = err.data?.statusMessage || err.message || 'Sync failed'
    } finally {
      syncing.value = false
      if (pendingSync) {
        const queued = pendingSync
        pendingSync = null
        sync(queued)
      }
    }
  }

  /**
   * Migrate legacy unencrypted notes by encrypting them and re-uploading.
   * Shows progress via migrationProgress ref.
   */
  const migrateUnencryptedNotes = async (legacyNotes, key) => {
    migrationProgress.value = { current: 0, total: legacyNotes.length }
    try {
      const encrypted = []
      for (let i = 0; i < legacyNotes.length; i++) {
        const note = legacyNotes[i]
        // Ensure tags is a proper value before encrypting
        const plain = {
          ...note,
          tags: parseTags(note.tags)
        }
        encrypted.push(await encryptNote(plain, key))
        migrationProgress.value = { current: i + 1, total: legacyNotes.length }
      }

      // Push the encrypted versions back to the server
      await apiFetch('/api/notes/sync', {
        method: 'POST',
        headers: auth.authHeaders.value,
        body: {
          notes: encrypted,
          deletedClientIds: [],
          lastSyncedAt: lastSyncedAt.value,
          sessionId,
          broadcast: true
        }
      })
    } finally {
      migrationProgress.value = null
    }
  }

  const syncNow = () => {
    clearTimeout(debounceTimer)
    if (!auth.isLoggedIn.value || !auth.encKey.value) {
      pendingSync = 'syncNow'
      return
    }
    sync('syncNow')
  }

  const debouncedSync = () => {
    if (!auth.isLoggedIn.value || !auth.encKey.value) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => sync('debounce'), DEBOUNCE_DELAY)
  }

  const startAutoSync = () => {
    stopAutoSync()
    if (pendingSync) {
      const queued = pendingSync
      pendingSync = null
      sync(queued)
    } else {
      sync('login')
    }
    intervalId = setInterval(() => sync('interval'), AUTO_SYNC_INTERVAL)
  }

  const stopAutoSync = () => {
    clearInterval(intervalId)
    clearTimeout(debounceTimer)
    intervalId = null
  }

  // SSE — real-time notifications from other clients
  let eventSource = null

  const connectSSE = () => {
    disconnectSSE()
    if (!auth.token.value) return

    eventSource = new EventSource(
      apiUrl(`/api/sync/events?token=${auth.token.value}&sessionId=${sessionId}`)
    )

    eventSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'sync' && !syncing.value && !expectingSelfEcho) {
          sync('sse')
        }
      } catch { /* ignore */ }
    }

    eventSource.onerror = () => {
      disconnectSSE()
      setTimeout(() => {
        if (auth.isLoggedIn.value) connectSSE()
      }, 5000)
    }
  }

  const disconnectSSE = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  // Start sync when both logged in AND encKey is available
  watch(
    [() => auth.isLoggedIn.value, () => auth.encKey.value],
    ([loggedIn, key]) => {
      if (loggedIn && key) {
        startAutoSync()
        connectSSE()
      } else if (!loggedIn) {
        stopAutoSync()
        disconnectSSE()
      }
    },
    { immediate: true }
  )

  const onBeforeUnload = () => disconnectSSE()

  if (import.meta.client) {
    window.addEventListener('beforeunload', onBeforeUnload)
  }

  onBeforeUnmount(() => {
    stopAutoSync()
    disconnectSSE()
    if (import.meta.client) {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  })

  return { syncing, lastSyncedAt, syncError, migrationProgress, sync, syncNow, debouncedSync }
}
