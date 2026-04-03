/**
 * Composable for cloud sync. Pushes local notes to server and pulls remote changes.
 * Supports manual sync, auto-sync on interval, and debounced sync on note changes.
 * Tracks deletions so they propagate across devices.
 */
export const useSync = (auth, notes, saveNotes, deletedIds, clearDeletedIds) => {
  const syncing = ref(false)
  const lastSyncedAt = ref(null)
  const syncError = ref(null)

  let intervalId = null
  let debounceTimer = null
  const AUTO_SYNC_INTERVAL = 2 * 60 * 1000 // 2 minutes
  const DEBOUNCE_DELAY = 5000 // 5 seconds after last change

  onMounted(() => {
    if (process.client) {
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
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      }))

      const data = await $fetch('/api/notes/sync', {
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
            existing.updatedAt = remote.updatedAt
          }
        } else {
          notes.value.push({
            id: localId,
            title: remote.title,
            description: remote.description,
            tags: remote.tags || [],
            content: remote.content,
            createdAt: remote.createdAt,
            updatedAt: remote.updatedAt
          })
        }
      }

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

  watch(() => auth.isLoggedIn.value, (loggedIn) => {
    if (loggedIn) startAutoSync()
    else stopAutoSync()
  }, { immediate: true })

  watch(notes, () => debouncedSync(), { deep: true })

  onBeforeUnmount(() => stopAutoSync())

  return { syncing, lastSyncedAt, syncError, sync }
}
