/**
 * File menu action handlers for notes (backup, import, duplicate, copy, print).
 */
export function useNoteActions({
  notes,
  groups,
  currentNote,
  selectedNoteIds: _selectedNoteIds,
  createNote,
  updateNoteMeta,
  updateNoteContent,
  evaluateLines,
  fileActions,
}) {
  const {
    exportNoteAsText,
    exportNoteAsJson,
    exportNoteAsMarkdown,
    exportNoteAsPdf,
    downloadFile,
    downloadBlob,
    openFile,
    duplicateNote,
    copyToClipboard,
    printNote,
  } = fileActions

  const showExportOptions = ref(false)
  const pendingExportAction = ref(null)

  const askExportOptions = (action) => {
    pendingExportAction.value = action
    showExportOptions.value = true
  }

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
      case 'print':
        printNote(note, calc)
        break
    }
    pendingExportAction.value = null
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

    if (encrypt && password) {
      const { BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js')
      const blobWriter = new BlobWriter('application/zip')
      const zipWriter = new ZipWriter(blobWriter, { password })
      await zipWriter.add('backup.json', new TextReader(jsonStr))
      const blob = await zipWriter.close()
      await downloadBlob(`numori-backup-${dateStr}.zip`, blob)
    } else {
      await downloadFile(`numori-backup-${dateStr}.json`, jsonStr, 'application/json')
    }
  }

  // Restore state
  const showRestorePassword = ref(false)
  const restorePasswordError = ref('')
  let _restoreFile = null
  let _restoreResolve = null

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

      // Restore notes
      const notesToRestore = parsed.notes || (Array.isArray(parsed) ? parsed : [parsed])
      for (const noteData of notesToRestore) {
        const newNote = createNote()
        updateNoteMeta(newNote.id, {
          title: noteData.title || 'Imported Note',
          description: noteData.description || '',
          tags: noteData.tags || [],
        })
        updateNoteContent(newNote.id, noteData.content || '')
        // Preserve archived/deleted state if present
        const note = notes.value.find((n) => n.id === newNote.id)
        if (note) {
          if (noteData.archived) note.archived = true
          if (noteData.deletedAt) note.deletedAt = noteData.deletedAt
          if (noteData.groupId && parsed.groups) note.groupId = noteData.groupId
        }
      }

      // Restore groups if present
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
          }
        }
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

  const handlePrint = () => askExportOptions('print')

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
    exportNoteAsJson(note)
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
    printNote(note)
  }

  return {
    showExportOptions,
    handleExportConfirm,
    showRestorePassword,
    restorePasswordError,
    handleRestorePasswordConfirm,
    handleRestorePasswordClose,
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
