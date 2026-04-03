/**
 * Composable for cloud sync.
 *
 * Sync triggers:
 * - syncNow() — create, delete, reorder (immediate)
 * - debouncedSync() — content/meta edits (3s debounce)
 * - interval — every 2 minutes
 * - SSE — when another client syncs
 *
 * No deep watcher on notes — avoids feedback loops.
 */
export const useSync = (auth, notes, saveNotes, deletedIds, clearDeletedIds) => {
  const { apiFetch, apiUrl } = useApi()

  const syncing = ref(false)
  const lastSyncedAt = ref(null)
  const syncError = ref(null)

  // Flag to ignore SSE messages triggered by our own sync
  let expectingSelfEcho = false
  let echoTimer = null

  let intervalId = null
  let debounceTimer = null
  const AUTO_SYNC_INTERVAL = 2 * 60 * 1000
  const DEBOUNCE_DELAY = 3000

  onMounted(() => {
    if (import.meta.client) {
      lastSyncedAt.value = localStorage.getItem('last_synced_at') || null
    }
  })

  const sync = async (source = 'unknown') => {
    if (!auth.isLoggedIn.value || syncing.value) {
      console.debug(`[sync] skipped (loggedIn=${auth.isLoggedIn.value}, syncing=${syncing.value}, source=${source})`)
      return
    }

    console.debug(`[sync] starting (source=${source})`)
    syncing.value = true
    syncError.value = null

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
          sessionId: null
        }
      })

      // Remove notes that were deleted on another device
      if (data.deletedClientIds?.length) {
        for (const id of data.deletedClientIds) {
          const idx = notes.value.findIndex(n => n.id === id)
          if (idx !== -1) notes.value.splice(idx, 1)
        }
      }

      // Merge pulled notes into local state
      for (const remote of data.pulled) {
        const localId = remote.clientId || remote.id.toString()
        const existing = notes.value.find(n => n.id === localId)
        if (existing) {
          if (new Date(remote.updatedAt) > new Date(existing.updatedAt)) {
            existing.title = remote.title
            existing.description = remote.description
            existing.tags = remote.tags
            existing.content = remote.content
            existing.sortOrder = remote.sortOrder ?? existing.sortOrder
            existing.updatedAt = remote.updatedAt
          }
        } else {
          notes.value.push({
            id: localId,
            title: remote.title,
            description: remote.description,
            tags: remote.tags || [],
            content: remote.content,
            sortOrder: remote.sortOrder ?? notes.value.length,
            createdAt: remote.createdAt,
            updatedAt: remote.updatedAt
          })
        }
      }

      notes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

      clearDeletedIds()
      lastSyncedAt.value = data.syncedAt
      localStorage.setItem('last_synced_at', data.syncedAt)
      saveNotes()

      console.debug(`[sync] done (pulled=${data.pulled.length}, deleted=${data.deletedClientIds?.length || 0})`)

      // Expect our own SSE echo within 500ms — ignore it
      expectingSelfEcho = true
      clearTimeout(echoTimer)
      echoTimer = setTimeout(() => { expectingSelfEcho = false }, 500)
    } catch (err) {
      syncError.value = err.data?.statusMessage || err.message || 'Sync failed'
      console.debug(`[sync] error: ${syncError.value}`)
    } finally {
      syncing.value = false
    }
  }

  const syncNow = () => {
    clearTimeout(debounceTimer)
    sync('syncNow')
  }

  const debouncedSync = () => {
    if (!auth.isLoggedIn.value) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => sync('debounce'), DEBOUNCE_DELAY)
  }

  const startAutoSync = () => {
    stopAutoSync()
    sync('login')
    intervalId = setInterval(() => sync('interval'), AUTO_SYNC_INTERVAL)
  }

  const stopAutoSync = () => {
    clearInterval(intervalId)
    clearTimeout(debounceTimer)
    intervalId = null
  }

  // SSE
  let eventSource = null

  const connectSSE = () => {
    disconnectSSE()
    if (!auth.token.value) return

    const url = apiUrl(`/api/sync/events?token=${auth.token.value}&sessionId=x`)
    console.debug(`[sync] SSE connecting`)
    eventSource = new EventSource(url)

    eventSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'sync') {
          if (syncing.value || expectingSelfEcho) {
            console.debug(`[sync] SSE ignored (syncing=${syncing.value}, selfEcho=${expectingSelfEcho})`)
            return
          }
          console.debug(`[sync] SSE triggering sync`)
          sync('sse')
        }
      } catch { /* ignore */ }
    }

    eventSource.onerror = () => {
      console.debug('[sync] SSE error, reconnecting in 5s')
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

  onBeforeUnmount(() => {
    stopAutoSync()
    disconnectSSE()
  })

  return { syncing, lastSyncedAt, syncError, sync, syncNow, debouncedSync }
}
