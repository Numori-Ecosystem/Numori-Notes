import db from '~/db.js'

/**
 * Manages shared note state and share/unshare actions.
 */
export function useShareManagement({ auth, notes, apiFetch }) {
  const sharedNoteIds = ref([])
  const sharedNotesMap = ref(new Map())
  const analyticsNotesMap = ref(new Map())

  const showShareModal = ref(false)
  const showAnalyticsModal = ref(false)
  const analyticsHash = ref(null)

  const loadSharedNotes = async () => {
    if (!auth.isLoggedIn.value) {
      sharedNoteIds.value = []
      sharedNotesMap.value = new Map()
      analyticsNotesMap.value = new Map()
      return
    }
    try {
      const shared = await apiFetch('/api/share/my', { headers: auth.authHeaders.value })
      const map = new Map()
      const analyticsMap = new Map()
      const ids = []
      for (const sn of shared) {
        const match = sn.sourceClientId
          ? notes.value.find((n) => n.id === sn.sourceClientId)
          : notes.value.find((n) => n.title === sn.title)
        if (match) {
          if (sn.isActive) {
            ids.push(match.id)
            map.set(match.id, sn.hash)
          }
          if (sn.collectAnalytics) {
            analyticsMap.set(match.id, sn.hash)
          }
        }
      }
      sharedNoteIds.value = ids
      sharedNotesMap.value = map
      analyticsNotesMap.value = analyticsMap
    } catch {
      sharedNoteIds.value = []
      sharedNotesMap.value = new Map()
      analyticsNotesMap.value = new Map()
    }
  }

  const handleShareNote = (noteId, currentNoteId) => {
    currentNoteId.value = noteId
    showShareModal.value = true
  }

  const handleUnshareNote = async (noteId) => {
    const hash = sharedNotesMap.value.get(noteId)
    if (!hash) return
    try {
      const headers = { ...auth.authHeaders.value }

      // If not logged in, use the stored delete token
      if (!auth.isLoggedIn.value) {
        try {
          const record = await db.shareTokens.get(hash)
          if (record?.token) {
            headers['x-delete-token'] = record.token
          }
        } catch {
          /* db unavailable */
        }
      }

      await apiFetch(`/api/share/${hash}`, {
        method: 'DELETE',
        headers,
      })

      // Clean up stored delete token
      try {
        await db.shareTokens.delete(hash)
      } catch {
        /* db unavailable */
      }

      await loadSharedNotes()
    } catch {
      /* ignore */
    }
  }

  const handleShareModalClose = () => {
    showShareModal.value = false
    if (auth.isLoggedIn.value) loadSharedNotes()
  }

  const handleShareModalUnshare = () => {
    showShareModal.value = false
    if (auth.isLoggedIn.value) loadSharedNotes()
  }

  const handleOpenAnalytics = (hash) => {
    analyticsHash.value = hash
    showAnalyticsModal.value = true
  }

  const handleProfileUnshare = () => {
    loadSharedNotes()
  }

  return {
    sharedNoteIds,
    sharedNotesMap,
    analyticsNotesMap,
    showShareModal,
    showAnalyticsModal,
    analyticsHash,
    loadSharedNotes,
    handleShareNote,
    handleUnshareNote,
    handleShareModalClose,
    handleShareModalUnshare,
    handleOpenAnalytics,
    handleProfileUnshare,
  }
}
