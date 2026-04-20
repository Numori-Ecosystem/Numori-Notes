/**
 * File menu action handlers for notes (backup, import, duplicate, copy, print).
 */
import { Capacitor } from '@capacitor/core'

export function useNoteActions({
  notes,
  groups,
  currentNote,
  selectedNoteIds: _selectedNoteIds,
  createNote,
  updateNoteMeta,
  updateNoteContent,
  softDeleteNote,
  archiveNote,
  evaluateLines,
  fileActions,
  toast,
}) {
  const {
    exportNoteAsText,
    exportNoteAsMarkdown,
    exportNoteAsPdf,
    exportNoteAsRtf,
    exportNoteAsOdt,
    exportNoteAsDocx,
    exportNoteAsHtml,
    exportNoteAsLatex,
    exportNoteAsCsv,
    downloadFile,
    downloadBlob,
    shareFile,
    shareBlob,
    openFile,
    duplicateNote,
    copyToClipboard,
    printNote,
  } = fileActions

  const isNative = Capacitor.isNativePlatform()

  const showExportOptions = ref(false)
  const pendingExportAction = ref(null)

  const handleExportConfirm = (withResults) => {
    showExportOptions.value = false
    const calc = withResults ? evaluateLines : null
    const note = currentNote.value
    switch (pendingExportAction.value) {
      case 'text':
        exportNoteAsText(note, calc)
        break
      case 'markdown':
        exportNoteAsMarkdown(note, calc)
        break
      case 'pdf':
        exportNoteAsPdf(note, calc)
        break
    }
    pendingExportAction.value = null
  }

  // ── Print modal ────────────────────────────────────────
  const showPrintModal = ref(false)
  const pendingPrintNote = ref(null)

  const handlePrintConfirm = async ({ withResults, blackAndWhite }) => {
    showPrintModal.value = false
    const note = pendingPrintNote.value || currentNote.value
    pendingPrintNote.value = null
    if (!note) return
    const calc = withResults ? evaluateLines : null
    try {
      await printNote(note, calc, blackAndWhite)
      if (toast && isNative) {
        toast.show('Opened share sheet for printing', { type: 'success', icon: 'mdi:printer' })
      }
    } catch (err) {
      if (toast) {
        toast.show(err.message || 'Failed to print', { type: 'error', icon: 'mdi:alert-circle' })
      }
    }
  }

  const handleOpenFile = async () => {
    try {
      const data = await openFile()
      const newNote = createNote()
      updateNoteMeta(newNote.id, {
        title: data.title,
        description: data.description,
        tags: data.tags,
      })
      updateNoteContent(newNote.id, data.content)
    } catch {
      // User cancelled or file read failed
    }
  }

  const handleDuplicate = () => {
    if (!currentNote.value) return
    const data = duplicateNote(currentNote.value)
    if (data) {
      const newNote = createNote()
      updateNoteMeta(newNote.id, {
        title: data.title,
        description: data.description,
        tags: data.tags,
      })
      updateNoteContent(newNote.id, data.content)
    }
  }

  const handleBackup = async ({
    scope,
    includeGroups,
    includeArchive,
    includeBin,
    encrypt,
    password,
    destination,
  }) => {
    let backupNotes = []

    if (scope === 'current') {
      if (currentNote.value) backupNotes.push(currentNote.value)
    } else {
      backupNotes = notes.value.filter((n) => !n.archived && !n.deletedAt)
    }

    if (includeArchive) {
      const archived = notes.value.filter((n) => n.archived && !n.deletedAt)
      backupNotes = [...backupNotes, ...archived]
    }

    if (includeBin) {
      const binned = notes.value.filter((n) => !!n.deletedAt)
      backupNotes = [...backupNotes, ...binned]
    }

    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      notes: backupNotes.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description || '',
        tags: n.tags || [],
        content: n.content || '',
        groupId: n.groupId || null,
        archived: n.archived || false,
        deletedAt: n.deletedAt || null,
        sortOrder: n.sortOrder ?? 0,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      ...(includeGroups && {
        groups: (groups?.value || []).map((g) => ({
          id: g.id,
          name: g.name,
          internalName: g.internalName || '',
          sortOrder: g.sortOrder ?? 0,
          collapsed: g.collapsed || false,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        })),
      }),
    }

    const jsonStr = JSON.stringify(payload, null, 2)
    const dateStr = new Date().toISOString().slice(0, 10)

    try {
      const saveFn = destination === 'share' ? shareFile : downloadFile
      const saveBlobFn = destination === 'share' ? shareBlob : downloadBlob

      if (encrypt && password) {
        const { BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js')
        const blobWriter = new BlobWriter('application/zip')
        const zipWriter = new ZipWriter(blobWriter, { password })
        await zipWriter.add('backup.json', new TextReader(jsonStr))
        const blob = await zipWriter.close()
        await saveBlobFn(`numori-backup-${dateStr}.zip`, blob)
      } else {
        await saveFn(`numori-backup-${dateStr}.json`, jsonStr, 'application/json')
      }

      if (toast) {
        const msg = destination === 'share' ? 'Back-up shared' : 'Back-up saved to Documents/Numori'
        toast.show(msg, { type: 'success', icon: 'mdi:check-circle' })
      }
    } catch (err) {
      if (toast) {
        toast.show(err.message || 'Failed to save back-up', {
          type: 'error',
          icon: 'mdi:alert-circle',
        })
      }
    }
  }

  // Restore state
  const showRestorePassword = ref(false)
  const restorePasswordError = ref('')
  const showRestoreConfirm = ref(false)
  const restoreDuplicateCount = ref(0)
  let _restoreResolve = null
  let _restoreConfirmResolve = null

  const requestRestorePassword = () => {
    return new Promise((resolve) => {
      _restoreResolve = resolve
      restorePasswordError.value = ''
      showRestorePassword.value = true
    })
  }

  const handleRestorePasswordConfirm = (password) => {
    showRestorePassword.value = false
    if (_restoreResolve) _restoreResolve(password)
    _restoreResolve = null
  }

  const handleRestorePasswordClose = () => {
    showRestorePassword.value = false
    if (_restoreResolve) _restoreResolve(null)
    _restoreResolve = null
  }

  const requestRestoreConfirm = (count) => {
    return new Promise((resolve) => {
      _restoreConfirmResolve = resolve
      restoreDuplicateCount.value = count
      showRestoreConfirm.value = true
    })
  }

  const handleRestoreConfirmOverwrite = () => {
    showRestoreConfirm.value = false
    if (_restoreConfirmResolve) _restoreConfirmResolve('overwrite')
    _restoreConfirmResolve = null
  }

  const handleRestoreConfirmSkip = () => {
    showRestoreConfirm.value = false
    if (_restoreConfirmResolve) _restoreConfirmResolve('skip')
    _restoreConfirmResolve = null
  }

  const handleRestoreConfirmClose = () => {
    showRestoreConfirm.value = false
    if (_restoreConfirmResolve) _restoreConfirmResolve('cancel')
    _restoreConfirmResolve = null
  }

  // Simple hash of note content for duplicate detection
  const hashNote = (title, content) => {
    const str = `${title || ''}::${content || ''}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  const handleImport = async () => {
    try {
      // Pick raw File object to support both JSON text and binary zip
      const file = await new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,.zip'
        input.onchange = (e) => {
          const f = e.target.files?.[0]
          if (f) resolve(f)
          else reject(new Error('No file'))
        }
        input.oncancel = () => reject(new Error('Cancelled'))
        input.click()
      })

      let parsed

      if (file.name.endsWith('.zip')) {
        // Encrypted backup — show password modal
        const password = await requestRestorePassword()
        if (!password) return

        try {
          const { BlobReader, TextWriter, ZipReader } = await import('@zip.js/zip.js')
          const reader = new ZipReader(new BlobReader(file), { password })
          const entries = await reader.getEntries()
          const entry = entries.find((e) => e.filename === 'backup.json')
          if (!entry) {
            await reader.close()
            throw new Error('Invalid backup archive')
          }
          const jsonText = await entry.getData(new TextWriter())
          await reader.close()
          parsed = JSON.parse(jsonText)
        } catch {
          restorePasswordError.value = 'Incorrect password or invalid archive'
          showRestorePassword.value = true
          return
        }
      } else {
        const text = await file.text()
        parsed = JSON.parse(text)
      }

      // Prepare notes to restore
      const notesToRestore = parsed.notes || (Array.isArray(parsed) ? parsed : [parsed])

      // Build hash set of existing notes for duplicate detection
      const existingHashes = new Map()
      for (const n of notes.value) {
        const h = hashNote(n.title, n.content)
        existingHashes.set(h, n)
      }

      // Find duplicates
      const duplicates = []
      const unique = []
      for (const noteData of notesToRestore) {
        const h = hashNote(noteData.title, noteData.content)
        if (existingHashes.has(h)) {
          duplicates.push({ noteData, existingNote: existingHashes.get(h) })
        } else {
          unique.push(noteData)
        }
      }

      // If duplicates found, ask user what to do
      let action = 'overwrite'
      if (duplicates.length > 0) {
        action = await requestRestoreConfirm(duplicates.length)
        if (action === 'cancel') return
      }

      // Restore unique notes (reversed so createNote's unshift preserves original order)
      let restored = 0
      let overwritten = 0
      let skipped = duplicates.length
      const restoredNoteIds = [] // track ids + original sortOrder

      for (const noteData of [...unique].reverse()) {
        const newNote = createNote()
        updateNoteMeta(newNote.id, {
          title: noteData.title || 'Imported Note',
          description: noteData.description || '',
          tags: noteData.tags || [],
        })
        updateNoteContent(newNote.id, noteData.content || '')
        const note = notes.value.find((n) => n.id === newNote.id)
        if (note) {
          if (noteData.groupId) note.groupId = noteData.groupId
        }
        restoredNoteIds.push({ id: newNote.id, sortOrder: noteData.sortOrder ?? 0 })
        if (noteData.deletedAt) {
          softDeleteNote(newNote.id)
        } else if (noteData.archived) {
          archiveNote(newNote.id)
        }
        restored++
      }

      // Handle duplicates based on user choice
      if (action === 'overwrite') {
        skipped = 0
        for (const { noteData, existingNote } of duplicates) {
          updateNoteMeta(existingNote.id, {
            title: noteData.title || existingNote.title,
            description: noteData.description ?? existingNote.description,
            tags: noteData.tags || existingNote.tags,
          })
          updateNoteContent(existingNote.id, noteData.content ?? existingNote.content)
          existingNote.archived = noteData.archived || false
          existingNote.deletedAt = noteData.deletedAt || null
          if (noteData.groupId) existingNote.groupId = noteData.groupId
          overwritten++
        }
      }

      // Restore groups if present
      let groupsRestored = 0
      if (parsed.groups && Array.isArray(parsed.groups) && groups) {
        for (const groupData of parsed.groups) {
          const exists = groups.value.find((g) => g.id === groupData.id)
          if (!exists) {
            groups.value.push({
              id: groupData.id,
              name: groupData.name,
              internalName: groupData.internalName || '',
              sortOrder: groupData.sortOrder ?? 0,
              collapsed: groupData.collapsed || false,
              createdAt: groupData.createdAt || new Date().toISOString(),
              updatedAt: groupData.updatedAt || new Date().toISOString(),
            })
            groupsRestored++
          }
        }
      }

      // Reassign sortOrder from backup to restored notes
      for (const { id, sortOrder } of restoredNoteIds) {
        const note = notes.value.find((n) => n.id === id)
        if (note) note.sortOrder = sortOrder
      }

      // Re-sort notes by sortOrder to restore original ordering
      notes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

      // Show result toast
      if (toast) {
        const parts = []
        if (restored > 0) parts.push(`${restored} restored`)
        if (overwritten > 0) parts.push(`${overwritten} overwritten`)
        if (skipped > 0) parts.push(`${skipped} skipped`)
        if (groupsRestored > 0)
          parts.push(`${groupsRestored} group${groupsRestored > 1 ? 's' : ''} restored`)
        const message = parts.length > 0 ? parts.join(', ') : 'Nothing to restore'
        toast.show(message, {
          type: restored > 0 || overwritten > 0 ? 'success' : 'info',
          icon: 'mdi:backup-restore',
        })
      }
    } catch {
      // User cancelled or file read/parse failed
    }
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(currentNote.value)
    } catch {
      // Clipboard API not available
    }
  }

  const handlePrint = () => {
    pendingPrintNote.value = null
    showPrintModal.value = true
  }

  // Per-note action handlers (receive note ID)
  const findNote = (id) => notes.value.find((n) => n.id === id)

  const handleDuplicateById = (id) => {
    const note = findNote(id)
    if (!note) return
    const data = duplicateNote(note)
    if (data) {
      const newNote = createNote()
      updateNoteMeta(newNote.id, {
        title: data.title,
        description: data.description,
        tags: data.tags,
      })
      updateNoteContent(newNote.id, data.content)
    }
  }

  const handleExportById = (id) => {
    const note = findNote(id)
    if (!note) return
    pendingSaveNote.value = note
    showSaveModal.value = true
  }

  // ── Save (multi-format) ────────────────────────────────

  const showSaveModal = ref(false)
  const pendingSaveNote = ref(null)

  const handleSave = async ({ format, withResults, blackAndWhite, destination }) => {
    showSaveModal.value = false
    const note = pendingSaveNote.value || currentNote.value
    if (!note) return
    const calc = withResults ? evaluateLines : null
    const bw = blackAndWhite || false
    const dest = destination || 'download'

    try {
      switch (format) {
        case 'num':
          await exportNoteAsText(note, calc, '.num', dest)
          break
        case 'txt':
          await exportNoteAsText(note, calc, '.txt', dest)
          break
        case 'md':
          await exportNoteAsMarkdown(note, calc, dest)
          break
        case 'pdf':
          await exportNoteAsPdf(note, calc, bw, dest)
          break
        case 'rtf':
          await exportNoteAsRtf(note, calc, bw, dest)
          break
        case 'odt':
          await exportNoteAsOdt(note, calc, bw, dest)
          break
        case 'docx':
          await exportNoteAsDocx(note, calc, bw, dest)
          break
        case 'html':
          await exportNoteAsHtml(note, calc, bw, dest)
          break
        case 'tex':
          await exportNoteAsLatex(note, calc, dest)
          break
        case 'csv':
          await exportNoteAsCsv(note, calc, dest)
          break
      }

      if (toast) {
        const msg =
          dest === 'share'
            ? 'Note shared'
            : dest === 'device'
              ? 'Saved to Documents/Numori'
              : 'Note downloaded'
        toast.show(msg, { type: 'success', icon: 'mdi:check-circle' })
      }
    } catch (err) {
      if (toast) {
        toast.show(err.message || 'Failed to save', { type: 'error', icon: 'mdi:alert-circle' })
      }
    }

    pendingSaveNote.value = null
  }

  const handleSaveById = (id) => {
    const note = findNote(id)
    if (!note) return
    pendingSaveNote.value = note
    showSaveModal.value = true
  }

  const handleCopyById = async (id) => {
    const note = findNote(id)
    if (!note) return
    try {
      await copyToClipboard(note)
    } catch {
      /* ignore */
    }
  }

  const handlePrintById = (id) => {
    const note = findNote(id)
    if (!note) return
    pendingPrintNote.value = note
    showPrintModal.value = true
  }

  return {
    showExportOptions,
    handleExportConfirm,
    showSaveModal,
    showPrintModal,
    handlePrintConfirm,
    handleSave,
    handleSaveById,
    showRestorePassword,
    restorePasswordError,
    handleRestorePasswordConfirm,
    handleRestorePasswordClose,
    showRestoreConfirm,
    restoreDuplicateCount,
    handleRestoreConfirmOverwrite,
    handleRestoreConfirmSkip,
    handleRestoreConfirmClose,
    handleOpenFile,
    handleDuplicate,
    handleBackup,
    handleImport,
    handleCopy,
    handlePrint,
    handleDuplicateById,
    handleExportById,
    handleCopyById,
    handlePrintById,
  }
}
