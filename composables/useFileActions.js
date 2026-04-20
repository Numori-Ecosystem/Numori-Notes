/**
 * Composable for file-related actions: export, import, duplicate, copy, print.
 * Works with the note objects from useNotes.
 * Supports both web (browser APIs) and native (Capacitor) platforms.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

export const useFileActions = () => {
  const { copy: clipboardCopy } = useClipboard()
  const isNative = Capacitor.isNativePlatform()

  // ── Helpers ──────────────────────────────────────────────

  const sanitizeFilename = (title) => {
    return (
      (title || 'untitled')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .slice(0, 80) || 'untitled'
    )
  }

  const mergeContentWithResults = (content, evaluateLines) => {
    if (!content || !evaluateLines) return content || ''
    const lines = content.split('\n')
    const results = evaluateLines(lines)
    return lines
      .map((line, i) => {
        const r = results[i]
        if (r && r.result) return `${line}  = ${r.result}`
        return line
      })
      .join('\n')
  }

  // ── Download / Save ──────────────────────────────────────

  /**
   * Web: trigger a browser download via anchor element.
   * Native: write directly to Documents folder on device.
   */
  const downloadFile = async (filename, content, mimeType = 'text/plain') => {
    if (!isNative) {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return
    }

    if (Capacitor.getPlatform() === 'android') {
      const perms = await Filesystem.checkPermissions()
      if (perms.publicStorage !== 'granted') {
        const req = await Filesystem.requestPermissions()
        if (req.publicStorage !== 'granted') {
          throw new Error('Storage permission required to save files.')
        }
      }
    }

    await Filesystem.writeFile({
      path: `Numori/${filename}`,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
  }

  /**
   * Download a Blob (binary data).
   * Web: object URL download. Native: base64 write to Documents.
   */
  const downloadBlob = async (filename, blob) => {
    if (!isNative) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return
    }

    if (Capacitor.getPlatform() === 'android') {
      const perms = await Filesystem.checkPermissions()
      if (perms.publicStorage !== 'granted') {
        const req = await Filesystem.requestPermissions()
        if (req.publicStorage !== 'granted') {
          throw new Error('Storage permission required to save files.')
        }
      }
    }

    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    await Filesystem.writeFile({
      path: `Numori/${filename}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    })
  }

  /**
   * Share a file via the system share sheet (native only, falls back to download on web).
   */
  const shareFile = async (filename, content, mimeType = 'text/plain') => {
    if (!isNative) {
      return downloadFile(filename, content, mimeType)
    }

    const result = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    })

    await Share.share({ files: [result.uri] })
  }

  /**
   * Share a Blob via the system share sheet (native only, falls back to download on web).
   */
  const shareBlob = async (filename, blob) => {
    if (!isNative) {
      return downloadBlob(filename, blob)
    }

    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })

    await Share.share({ files: [result.uri] })
  }

  // ── Export functions ────────────────────────────────────

  const exportNoteAsText = (note, evaluateLines = null) => {
    if (!note) return false
    const filename = `${sanitizeFilename(note.title)}.num`
    const content = evaluateLines
      ? mergeContentWithResults(note.content, evaluateLines)
      : note.content || ''
    downloadFile(filename, content, 'text/plain')
    return true
  }

  const exportNoteAsJson = (note) => {
    if (!note) return false
    const filename = `${sanitizeFilename(note.title)}.json`
    const data = {
      title: note.title,
      description: note.description,
      tags: note.tags || [],
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }
    downloadFile(filename, JSON.stringify(data, null, 2), 'application/json')
    return true
  }

  const exportAllNotes = (notes) => {
    if (!notes || notes.length === 0) return false
    const data = notes.map((n) => ({
      title: n.title,
      description: n.description,
      tags: n.tags || [],
      content: n.content,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }))
    downloadFile('numori_backup.json', JSON.stringify(data, null, 2), 'application/json')
    return true
  }

  const exportNoteAsMarkdown = (note, evaluateLines = null) => {
    if (!note) return false
    const filename = `${sanitizeFilename(note.title)}.md`
    const body = evaluateLines
      ? mergeContentWithResults(note.content, evaluateLines)
      : note.content || ''
    const header = `# ${note.title}\n\n`
    downloadFile(filename, header + body, 'text/markdown')
    return true
  }

  const exportNoteAsPdf = (note, evaluateLines = null) => {
    if (!note) return false
    const body = evaluateLines
      ? mergeContentWithResults(note.content, evaluateLines)
      : note.content || ''
    const escaped = body.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    if (!isNative) {
      const printWindow = window.open('', '_blank')
      if (!printWindow) return false
      printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${note.title || 'Note'}</title>
<style>
  body { font-family: monospace; white-space: pre-wrap; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
  @media print { body { padding: 0; } }
</style>
</head><body>${escaped}</body></html>`)
      printWindow.document.close()
      printWindow.print()
    } else {
      // On native, export as HTML and share — user can open in browser/print from there
      const html = `<!DOCTYPE html>
<html><head><title>${note.title || 'Note'}</title>
<style>body{font-family:monospace;white-space:pre-wrap;padding:2rem;max-width:800px;margin:0 auto;line-height:1.6}</style>
</head><body>${escaped}</body></html>`
      downloadFile(`${sanitizeFilename(note.title)}.html`, html, 'text/html')
    }
    return true
  }

  // ── File picking (open / import) ───────────────────────

  /**
   * Native file picker using a temporary <input type="file">.
   * On Capacitor Android/iOS the WebView delegates to the system file picker.
   * Falls back identically on web.
   */
  const pickFile = (accept) => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept

      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return reject(new Error('No file selected'))
        try {
          const text = await file.text()
          resolve({ name: file.name, text })
        } catch (err) {
          reject(new Error('Failed to read file: ' + err.message))
        }
      }
      input.oncancel = () => reject(new Error('Cancelled'))
      input.click()
    })
  }

  /**
   * Open a .num, .txt, or .md file as a new note.
   */
  const openFile = async () => {
    const { name, text } = await pickFile('.num,.txt,.md,.json')
    let title = name.replace(/\.[^.]+$/, '') || 'Opened Note'
    let content = text

    if (name.endsWith('.md')) {
      const headerMatch = text.match(/^#\s+(.+)\n\n?/)
      if (headerMatch) {
        title = headerMatch[1].trim()
        content = text.slice(headerMatch[0].length)
      }
    }

    return { title, description: '', content }
  }

  /**
   * Import notes from a .json file.
   */
  const importNotes = async () => {
    const { text } = await pickFile('.json')
    const parsed = JSON.parse(text)

    if (Array.isArray(parsed)) {
      const notes = parsed.map((n) => ({
        title: n.title || 'Imported Note',
        description: n.description || '',
        tags: n.tags || [],
        content: n.content || '',
      }))
      return { type: 'multiple', notes }
    }

    return {
      type: 'single',
      notes: [
        {
          title: parsed.title || 'Imported Note',
          description: parsed.description || '',
          tags: parsed.tags || [],
          content: parsed.content || '',
        },
      ],
    }
  }

  // ── Utility actions ────────────────────────────────────

  const duplicateNote = (note) => {
    if (!note) return null
    return {
      title: `${note.title} (copy)`,
      description: note.description || '',
      tags: note.tags ? [...note.tags] : [],
      content: note.content || '',
    }
  }

  const copyToClipboard = async (note) => {
    if (!note?.content) return false
    await clipboardCopy(note.content)
    return true
  }

  const printNote = (note, evaluateLines = null) => {
    if (!note) return false
    const body = evaluateLines
      ? mergeContentWithResults(note.content, evaluateLines)
      : note.content || ''

    if (!isNative) {
      const printWindow = window.open('', '_blank')
      if (!printWindow) return false
      printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${note.title || 'Note'}</title>
<style>body{font-family:monospace;white-space:pre-wrap;padding:2rem;max-width:800px;margin:0 auto;line-height:1.6}</style>
</head><body>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`)
      printWindow.document.close()
      printWindow.print()
    } else {
      // Native: share as HTML for printing
      const escaped = body.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const html = `<!DOCTYPE html>
<html><head><title>${note.title || 'Note'}</title>
<style>body{font-family:monospace;white-space:pre-wrap;padding:2rem;max-width:800px;margin:0 auto;line-height:1.6}</style>
</head><body>${escaped}</body></html>`
      downloadFile(`${sanitizeFilename(note.title)}.html`, html, 'text/html')
    }
    return true
  }

  return {
    downloadFile,
    downloadBlob,
    shareFile,
    shareBlob,
    pickFile,
    sanitizeFilename,
    mergeContentWithResults,
    exportNoteAsText,
    exportNoteAsJson,
    exportNoteAsMarkdown,
    exportNoteAsPdf,
    exportAllNotes,
    openFile,
    importNotes,
    duplicateNote,
    copyToClipboard,
    printNote,
  }
}
