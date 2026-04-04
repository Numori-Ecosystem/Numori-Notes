/**
 * Cloud sync composable.
 *
 * Triggers: syncNow() for create/delete/reorder, debouncedSync() for edits,
 * 2-minute interval, and SSE push from other clients.
 * No deep watcher on notes to avoid feedback loops.
 */
import db from '~/db.js'

export const useSync = (auth, notes, saveNotes, deletedIds, clearDeletedIds) => {
  const { apiFetch, apiUrl } = useApi()

  const syncing = ref(false)
  const lastSyncedAt = ref(null)
  const syncError = ref(null)

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
    if (syncing.value) {
      pendingSync = source
      return
    }

    syncing.value = true
    syncError.value = null

    // SSE-triggered syncs don't broadcast back to avoid ping-pong
    const shouldBroadcast = source !== 'sse'

    try {
      const clientNotes = notes.value.map(n => ({
        clientId: n.id,
        title: n.title,
        description: n.description,
        tags: n.tags || [],
        content: n.content,
        sortOrder: n.sortOrder ?? 0,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      }))

      const data = await apiFetch('/api/notes/sync', {
        method: 'POST',
        headers: auth.authHeaders.value,
        body: {
          notes: clientNotes,
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

      for (const remote of data.pulled) {
        const localId = remote.clientId || remote.id.toString()
        const existing = notes.value.find(n => n.id === localId)
        if (existing) {
          if (new Date(remote.updatedAt) > new Date(existing.updatedAt)) {
            if (existing.title !== remote.title) existing.title = remote.title
            if (existing.description !== remote.description) existing.description = remote.description
            if (JSON.stringify(existing.tags) !== JSON.stringify(remote.tags)) existing.tags = remote.tags
            if (existing.content !== remote.content) existing.content = remote.content
            existing.updatedAt = remote.updatedAt
          }
          existing.sortOrder = remote.sortOrder ?? existing.sortOrder
        } else {
          notes.value.push({
            id: localId,
            title: remote.title,
            description: remote.description,
            tags: remote.tags || [],
            content: remote.content,
            sortOrder: remote.sortOrder ?? 0,
            createdAt: remote.createdAt,
            updatedAt: remote.updatedAt
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

  /** Immediate sync for create/delete/reorder. Queues if auth is still restoring. */
  const syncNow = () => {
    clearTimeout(debounceTimer)
    if (!auth.isLoggedIn.value) {
      pendingSync = 'syncNow'
      return
    }
    sync('syncNow')
  }

  /** Debounced sync for content/meta edits. */
  const debouncedSync = () => {
    if (!auth.isLoggedIn.value) return
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

  watch(() => auth.isLoggedIn.value, (loggedIn) => {
    if (loggedIn) {
      startAutoSync()
      connectSSE()
    } else {
      stopAutoSync()
      disconnectSSE()
    }
  }, { immediate: true })

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

  return { syncing, lastSyncedAt, syncError, sync, syncNow, debouncedSync }
}
