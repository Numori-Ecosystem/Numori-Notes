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
 */
import db from '~/db.js'
import { encryptNote, decryptNote } from '~/utils/crypto.js'

export const useSync = (auth, notes, saveNotes, deletedIds, clearDeletedIds, onDataWipe, onSessionRevoked) => {
  const { apiFetch, apiUrl } = useApi()

  const syncing = ref(false)
  const lastSyncedAt = ref(null)
  const syncError = ref(null)
  const pendingNoteIds = ref(new Set())
  const isOnline = useOnlineStatus()

  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  let expectingSelfEcho = false
  let echoTimer = null
  let intervalId = null
  let debounceTimer = null
  let pendingSync = null

  const AUTO_SYNC_INTERVAL = 2 * 60 * 1000
  const DEBOUNCE_DELAY = 3000
  const SESSION_CHECK_INTERVAL = 30 * 1000 // Check session validity every 30s

  onMounted(async () => {
    if (import.meta.client) {
      const row = await db.appState.get('last_synced_at')
      lastSyncedAt.value = row?.value || null
    }
  })

  // Flush pending changes when connectivity returns
  watch(isOnline, (online) => {
    if (online && auth.isLoggedIn.value) {
      // Validate session immediately when coming back online
      validateSessionOrLogout()
      if (pendingNoteIds.value.size > 0) syncNow()
    }
  })

  const sync = async (source = 'unknown') => {
    if (!auth.isLoggedIn.value || sessionRevokedHandled) return
    // encKey is required for E2E encryption. If the user restored a session
    // without entering their password, we can't encrypt/decrypt.
    if (!auth.encKey.value) return
    // Skip sync when offline — changes stay pending until connection returns
    if (!isOnline.value) {
      pendingSync = source
      return
    }
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
          archived: n.archived ?? false,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt
        }
        const encrypted = await encryptNote(plain, key)
        encryptedClientNotes.push(encrypted)
      }

      // Read local welcome flag to push to server
      const welcomeRow = await db.appState.get('welcome_note_created')
      const localWelcomeCreated = !!welcomeRow?.value

      const data = await apiFetch('/api/notes/sync', {
        method: 'POST',
        headers: auth.authHeaders.value,
        body: {
          notes: encryptedClientNotes,
          deletedClientIds: [...deletedIds.value],
          lastSyncedAt: lastSyncedAt.value,
          sessionId,
          broadcast: shouldBroadcast,
          welcomeCreated: localWelcomeCreated
        }
      })

      if (data.deletedClientIds?.length) {
        for (const id of data.deletedClientIds) {
          const idx = notes.value.findIndex(n => n.id === id)
          if (idx !== -1) notes.value.splice(idx, 1)
        }
        await db.notes.bulkDelete(data.deletedClientIds)
      }

      for (const remote of data.pulled) {
        const localId = remote.clientId || remote.id.toString()
        const decrypted = await decryptNote(remote, key)

        const existing = notes.value.find(n => n.id === localId)
        if (existing) {
          if (new Date(decrypted.updatedAt) > new Date(existing.updatedAt)) {
            if (existing.title !== decrypted.title) existing.title = decrypted.title
            if (existing.description !== decrypted.description) existing.description = decrypted.description
            if (JSON.stringify(existing.tags) !== JSON.stringify(decrypted.tags)) existing.tags = decrypted.tags
            if (existing.content !== decrypted.content) existing.content = decrypted.content
            if (existing.archived !== (decrypted.archived ?? false)) existing.archived = decrypted.archived ?? false
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
            archived: decrypted.archived ?? false,
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

      // All notes are now synced — clear pending indicators
      pendingNoteIds.value = new Set()

      // Persist welcome flag from server so a new device won't re-create it
      if (data.welcomeCreated) {
        await db.appState.put({ key: 'welcome_note_created', value: '1' })
      }

      if (shouldBroadcast) {
        expectingSelfEcho = true
        clearTimeout(echoTimer)
        echoTimer = setTimeout(() => { expectingSelfEcho = false }, 500)
      }
    } catch (err) {
      syncError.value = err.data?.statusMessage || err.message || 'Sync failed'
      // If session was revoked, clear local data and log out
      const status = err.status || err.statusCode || err.data?.statusCode
      if (status === 401) {
        handleSessionRevoked()
        return
      }
    } finally {
      syncing.value = false
      if (pendingSync && !sessionRevokedHandled) {
        const queued = pendingSync
        pendingSync = null
        sync(queued)
      } else {
        pendingSync = null
      }
    }
  }

  const syncNow = (noteId) => {
    if (sessionRevokedHandled) return
    if (noteId) pendingNoteIds.value = new Set([...pendingNoteIds.value, noteId])
    clearTimeout(debounceTimer)
    if (!auth.isLoggedIn.value || !auth.encKey.value) {
      pendingSync = 'syncNow'
      return
    }
    sync('syncNow')
  }

  const debouncedSync = (noteId) => {
    if (sessionRevokedHandled) return
    if (noteId) pendingNoteIds.value = new Set([...pendingNoteIds.value, noteId])
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
  let sessionRevokedHandled = false
  let sseReconnectTimer = null
  let sessionCheckId = null

  /** Lightweight session heartbeat — catches revocations that SSE missed. */
  const startSessionCheck = () => {
    stopSessionCheck()
    sessionCheckId = setInterval(() => {
      if (auth.isLoggedIn.value && isOnline.value && !sessionRevokedHandled) {
        validateSessionOrLogout()
      }
    }, SESSION_CHECK_INTERVAL)
  }

  const stopSessionCheck = () => {
    clearInterval(sessionCheckId)
    sessionCheckId = null
  }

  /** Check if our session is still valid. If not, clear local data and log out. */
  const validateSessionOrLogout = async () => {
    if (sessionRevokedHandled) return
    try {
      await apiFetch('/api/auth/me', { headers: auth.authHeaders.value })
      // Session still valid — ignore
    } catch {
      // Session revoked — clear everything
      handleSessionRevoked()
    }
  }

  const handleSessionRevoked = () => {
    if (sessionRevokedHandled) return
    sessionRevokedHandled = true
    clearTimeout(sseReconnectTimer)
    disconnectSSE()
    stopAutoSync()
    stopSessionCheck()
    if (onSessionRevoked) onSessionRevoked()
  }

  const connectSSE = () => {
    disconnectSSE()
    if (!auth.token.value || sessionRevokedHandled) return

    eventSource = new EventSource(
      apiUrl(`/api/sync/events?token=${auth.token.value}&sessionId=${sessionId}`)
    )

    eventSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'data-wipe') {
          if (onDataWipe) onDataWipe()
        } else if (msg.type === 'session-revoked') {
          // Validate our session is still alive — if not, clear local data
          validateSessionOrLogout()
        } else if (msg.type === 'sync' && !syncing.value && !expectingSelfEcho) {
          sync('sse')
        }
      } catch { /* ignore */ }
    }

    eventSource.onerror = () => {
      disconnectSSE()
      if (sessionRevokedHandled) return
      sseReconnectTimer = setTimeout(() => {
        if (auth.isLoggedIn.value && !sessionRevokedHandled) connectSSE()
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
        // Reset revocation flag — user logged in again with a fresh session
        sessionRevokedHandled = false
        startAutoSync()
        connectSSE()
        startSessionCheck()
      } else if (!loggedIn) {
        stopAutoSync()
        disconnectSSE()
        stopSessionCheck()
        clearTimeout(sseReconnectTimer)
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
    stopSessionCheck()
    clearTimeout(sseReconnectTimer)
    if (import.meta.client) {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  })

  return { syncing, lastSyncedAt, syncError, pendingNoteIds, isOnline, sync, syncNow, debouncedSync }
}
