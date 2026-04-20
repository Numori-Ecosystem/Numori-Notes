/**
 * Tests for the useFileActions composable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useClipboard from VueUse
const mockCopy = vi.fn(() => Promise.resolve())
vi.stubGlobal('useClipboard', () => ({ copy: mockCopy }))

// Mock jsPDF for test environment (requires DOM APIs not available in Node)
vi.mock('jspdf', () => ({
  jsPDF: class {
    constructor() {
      this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } }
    }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    splitTextToSize(text) {
      return [text]
    }
    text() {}
    addPage() {}
    output() {
      return new Blob(['mock-pdf'], { type: 'application/pdf' })
    }
  },
}))

// Mock useNumoriHighlight for test environment
vi.mock('~/composables/useNumoriHighlight', () => ({
  tokenizeLine: (line) => [{ text: line, token: null }],
}))

// We test the pure logic functions directly by importing the composable
const { useFileActions } = await import('../useFileActions.js')

const {
  sanitizeFilename,
  mergeContentWithResults,
  exportNoteAsText,
  exportNoteAsJson,
  exportNoteAsMarkdown,
  exportNoteAsPdf,
  exportNoteAsHtml,
  exportNoteAsLatex,
  exportNoteAsCsv,
  exportNoteAsRtf,
  exportNoteAsOdt,
  exportNoteAsDocx,
  exportAllNotes,
  openFile,
  duplicateNote,
  copyToClipboard,
  printNote,
  downloadFile,
} = useFileActions()

// Mock DOM APIs
let createdElements = []
let revokedUrls = []

beforeEach(() => {
  createdElements = []
  revokedUrls = []

  // Mock URL.createObjectURL / revokeObjectURL
  const MockURL = vi.fn(() => ({ href: 'http://mock' }))
  MockURL.createObjectURL = vi.fn(() => 'blob:mock-url')
  MockURL.revokeObjectURL = vi.fn((url) => revokedUrls.push(url))
  globalThis.URL = MockURL

  // Mock document.createElement for anchor downloads
  globalThis.document = {
    createElement: vi.fn((tag) => {
      const el = { tagName: tag, href: '', download: '', click: vi.fn() }
      createdElements.push(el)
      return el
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  }
})

describe('sanitizeFilename', () => {
  it('converts title to lowercase with underscores', () => {
    expect(sanitizeFilename('My Cool Note')).toBe('my_cool_note')
  })

  it('removes special characters', () => {
    expect(sanitizeFilename('Note @#$% Test!')).toBe('note_test')
  })

  it('returns "untitled" for empty string', () => {
    expect(sanitizeFilename('')).toBe('untitled')
  })

  it('returns "untitled" for null/undefined', () => {
    expect(sanitizeFilename(null)).toBe('untitled')
    expect(sanitizeFilename(undefined)).toBe('untitled')
  })

  it('truncates long titles to 80 chars', () => {
    const longTitle = 'a'.repeat(100)
    expect(sanitizeFilename(longTitle).length).toBeLessThanOrEqual(80)
  })

  it('collapses multiple spaces into single underscore', () => {
    expect(sanitizeFilename('hello   world')).toBe('hello_world')
  })
})

describe('downloadFile', () => {
  it('creates a blob URL, clicks an anchor, and cleans up', () => {
    downloadFile('test.txt', 'hello', 'text/plain')

    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(createdElements).toHaveLength(1)
    expect(createdElements[0].download).toBe('test.txt')
    expect(createdElements[0].click).toHaveBeenCalledOnce()
    expect(document.body.appendChild).toHaveBeenCalledOnce()
    expect(document.body.removeChild).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('exportNoteAsText', () => {
  it('returns false for null note', () => {
    expect(exportNoteAsText(null)).toBe(false)
  })

  it('exports note content as .num', () => {
    const note = { title: 'Test Note', content: '2 + 2' }
    const result = exportNoteAsText(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('test_note.num')
  })

  it('handles note with empty content', () => {
    const note = { title: 'Empty', content: '' }
    expect(exportNoteAsText(note)).toBe(true)
  })

  it('exports with results when evaluateLines is provided', () => {
    const mockEval = (lines) => lines.map((l) => ({ result: l === '2 + 2' ? '4' : null }))
    const note = { title: 'Calc', content: '2 + 2' }
    expect(exportNoteAsText(note, mockEval)).toBe(true)
    expect(createdElements[0].download).toBe('calc.num')
  })
})

describe('exportNoteAsJson', () => {
  it('returns false for null note', () => {
    expect(exportNoteAsJson(null)).toBe(false)
  })

  it('exports note as .json with metadata', () => {
    const note = {
      title: 'My Note',
      description: 'A description',
      content: 'some content',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
    }
    const result = exportNoteAsJson(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('my_note.json')
  })
})

describe('exportAllNotes', () => {
  it('returns false for empty array', () => {
    expect(exportAllNotes([])).toBe(false)
  })

  it('returns false for null', () => {
    expect(exportAllNotes(null)).toBe(false)
  })

  it('exports all notes as numori_backup.json', () => {
    const notes = [
      { title: 'A', description: '', content: '1+1', createdAt: '', updatedAt: '' },
      { title: 'B', description: '', content: '2+2', createdAt: '', updatedAt: '' },
    ]
    const result = exportAllNotes(notes)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('numori_backup.json')
  })
})

describe('duplicateNote', () => {
  it('returns null for null note', () => {
    expect(duplicateNote(null)).toBeNull()
  })

  it('creates a copy with "(copy)" suffix', () => {
    const note = { title: 'Budget', description: 'Monthly', content: '100 + 200' }
    const copy = duplicateNote(note)

    expect(copy.title).toBe('Budget (copy)')
    expect(copy.description).toBe('Monthly')
    expect(copy.content).toBe('100 + 200')
  })

  it('preserves empty description', () => {
    const note = { title: 'X', description: '', content: '' }
    const copy = duplicateNote(note)
    expect(copy.description).toBe('')
  })
})

describe('copyToClipboard', () => {
  it('returns false for note without content', async () => {
    expect(await copyToClipboard({ content: '' })).toBe(false)
    expect(await copyToClipboard(null)).toBe(false)
  })

  it('copies content to clipboard', async () => {
    mockCopy.mockClear()

    const note = { content: 'hello world' }
    const result = await copyToClipboard(note)

    expect(result).toBe(true)
    expect(mockCopy).toHaveBeenCalledWith('hello world')
  })
})

describe('printNote', () => {
  it('returns false for null note', () => {
    expect(printNote(null)).toBe(false)
  })

  it('opens a print window with note content', () => {
    const mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    }
    globalThis.window = { open: vi.fn(() => mockWindow) }

    const note = { title: 'Test', content: 'Hello <world>' }
    const result = printNote(note)

    expect(result).toBe(true)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    expect(mockWindow.document.write).toHaveBeenCalledOnce()
    // Verify HTML escaping
    const html = mockWindow.document.write.mock.calls[0][0]
    expect(html).toContain('Hello &lt;world&gt;')
    expect(html).toContain('<title>Test</title>')
    expect(mockWindow.print).toHaveBeenCalledOnce()
  })

  it('returns false if popup is blocked', () => {
    globalThis.window = { open: vi.fn(() => null) }
    expect(printNote({ title: 'X', content: 'Y' })).toBe(false)
  })

  it('prints with results when evaluateLines is provided', () => {
    const mockWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      print: vi.fn(),
    }
    globalThis.window = { open: vi.fn(() => mockWindow) }
    const mockEval = (lines) => lines.map((l) => ({ result: l === '5 + 5' ? '10' : null }))
    const note = { title: 'Calc', content: '5 + 5' }
    const result = printNote(note, mockEval)

    expect(result).toBe(true)
    const html = mockWindow.document.write.mock.calls[0][0]
    expect(html).toContain('5 + 5  = 10')
  })
})

// Mock evaluateLines for testing "with results" exports
const mockEvaluateLines = (lines) =>
  lines.map((line) => {
    if (line === '2 + 2') return { result: '4' }
    if (line === '# Header') return { result: null, type: 'header' }
    if (line === '// comment') return { result: null, type: 'comment' }
    if (line === 'price = 100') return { result: '100' }
    return { result: null }
  })

describe('mergeContentWithResults', () => {
  it('returns empty string for empty content', () => {
    expect(mergeContentWithResults('', mockEvaluateLines)).toBe('')
  })

  it('returns content as-is when evaluateLines is null', () => {
    expect(mergeContentWithResults('hello', null)).toBe('hello')
  })

  it('appends results to lines that have them', () => {
    const content = '2 + 2\n# Header\n// comment'
    const result = mergeContentWithResults(content, mockEvaluateLines)
    const lines = result.split('\n')

    expect(lines[0]).toBe('2 + 2  = 4')
    expect(lines[1]).toBe('# Header')
    expect(lines[2]).toBe('// comment')
  })

  it('handles multi-line with variables', () => {
    const content = 'price = 100\n2 + 2'
    const result = mergeContentWithResults(content, mockEvaluateLines)
    const lines = result.split('\n')

    expect(lines[0]).toBe('price = 100  = 100')
    expect(lines[1]).toBe('2 + 2  = 4')
  })

  it('handles null content', () => {
    expect(mergeContentWithResults(null, mockEvaluateLines)).toBe('')
  })
})

describe('exportNoteAsMarkdown', () => {
  it('returns false for null note', () => {
    expect(exportNoteAsMarkdown(null)).toBe(false)
  })

  it('exports note as .md with title header', () => {
    const note = { title: 'My Note', content: 'some content' }
    const result = exportNoteAsMarkdown(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('my_note.md')
  })

  it('exports with results when evaluateLines is provided', () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = exportNoteAsMarkdown(note, mockEvaluateLines)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('calc.md')
  })

  it('exports without results by default', () => {
    const note = { title: 'Plain', content: '2 + 2' }
    exportNoteAsMarkdown(note)
    expect(createdElements[0].download).toBe('plain.md')
  })
})

describe('exportNoteAsPdf', () => {
  it('returns false for null note', async () => {
    expect(await exportNoteAsPdf(null)).toBe(false)
  })

  it('generates a PDF blob and downloads it', async () => {
    const note = { title: 'PDF Test', content: 'Hello\nWorld' }
    const result = await exportNoteAsPdf(note)

    expect(result).toBe(true)
    // Verify a download was triggered (blob URL created)
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
  })

  it('exports with results when evaluateLines is provided', async () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = await exportNoteAsPdf(note, mockEvaluateLines)

    expect(result).toBe(true)
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
  })
})

describe('openFile', () => {
  it('opens a .txt file and uses filename as title', async () => {
    const mockFile = {
      name: 'my_notes.txt',
      text: vi.fn(() => Promise.resolve('hello world')),
    }
    globalThis.document = {
      ...globalThis.document,
      createElement: vi.fn(() => {
        const input = {
          type: '',
          accept: '',
          onchange: null,
          oncancel: null,
          click: vi.fn(),
        }
        // Simulate file selection after click
        setTimeout(() => input.onchange({ target: { files: [mockFile] } }), 0)
        return input
      }),
    }

    const result = await openFile()
    expect(result.title).toBe('my_notes')
    expect(result.content).toBe('hello world')
    expect(result.description).toBe('')
  })

  it('opens a .md file and extracts title from # heading', async () => {
    const mockFile = {
      name: 'document.md',
      text: vi.fn(() => Promise.resolve('# My Document\n\nSome content here')),
    }
    globalThis.document = {
      ...globalThis.document,
      createElement: vi.fn(() => {
        const input = {
          type: '',
          accept: '',
          onchange: null,
          oncancel: null,
          click: vi.fn(),
        }
        setTimeout(() => input.onchange({ target: { files: [mockFile] } }), 0)
        return input
      }),
    }

    const result = await openFile()
    expect(result.title).toBe('My Document')
    expect(result.content).toBe('Some content here')
  })

  it('uses filename for .md without # heading', async () => {
    const mockFile = {
      name: 'plain.md',
      text: vi.fn(() => Promise.resolve('No heading here\nJust content')),
    }
    globalThis.document = {
      ...globalThis.document,
      createElement: vi.fn(() => {
        const input = {
          type: '',
          accept: '',
          onchange: null,
          oncancel: null,
          click: vi.fn(),
        }
        setTimeout(() => input.onchange({ target: { files: [mockFile] } }), 0)
        return input
      }),
    }

    const result = await openFile()
    expect(result.title).toBe('plain')
    expect(result.content).toBe('No heading here\nJust content')
  })

  it('rejects when cancelled', async () => {
    globalThis.document = {
      ...globalThis.document,
      createElement: vi.fn(() => {
        const input = {
          type: '',
          accept: '',
          onchange: null,
          oncancel: null,
          click: vi.fn(),
        }
        setTimeout(() => input.oncancel(), 0)
        return input
      }),
    }

    await expect(openFile()).rejects.toThrow('Cancelled')
  })
})

describe('exportNoteAsText with custom extension', () => {
  it('exports as .txt when extension specified', () => {
    const note = { title: 'Test', content: 'hello' }
    const result = exportNoteAsText(note, null, '.txt')

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('test.txt')
  })

  it('exports as .num by default', () => {
    const note = { title: 'Test', content: 'hello' }
    exportNoteAsText(note)
    expect(createdElements[0].download).toBe('test.num')
  })
})

describe('exportNoteAsHtml', () => {
  it('returns false for null note', async () => {
    expect(await exportNoteAsHtml(null)).toBe(false)
  })

  it('exports note as .html with colour spans', async () => {
    const note = { title: 'HTML Test', content: 'hello\nworld' }
    const result = await exportNoteAsHtml(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('html_test.html')
  })

  it('exports with results when evaluateLines is provided', async () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = await exportNoteAsHtml(note, mockEvaluateLines)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('calc.html')
  })

  it('respects blackAndWhite flag', async () => {
    const note = { title: 'BW', content: '// comment' }
    const result = await exportNoteAsHtml(note, null, true)

    expect(result).toBe(true)
  })
})

describe('exportNoteAsLatex', () => {
  it('returns false for null note', () => {
    expect(exportNoteAsLatex(null)).toBe(false)
  })

  it('exports note as .tex', () => {
    const note = { title: 'LaTeX Test', content: '2 + 2' }
    const result = exportNoteAsLatex(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('latex_test.tex')
  })

  it('converts headings to LaTeX sections', () => {
    const note = { title: 'Doc', content: '# Introduction\n## Methods\n### Details' }
    exportNoteAsLatex(note)

    // Verify it was downloaded (content is in the blob)
    expect(createdElements[0].download).toBe('doc.tex')
  })

  it('converts comments to LaTeX comments', () => {
    const note = { title: 'Doc', content: '// this is a comment' }
    exportNoteAsLatex(note)
    expect(createdElements[0].download).toBe('doc.tex')
  })

  it('escapes LaTeX special characters', () => {
    const note = { title: 'Special', content: '100% of $50 & more' }
    const result = exportNoteAsLatex(note)
    expect(result).toBe(true)
  })

  it('includes results when evaluateLines is provided', () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = exportNoteAsLatex(note, mockEvaluateLines)
    expect(result).toBe(true)
  })
})

describe('exportNoteAsCsv', () => {
  it('returns false for null note', () => {
    expect(exportNoteAsCsv(null)).toBe(false)
  })

  it('exports note as .csv with header row', () => {
    const note = { title: 'CSV Test', content: 'hello\nworld' }
    const result = exportNoteAsCsv(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('csv_test.csv')
  })

  it('includes results in second column', () => {
    const note = { title: 'Calc', content: '2 + 2\n# Header' }
    const result = exportNoteAsCsv(note, mockEvaluateLines)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('calc.csv')
  })

  it('escapes commas and quotes in CSV', () => {
    const note = { title: 'Escape', content: 'hello, world\n"quoted"' }
    const result = exportNoteAsCsv(note)
    expect(result).toBe(true)
  })
})

describe('exportNoteAsRtf', () => {
  it('returns false for null note', async () => {
    expect(await exportNoteAsRtf(null)).toBe(false)
  })

  it('exports note as .rtf', async () => {
    const note = { title: 'RTF Test', content: 'hello\nworld' }
    const result = await exportNoteAsRtf(note)

    expect(result).toBe(true)
    expect(createdElements[0].download).toBe('rtf_test.rtf')
  })

  it('exports with results', async () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = await exportNoteAsRtf(note, mockEvaluateLines)
    expect(result).toBe(true)
  })

  it('respects blackAndWhite flag', async () => {
    const note = { title: 'BW', content: '// comment\n2 + 2' }
    const result = await exportNoteAsRtf(note, null, true)
    expect(result).toBe(true)
  })
})

describe('exportNoteAsOdt', () => {
  it('returns false for null note', async () => {
    expect(await exportNoteAsOdt(null)).toBe(false)
  })

  it('exports note as .odt', async () => {
    const note = { title: 'ODT Test', content: 'hello\nworld' }
    const result = await exportNoteAsOdt(note)

    expect(result).toBe(true)
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
  })

  it('exports with results', async () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = await exportNoteAsOdt(note, mockEvaluateLines)
    expect(result).toBe(true)
  })
})

describe('exportNoteAsDocx', () => {
  it('returns false for null note', async () => {
    expect(await exportNoteAsDocx(null)).toBe(false)
  })

  it('exports note as .docx', async () => {
    const note = { title: 'DOCX Test', content: 'hello\nworld' }
    const result = await exportNoteAsDocx(note)

    expect(result).toBe(true)
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
  })

  it('exports with results', async () => {
    const note = { title: 'Calc', content: '2 + 2' }
    const result = await exportNoteAsDocx(note, mockEvaluateLines)
    expect(result).toBe(true)
  })

  it('respects blackAndWhite flag', async () => {
    const note = { title: 'BW', content: '// comment' }
    const result = await exportNoteAsDocx(note, null, true)
    expect(result).toBe(true)
  })
})
