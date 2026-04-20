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
    openFile,
    importNotes,
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
      notes: backupNotes,
      ...(includeGroups && { groups: JSON.parse(JSON.stringify(groups?.value || [])) }),
    }

    const dateStr = new Date().toISOString().slice(0, 10)

    if (encrypt && password) {
      const { BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js')
      const blobWriter = new BlobWriter('application/zip')
      const zipWriter = new ZipWriter(blobWriter, { password })
      await zipWriter.add('backup.json', new TextReader(JSON.stringify(payload, null, 2)))
      const blob = await zipWriter.close()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `numori-backup-${dateStr}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `numori-backup-${dateStr}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = async () => {
    try {
      const result = await importNotes()
      for (const noteData of result.notes) {
        const newNote = createNote()
        updateNoteMeta(newNote.id, {
          title: noteData.title,
          description: noteData.description,
          tags: noteData.tags,
        })
        updateNoteContent(newNote.id, noteData.content)
      }
    } catch {
      // User cancelled or file read failed
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
