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

  const exportNoteAsText = (note, evaluateLines = null, ext = '.num') => {
    if (!note) return false
    const filename = `${sanitizeFilename(note.title)}${ext}`
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

  const exportNoteAsPdf = async (note, evaluateLines = null, blackAndWhite = false) => {
    if (!note) return false
    const { jsPDF } = await import('jspdf')
    const colouredLines = await parseColouredContent(note.content, evaluateLines, blackAndWhite)

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - margin * 2
    const lineHeight = 5
    let y = margin

    doc.setFontSize(10)

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return [r, g, b]
    }

    for (const line of colouredLines) {
      // Concatenate line text for word-wrap calculation
      const fullText = line.map((s) => s.text).join('')
      const splitLines = doc.splitTextToSize(fullText || ' ', maxWidth)

      // For simplicity with jsPDF (which doesn't support inline colour changes),
      // use the colour of the first meaningful span for the whole line
      const firstSpan = line.find((s) => s.text.trim()) ||
        line[0] || { color: '#2D2A2E', bold: false, italic: false }
      const [r, g, b] = hexToRgb(firstSpan.color)
      doc.setTextColor(r, g, b)

      const fontStyle =
        firstSpan.bold && firstSpan.italic
          ? 'bolditalic'
          : firstSpan.bold
            ? 'bold'
            : firstSpan.italic
              ? 'italic'
              : 'normal'
      doc.setFont('courier', fontStyle)

      for (const sl of splitLines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(sl, margin, y)
        y += lineHeight
      }
    }

    const filename = `${sanitizeFilename(note.title)}.pdf`
    const blob = doc.output('blob')
    await downloadBlob(filename, blob)
    return true
  }

  // ── Colour-coded content helpers ───────────────────────

  /**
   * Map numori token types to their light-mode hex colours.
   * These match the Numori language highlighting in the editor.
   */
  const tokenColourMap = {
    heading: '#2D2A2E',
    comment: '#939293',
    labelName: '#727072',
    keyword: '#CC2D56',
    operatorKeyword: '#939293',
    typeName: '#1A8A9A',
    'name.definition': '#4D8C2A',
    atom: '#7B5FC4',
    unit: '#C4621A',
    number: '#A68A1B',
    string: '#C4621A',
    variableName: '#2D2A2E',
    operator: '#727072',
    bracket: '#727072',
  }

  const defaultColour = '#2D2A2E'

  /**
   * Parse note content into coloured spans using the Numori language tokenizer.
   * Returns an array of lines, each line being an array of { text, color } spans.
   */
  const parseColouredContent = async (content, evaluateLines = null, blackAndWhite = false) => {
    if (!content) return []
    const { tokenizeLine } = await import('~/composables/useNumoriHighlight')
    const lines = content.split('\n')
    const results = evaluateLines ? evaluateLines(lines) : []

    return lines.map((line, i) => {
      const r = results[i]
      const spans = tokenizeLine(line)
      const lineSpans = spans.map((s) => ({
        text: s.text,
        color: blackAndWhite ? '#000000' : tokenColourMap[s.token] || defaultColour,
        bold: s.token === 'heading' || s.token === 'keyword' || s.token === 'labelName',
        italic: s.token === 'comment',
      }))
      // Append result if present
      if (r && r.result) {
        lineSpans.push({
          text: `  = ${r.result}`,
          color: blackAndWhite ? '#000000' : '#4D8C2A',
          bold: false,
          italic: false,
        })
      }
      return lineSpans
    })
  }

  /**
   * Flat version: returns array of { text, color } per line (single colour per line).
   * Used by simpler formats. Takes the dominant colour of the first non-whitespace token.
   */
  const parseColouredLines = (content, evaluateLines = null) => {
    if (!content) return []
    const lines = content.split('\n')
    const results = evaluateLines ? evaluateLines(lines) : []
    return lines.map((line, i) => {
      const r = results[i]
      const displayLine = r && r.result ? `${line}  = ${r.result}` : line
      const trimmed = line.trimStart()
      let color = defaultColour
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        color = '#2D2A2E' // heading
      } else if (trimmed.startsWith('//')) {
        color = '#939293' // comment
      } else if (r && r.result) {
        color = '#4D8C2A' // result (function green)
      }
      return { text: displayLine, color }
    })
  }

  // ── RTF export (with proper encoding and per-token colours) ──────────

  const exportNoteAsRtf = async (note, evaluateLines = null, blackAndWhite = false) => {
    if (!note) return false
    const colouredLines = await parseColouredContent(note.content, evaluateLines, blackAndWhite)

    // Collect all unique colours used
    const colourSet = new Set()
    for (const line of colouredLines) {
      for (const span of line) {
        colourSet.add(span.color)
      }
    }
    const colours = [...colourSet]
    const colourIndex = Object.fromEntries(colours.map((c, i) => [c, i + 1]))

    // Build RTF colour table
    const ctEntries = colours
      .map((hex) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `\\red${r}\\green${g}\\blue${b};`
      })
      .join('')
    const colourTableRtf = `{\\colortbl ;${ctEntries}}`

    // Escape RTF special chars and handle Unicode
    const escapeRtf = (str) => {
      let result = ''
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        const ch = str[i]
        if (ch === '\\') result += '\\\\'
        else if (ch === '{') result += '\\{'
        else if (ch === '}') result += '\\}'
        else if (code > 127) result += `\\u${code}?`
        else result += ch
      }
      return result
    }

    // Build body
    const bodyParts = []
    for (const line of colouredLines) {
      const lineParts = []
      for (const span of line) {
        const cf = colourIndex[span.color] || 1
        let prefix = `\\cf${cf}`
        if (span.bold) prefix += '\\b'
        if (span.italic) prefix += '\\i'
        let suffix = ''
        if (span.bold) suffix += '\\b0'
        if (span.italic) suffix += '\\i0'
        lineParts.push(`${prefix} ${escapeRtf(span.text)}${suffix}`)
      }
      bodyParts.push(lineParts.join(''))
    }

    const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0\\fmodern\\fcharset0 Courier New;}}${colourTableRtf}\\f0\\fs20\n${bodyParts.join('\\par\n')}\n}`

    const filename = `${sanitizeFilename(note.title)}.rtf`
    downloadFile(filename, rtf, 'application/rtf')
    return true
  }

  // ── ODT export (proper ODF structure with per-token colours) ────────

  const exportNoteAsOdt = async (note, evaluateLines = null, blackAndWhite = false) => {
    if (!note) return false
    const colouredLines = await parseColouredContent(note.content, evaluateLines, blackAndWhite)

    const { BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js')

    const escapeXml = (str) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    // Collect unique style combinations (color + bold + italic)
    const styleMap = new Map()
    let styleCounter = 0
    const getStyleName = (span) => {
      const key = `${span.color}_${span.bold ? 'b' : ''}_${span.italic ? 'i' : ''}`
      if (!styleMap.has(key)) {
        styleMap.set(key, {
          name: `T${styleCounter++}`,
          color: span.color,
          bold: span.bold,
          italic: span.italic,
        })
      }
      return styleMap.get(key).name
    }

    // Pre-process to collect styles
    for (const line of colouredLines) {
      for (const span of line) {
        getStyleName(span)
      }
    }

    // Build automatic styles XML
    const autoStyles = [...styleMap.values()]
      .map((s) => {
        let props = `fo:color="${s.color}" style:font-name="Courier New" fo:font-size="10pt"`
        if (s.bold) props += ' fo:font-weight="bold"'
        if (s.italic) props += ' fo:font-style="italic"'
        return `<style:style style:name="${s.name}" style:family="text"><style:text-properties ${props}/></style:style>`
      })
      .join('\n    ')

    // Build paragraphs
    const paragraphs = colouredLines
      .map((line) => {
        if (line.length === 0) return '<text:p text:style-name="Standard"/>'
        const spans = line
          .map((span) => {
            const styleName = getStyleName(span)
            const text = escapeXml(span.text).replace(/ {2}/g, ' <text:s/>')
            return `<text:span text:style-name="${styleName}">${text}</text:span>`
          })
          .join('')
        return `<text:p text:style-name="Standard">${spans}</text:p>`
      })
      .join('\n      ')

    const mimetype = 'application/vnd.oasis.opendocument.text'

    const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
 <manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.text"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`

    const meta = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  office:version="1.3">
  <office:meta>
    <meta:generator>Numori Notes</meta:generator>
    <dc:title>${escapeXml(note.title || 'Untitled')}</dc:title>
    <meta:creation-date>${new Date().toISOString()}</meta:creation-date>
  </office:meta>
</office:document-meta>`

    const styles = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.3">
  <office:font-face-decls>
    <style:font-face style:name="Courier New" svg:font-family="'Courier New'" style:font-family-generic="modern" style:font-pitch="fixed"/>
  </office:font-face-decls>
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph">
      <style:text-properties style:font-name="Courier New" fo:font-size="10pt"/>
    </style:style>
  </office:styles>
</office:document-styles>`

    const content = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.3">
  <office:scripts/>
  <office:font-face-decls>
    <style:font-face style:name="Courier New" svg:font-family="'Courier New'" style:font-family-generic="modern" style:font-pitch="fixed"/>
  </office:font-face-decls>
  <office:automatic-styles>
    ${autoStyles}
  </office:automatic-styles>
  <office:body>
    <office:text>
      ${paragraphs}
    </office:text>
  </office:body>
</office:document-content>`

    const blobWriter = new BlobWriter('application/vnd.oasis.opendocument.text')
    const zipWriter = new ZipWriter(blobWriter)
    // mimetype must be first entry, stored uncompressed without extra fields
    await zipWriter.add('mimetype', new TextReader(mimetype), {
      level: 0,
      extendedTimestamp: false,
      dataDescriptor: false,
    })
    await zipWriter.add('META-INF/manifest.xml', new TextReader(manifest))
    await zipWriter.add('meta.xml', new TextReader(meta))
    await zipWriter.add('content.xml', new TextReader(content))
    await zipWriter.add('styles.xml', new TextReader(styles))
    const blob = await zipWriter.close()

    const filename = `${sanitizeFilename(note.title)}.odt`
    await downloadBlob(filename, blob)
    return true
  }

  // ── DOCX export (using docx library with per-token colours) ─────────

  const exportNoteAsDocx = async (note, evaluateLines = null, blackAndWhite = false) => {
    if (!note) return false
    const colouredLines = await parseColouredContent(note.content, evaluateLines, blackAndWhite)
    const { Document, Paragraph, TextRun, Packer } = await import('docx')

    const paragraphs = colouredLines.map((line) => {
      const children = line.map((span) => {
        return new TextRun({
          text: span.text,
          font: 'Courier New',
          size: 20, // half-points, 20 = 10pt
          color: span.color.replace('#', ''),
          bold: span.bold || false,
          italics: span.italic || false,
        })
      })
      // If line is empty, add an empty run to preserve the blank line
      if (children.length === 0) {
        children.push(new TextRun({ text: '', font: 'Courier New', size: 20 }))
      }
      return new Paragraph({ children })
    })

    const doc = new Document({
      sections: [{ children: paragraphs }],
    })

    const blob = await Packer.toBlob(doc)
    const filename = `${sanitizeFilename(note.title)}.docx`
    await downloadBlob(filename, blob)
    return true
  }

  // ── HTML export (full colour with inline styles) ───────

  const exportNoteAsHtml = async (note, evaluateLines = null, blackAndWhite = false) => {
    if (!note) return false
    const colouredLines = await parseColouredContent(note.content, evaluateLines, blackAndWhite)

    const escapeHtml = (str) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const bodyLines = colouredLines
      .map((line) => {
        if (line.length === 0) return '<br>'
        const spans = line
          .map((span) => {
            let style = `color:${span.color}`
            if (span.bold) style += ';font-weight:bold'
            if (span.italic) style += ';font-style:italic'
            return `<span style="${style}">${escapeHtml(span.text)}</span>`
          })
          .join('')
        return `<div>${spans}</div>`
      })
      .join('\n')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(note.title || 'Untitled')}</title>
<style>
body { font-family: 'Courier New', monospace; font-size: 10pt; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; white-space: pre-wrap; }
div { min-height: 1.6em; }
</style>
</head>
<body>
${bodyLines}
</body>
</html>`

    const filename = `${sanitizeFilename(note.title)}.html`
    downloadFile(filename, html, 'text/html')
    return true
  }

  // ── LaTeX export ──────────────────────────────────────

  const exportNoteAsLatex = (note, evaluateLines = null) => {
    if (!note) return false
    const content = note.content || ''
    const lines = content.split('\n')
    const results = evaluateLines ? evaluateLines(lines) : []

    const escapeLatex = (str) =>
      str
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/[&%$#_{}]/g, (m) => '\\' + m)
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}')

    const bodyLines = lines
      .map((line, i) => {
        const r = results[i]
        const displayLine = r && r.result ? `${line}  = ${r.result}` : line
        const trimmed = line.trimStart()

        if (trimmed.startsWith('# ')) {
          return `\\section{${escapeLatex(trimmed.slice(2))}}`
        } else if (trimmed.startsWith('## ')) {
          return `\\subsection{${escapeLatex(trimmed.slice(3))}}`
        } else if (trimmed.startsWith('### ')) {
          return `\\subsubsection{${escapeLatex(trimmed.slice(4))}}`
        } else if (trimmed.startsWith('//')) {
          return `% ${trimmed.slice(2).trim()}`
        } else if (displayLine.trim() === '') {
          return ''
        } else {
          return escapeLatex(displayLine) + ' \\\\\\\\'
        }
      })
      .join('\n')

    const latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}
\\usepackage{parskip}

\\title{${escapeLatex(note.title || 'Untitled')}}
\\date{}

\\begin{document}
\\maketitle

\\begin{ttfamily}
${bodyLines}
\\end{ttfamily}

\\end{document}`

    const filename = `${sanitizeFilename(note.title)}.tex`
    downloadFile(filename, latex, 'application/x-tex')
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
    const { name, text } = await pickFile('.num,.txt,.md,.json,.rtf,.odt,.docx')
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
    parseColouredLines,
    parseColouredContent,
    exportNoteAsText,
    exportNoteAsJson,
    exportNoteAsMarkdown,
    exportNoteAsPdf,
    exportNoteAsRtf,
    exportNoteAsOdt,
    exportNoteAsDocx,
    exportNoteAsHtml,
    exportNoteAsLatex,
    exportAllNotes,
    openFile,
    importNotes,
    duplicateNote,
    copyToClipboard,
    printNote,
  }
}
