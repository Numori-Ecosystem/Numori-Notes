/**
 * Tests for the printNote function in useFileActions.
 * Verifies that print generates coloured HTML output and respects
 * the includeResults and blackAndWhite options.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Nuxt auto-imports
globalThis.ref = (v) => ({ value: v })

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
}))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {},
  Directory: {},
  Encoding: {},
}))
vi.mock('@capacitor/share', () => ({
  Share: {},
}))

// Mock useClipboard (Nuxt composable)
globalThis.useClipboard = () => ({ copy: vi.fn() })

// Mock useNumoriHighlight to avoid CodeMirror DOM dependency
vi.mock('~/composables/useNumoriHighlight', () => ({
  tokenizeLine: (line) => {
    // Return a simple span with the full line text and a token type
    if (!line) return [{ text: '', token: null }]
    return [{ text: line, token: 'number' }]
  },
}))

describe('printNote', () => {
  let useFileActions
  let writtenHtml = ''
  let printCalled = false

  beforeEach(async () => {
    writtenHtml = ''
    printCalled = false

    // Setup minimal DOM mocks
    const mockIframe = {
      style: {},
      contentWindow: {
        document: {
          open: vi.fn(),
          write: vi.fn((html) => {
            writtenHtml = html
          }),
          close: vi.fn(),
        },
        print: vi.fn(() => {
          printCalled = true
        }),
        onafterprint: null,
      },
      parentNode: true,
    }

    globalThis.document = {
      createElement: vi.fn((tag) => {
        if (tag === 'iframe') return mockIframe
        return { href: '', download: '', click: vi.fn(), style: {} }
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    }

    globalThis.window = {
      open: vi.fn(),
      URL: { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() },
    }

    globalThis.Blob = class Blob {
      constructor(parts, opts) {
        this.parts = parts
        this.type = opts?.type
      }
    }

    globalThis.setTimeout = vi.fn((fn) => {
      fn()
    })

    const mod = await import('~/composables/useFileActions.js')
    useFileActions = mod.useFileActions
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    delete globalThis.document
    delete globalThis.window
    delete globalThis.Blob
    delete globalThis.setTimeout
  })

  it('generates coloured HTML by default (not black & white)', async () => {
    const { printNote } = useFileActions()
    const note = { title: 'Test', content: '2 + 2' }

    await printNote(note, null, false)

    expect(writtenHtml).toContain('<span style="color:')
    // Default colours should not be all #000000
    expect(writtenHtml).not.toMatch(/color:#000000/)
  })

  it('generates black & white HTML when blackAndWhite is true', async () => {
    const { printNote } = useFileActions()
    const note = { title: 'Test', content: '2 + 2' }

    await printNote(note, null, true)

    expect(writtenHtml).toContain('color:#000000')
  })

  it('includes results when evaluateLines is provided', async () => {
    const { printNote } = useFileActions()
    const note = { title: 'Test', content: '2 + 2' }
    const evaluateLines = () => [{ result: '4' }]

    await printNote(note, evaluateLines, false)

    expect(writtenHtml).toContain('= 4')
  })

  it('does not include results when evaluateLines is null', async () => {
    const { printNote } = useFileActions()
    const note = { title: 'Test', content: '2 + 2' }

    await printNote(note, null, false)

    expect(writtenHtml).not.toContain('= ')
  })

  it('returns false for null note', async () => {
    const { printNote } = useFileActions()
    const result = await printNote(null)
    expect(result).toBe(false)
  })

  it('uses iframe for printing (not window.open)', async () => {
    const { printNote } = useFileActions()
    const note = { title: 'Test', content: 'hello' }

    await printNote(note, null, false)

    expect(globalThis.window.open).not.toHaveBeenCalled()
    expect(globalThis.document.createElement).toHaveBeenCalledWith('iframe')
    expect(printCalled).toBe(true)
  })

  it('sets @page margin in CSS for clean print output', async () => {
    const { printNote } = useFileActions()
    const note = { title: 'Test', content: 'hello' }

    await printNote(note, null, false)

    expect(writtenHtml).toContain('@page')
    expect(writtenHtml).toContain('margin: 15mm')
  })
})
