/**
 * Composable for cloud sync. Pushes local notes to server and pulls remote changes.
 * Supports manual sync, auto-sync on interval, and debounced sync on note changes.
 * Tracks deletions so they propagate across devices.
 */
export const useSync = (auth, notes, saveNotes, deletedIds, clearDeletedIds) => {
  const { apiFetch, apiUrl } = useApi()

  const syncing = ref(false)
  const lastSyncedAt = ref(null)
  const syncError = ref(null)

  let intervalId = null
  let debounceTimer = null
  const AUTO_SYNC_INTERVAL = 2 * 60 * 1000 // 2 minutes
  const DEBOUNCE_DELAY = 3000 // 3 seconds after last change

  onMounted(() => {
    if (import.meta.client) {
      lastSyncedAt.value = localStorage.getItem('last_synced_at') || null
    }
  })

  const sync = async () => {
    if (!auth.isLoggedIn.value || syncing.value) return
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
          lastSyncedAt: lastSyncedAt.value
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

      // Sort by user-defined order
      notes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

      // Deletions synced successfully — clear the queue
      clearDeletedIds()

      lastSyncedAt.value = data.syncedAt
      localStorage.setItem('last_synced_at', data.syncedAt)
      saveNotes()
    } catch (err) {
      syncError.value = err.data?.statusMessage || err.message || 'Sync failed'
    } finally {
      syncing.value = false
    }
  }

  /** Immediate sync — bypasses debounce. For create/delete actions. */
  const syncNow = () => {
    clearTimeout(debounceTimer)
    sync()
  }

  const debouncedSync = () => {
    if (!auth.isLoggedIn.value) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => sync(), DEBOUNCE_DELAY)
  }

  const startAutoSync = () => {
    stopAutoSync()
    sync()
    intervalId = setInterval(() => sync(), AUTO_SYNC_INTERVAL)
  }

  const stopAutoSync = () => {
    clearInterval(intervalId)
    clearTimeout(debounceTimer)
    intervalId = null
  }

  // SSE: listen for sync notifications from other clients
  let eventSource = null

  const connectSSE = () => {
    disconnectSSE()
    if (!auth.token.value) return

    eventSource = new EventSource(apiUrl(`/api/sync/events?token=${auth.token.value}`))

    eventSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'sync') {
          // Another client synced — pull changes
          sync()
        }
      } catch { /* ignore parse errors */ }
    }

    eventSource.onerror = () => {
      // Reconnect after a delay on error
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

  watch(notes, () => debouncedSync(), { deep: true })

  onBeforeUnmount(() => {
    stopAutoSync()
    disconnectSSE()
  })

  return { syncing, lastSyncedAt, syncError, sync, syncNow }
}
