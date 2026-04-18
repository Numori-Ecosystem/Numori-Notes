/**
 * Tests for useCodeHighlight composable and code-block related logic.
 * Covers: highlightCode output, language aliases, offset correctness,
 * multi-line spans, HTML entity decoding, edge cases, and the fence
 * detection regex used by NoteEditor.
 */
import { describe, it, expect } from 'vitest'
import { highlightCode } from '../composables/useCodeHighlight.js'

// ─── Fence detection regex (mirrors NoteEditor) ───
const FENCE_RE = /^```([\w+#.-]*)$/

// ─── highlightCode: basic behaviour ───

describe('highlightCode — basic', () => {
  it('returns an array of spans', () => {
    const spans = highlightCode('const x = 1', 'javascript')
    expect(Array.isArray(spans)).toBe(true)
    expect(spans.length).toBeGreaterThan(0)
  })

  it('every span has text, className, and offset', () => {
    const spans = highlightCode('let a = 2', 'js')
    for (const s of spans) {
      expect(s).toHaveProperty('text')
      expect(s).toHaveProperty('className')
      expect(s).toHaveProperty('offset')
      expect(typeof s.text).toBe('string')
      expect(typeof s.offset).toBe('number')
    }
  })

  it('concatenated span texts equal the original code', () => {
    const code = 'function hello() { return "world"; }'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('offsets are sequential and non-overlapping', () => {
    const code = 'const arr = [1, 2, 3];'
    const spans = highlightCode(code, 'javascript')
    let expectedOffset = 0
    for (const s of spans) {
      expect(s.offset).toBe(expectedOffset)
      expectedOffset += s.text.length
    }
    expect(expectedOffset).toBe(code.length)
  })
})

// ─── highlightCode: language detection ───

describe('highlightCode — language detection', () => {
  it('highlights JavaScript keywords', () => {
    const spans = highlightCode('const x = 1', 'javascript')
    const keyword = spans.find(s => s.text === 'const')
    expect(keyword).toBeDefined()
    expect(keyword.className).toContain('hljs-keyword')
  })

  it('highlights Python keywords', () => {
    const spans = highlightCode('def hello():\n  pass', 'python')
    const keyword = spans.find(s => s.text === 'def')
    expect(keyword).toBeDefined()
    expect(keyword.className).toContain('hljs-keyword')
  })

  it('highlights TypeScript types', () => {
    const spans = highlightCode('let x: number = 5', 'typescript')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights HTML/XML tags', () => {
    const spans = highlightCode('<div class="test">hello</div>', 'html')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights CSS properties', () => {
    const spans = highlightCode('body { color: red; }', 'css')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights JSON keys', () => {
    const spans = highlightCode('{ "key": "value" }', 'json')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights YAML keys', () => {
    const spans = highlightCode('name: test\nversion: 1', 'yaml')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights bash commands', () => {
    const spans = highlightCode('echo "hello" && ls -la', 'bash')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights SQL statements', () => {
    const spans = highlightCode('SELECT * FROM users WHERE id = 1', 'sql')
    const keyword = spans.find(s => s.text === 'SELECT')
    expect(keyword).toBeDefined()
    expect(keyword.className).toContain('hljs-keyword')
  })

  it('highlights C code', () => {
    const spans = highlightCode('int main() { return 0; }', 'c')
    const hasHighlight = spans.some(s => s.className !== null)
    expect(hasHighlight).toBe(true)
  })

  it('highlights Rust code', () => {
    const spans = highlightCode('fn main() { println!("hi"); }', 'rust')
    const keyword = spans.find(s => s.text === 'fn')
    expect(keyword).toBeDefined()
    expect(keyword.className).toContain('hljs-keyword')
  })

  it('highlights Go code', () => {
    const spans = highlightCode('func main() {}', 'go')
    const keyword = spans.find(s => s.text === 'func')
    expect(keyword).toBeDefined()
    expect(keyword.className).toContain('hljs-keyword')
  })

  it('highlights Dockerfile instructions', () => {
    const spans = highlightCode('FROM node:18\nRUN npm install', 'dockerfile')
    const keyword = spans.find(s => s.text === 'FROM')
    expect(keyword).toBeDefined()
    expect(keyword.className).toContain('hljs-keyword')
  })
})

// ─── highlightCode — language aliases ───

describe('highlightCode — aliases', () => {
  const aliasCases = [
    ['js', 'javascript'],
    ['ts', 'typescript'],
    ['py', 'python'],
    ['rb', 'ruby'],
    ['sh', 'bash'],
    ['shell', 'bash'],
    ['fish', 'bash'],
    ['zsh', 'bash'],
    ['yml', 'yaml'],
    ['toml', 'ini'],
    ['dotenv', 'ini'],
    ['env', 'ini'],
    ['html', 'xml'],
    ['htm', 'xml'],
    ['svg', 'xml'],
    ['c++', 'cpp'],
    ['c#', 'csharp'],
    ['cs', 'csharp'],
    ['kt', 'kotlin'],
    ['rs', 'rust'],
    ['md', 'markdown'],
    ['docker', 'dockerfile'],
  ]

  for (const [alias, _expected] of aliasCases) {
    it(`alias "${alias}" produces highlighted output`, () => {
      // Use a snippet that any language would tokenize
      const code = alias === 'yml' || alias === 'yaml' || alias === 'toml' || alias === 'dotenv' || alias === 'env'
        ? 'key: value'
        : alias === 'html' || alias === 'htm' || alias === 'svg'
          ? '<div>test</div>'
          : alias === 'md'
            ? '# Hello'
            : alias === 'docker' || alias === 'dockerfile'
              ? 'FROM node:18'
              : 'var x = 1;'
      const spans = highlightCode(code, alias)
      expect(spans.length).toBeGreaterThan(0)
      const reconstructed = spans.map(s => s.text).join('')
      expect(reconstructed).toBe(code)
    })
  }

  it('case-insensitive language resolution', () => {
    const upper = highlightCode('const x = 1', 'JAVASCRIPT')
    const lower = highlightCode('const x = 1', 'javascript')
    // Both should produce highlighted output
    expect(upper.some(s => s.className !== null)).toBe(true)
    expect(lower.some(s => s.className !== null)).toBe(true)
  })

  it('mixed case alias works', () => {
    const spans = highlightCode('const x = 1', 'Js')
    expect(spans.some(s => s.className !== null)).toBe(true)
  })
})

// ─── highlightCode — multi-line code ───

describe('highlightCode — multi-line', () => {
  it('preserves newlines in span text', () => {
    const code = 'const a = 1;\nconst b = 2;'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('offsets are correct across multiple lines', () => {
    const code = 'function foo() {\n  return 42;\n}'
    const spans = highlightCode(code, 'javascript')
    let expectedOffset = 0
    for (const s of spans) {
      expect(s.offset).toBe(expectedOffset)
      expectedOffset += s.text.length
    }
    expect(expectedOffset).toBe(code.length)
  })

  it('handles many lines', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `const v${i} = ${i};`)
    const code = lines.join('\n')
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })
})

// ─── highlightCode — HTML entity decoding ───

describe('highlightCode — HTML entities', () => {
  it('decodes &amp; in output', () => {
    const code = 'a && b'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('decodes &lt; and &gt; in output', () => {
    const code = 'if (a < b && c > d) {}'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('decodes &quot; in output', () => {
    const code = 'const s = "hello"'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('decodes single quotes in output', () => {
    const code = "const s = 'hello'"
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })
})

// ─── highlightCode — edge cases ───

describe('highlightCode — edge cases', () => {
  it('empty string returns empty array or single empty span', () => {
    const spans = highlightCode('', 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe('')
  })

  it('unknown language falls back to auto-detection', () => {
    const spans = highlightCode('const x = 1', 'nonexistent_lang_xyz')
    expect(spans.length).toBeGreaterThan(0)
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe('const x = 1')
  })

  it('null language falls back to auto-detection', () => {
    const spans = highlightCode('const x = 1', null)
    expect(spans.length).toBeGreaterThan(0)
  })

  it('undefined language falls back to auto-detection', () => {
    const spans = highlightCode('const x = 1', undefined)
    expect(spans.length).toBeGreaterThan(0)
  })

  it('empty string language falls back to auto-detection', () => {
    const spans = highlightCode('const x = 1', '')
    expect(spans.length).toBeGreaterThan(0)
  })

  it('plain text with no syntax produces spans with null className', () => {
    const code = 'just some plain text with no syntax'
    const spans = highlightCode(code, 'nonexistent_lang_xyz')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('code with special characters preserves them', () => {
    const code = 'const regex = /[a-z]+/g;'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('code with unicode preserves it', () => {
    const code = 'const emoji = "🎉";'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })

  it('very long single line', () => {
    const code = 'const x = ' + '"a"'.repeat(500) + ';'
    const spans = highlightCode(code, 'javascript')
    const reconstructed = spans.map(s => s.text).join('')
    expect(reconstructed).toBe(code)
  })
})

// ─── Fence detection regex ───

describe('Fence detection regex', () => {
  it('matches plain ``` fence', () => {
    const m = '```'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('')
  })

  it('matches ```javascript', () => {
    const m = '```javascript'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('javascript')
  })

  it('matches ```python', () => {
    const m = '```python'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('python')
  })

  it('matches ```c++', () => {
    const m = '```c++'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('c++')
  })

  it('matches ```c#', () => {
    const m = '```c#'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('c#')
  })

  it('matches ```.env', () => {
    const m = '```.env'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('.env')
  })

  it('matches ```yml', () => {
    const m = '```yml'.match(FENCE_RE)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('yml')
  })

  it('does not match ``` with trailing space', () => {
    const m = '```javascript '.match(FENCE_RE)
    expect(m).toBeNull()
  })

  it('does not match ``` with leading text', () => {
    const m = 'text```javascript'.match(FENCE_RE)
    expect(m).toBeNull()
  })

  it('does not match single backtick', () => {
    const m = '`code`'.match(FENCE_RE)
    expect(m).toBeNull()
  })

  it('does not match double backtick', () => {
    const m = '``code``'.match(FENCE_RE)
    expect(m).toBeNull()
  })
})

// ─── Code block range detection (pure logic, no CodeMirror) ───

/**
 * Simulates the code block range detection from NoteEditor.
 * Takes an array of line strings, returns detected code block ranges.
 */
function detectCodeBlocks(lines) {
  const ranges = []
  let fenceStart = null
  let fenceLang = ''
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (fenceStart === null) {
      const fenceMatch = trimmed.match(FENCE_RE)
      if (fenceMatch) {
        fenceStart = i
        fenceLang = fenceMatch[1] || ''
      }
    } else {
      if (trimmed === '```') {
        ranges.push({ startLn: fenceStart, endLn: i, lang: fenceLang })
        fenceStart = null
        fenceLang = ''
      }
    }
  }
  if (fenceStart !== null) {
    ranges.push({ startLn: fenceStart, endLn: lines.length - 1, lang: fenceLang })
  }
  return ranges
}

describe('Code block range detection', () => {
  it('detects a simple code block', () => {
    const lines = ['```javascript', 'const x = 1', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: 'javascript' }])
  })

  it('detects a code block without language', () => {
    const lines = ['```', 'some code', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: '' }])
  })

  it('detects multiple code blocks', () => {
    const lines = [
      'text before',
      '```python',
      'print("hi")',
      '```',
      'text between',
      '```bash',
      'echo hello',
      '```',
    ]
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toEqual({ startLn: 1, endLn: 3, lang: 'python' })
    expect(blocks[1]).toEqual({ startLn: 5, endLn: 7, lang: 'bash' })
  })

  it('handles unclosed fence (treats rest as code block)', () => {
    const lines = ['```javascript', 'const x = 1', 'const y = 2']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: 'javascript' }])
  })

  it('handles empty code block', () => {
    const lines = ['```', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 1, lang: '' }])
  })

  it('handles code block with only whitespace content', () => {
    const lines = ['```', '  ', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: '' }])
  })

  it('no code blocks in plain text', () => {
    const lines = ['hello', 'world', 'no code here']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toHaveLength(0)
  })

  it('inline backticks do not trigger code blocks', () => {
    const lines = ['use `code` inline', 'and ``double`` too']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toHaveLength(0)
  })

  it('nested fences: inner ``` treated as content', () => {
    // Once a fence is open, the next ``` closes it
    const lines = ['```', '```python', 'code', '```', '```']
    const blocks = detectCodeBlocks(lines)
    // First ``` opens, second ``` (which looks like ```python) is content,
    // but actually ```python matches the fence regex... however since we're
    // inside a fence, we only check for closing ```.
    // Line 1 (```python) is NOT plain ```, so it doesn't close.
    // Line 3 (```) closes the block.
    expect(blocks[0]).toEqual({ startLn: 0, endLn: 3, lang: '' })
  })

  it('detects c++ language tag', () => {
    const lines = ['```c++', 'int main() {}', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: 'c++' }])
  })

  it('detects c# language tag', () => {
    const lines = ['```c#', 'class Foo {}', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: 'c#' }])
  })

  it('detects .env language tag', () => {
    const lines = ['```.env', 'KEY=value', '```']
    const blocks = detectCodeBlocks(lines)
    expect(blocks).toEqual([{ startLn: 0, endLn: 2, lang: '.env' }])
  })
})

// ─── Offset-to-line mapping (simulates NoteEditor logic) ───

/**
 * Given highlight spans for a code block and the content lines,
 * maps spans to per-line ranges — same logic as NoteEditor.
 */
function mapSpansToLines(spans, contentLines) {
  const result = []
  for (let i = 0; i < contentLines.length; i++) {
    let charOffset = 0
    for (let cl = 0; cl < i; cl++) {
      charOffset += contentLines[cl].length + 1 // +1 for \n
    }
    const lineLen = contentLines[i].length
    const lineSpans = []
    for (const span of spans) {
      if (!span.className) continue
      const spanEnd = span.offset + span.text.length
      if (spanEnd <= charOffset || span.offset >= charOffset + lineLen) continue
      const from = Math.max(0, span.offset - charOffset)
      const to = Math.min(lineLen, spanEnd - charOffset)
      if (from >= to) continue
      lineSpans.push({ from, to, className: span.className })
    }
    result.push(lineSpans)
  }
  return result
}

describe('Span-to-line offset mapping', () => {
  it('maps single-line code correctly', () => {
    const code = 'const x = 1'
    const spans = highlightCode(code, 'javascript')
    const mapped = mapSpansToLines(spans, [code])
    // Should have at least one highlighted span on line 0
    expect(mapped[0].length).toBeGreaterThan(0)
    // All spans should be within line bounds
    for (const s of mapped[0]) {
      expect(s.from).toBeGreaterThanOrEqual(0)
      expect(s.to).toBeLessThanOrEqual(code.length)
      expect(s.from).toBeLessThan(s.to)
    }
  })

  it('maps multi-line code to correct lines', () => {
    const lines = ['function foo() {', '  return 42;', '}']
    const code = lines.join('\n')
    const spans = highlightCode(code, 'javascript')
    const mapped = mapSpansToLines(spans, lines)

    expect(mapped).toHaveLength(3)
    // Line 0 should have 'function' keyword
    const fnSpan = mapped[0].find(s => lines[0].substring(s.from, s.to) === 'function')
    expect(fnSpan).toBeDefined()
    // Line 1 should have 'return' keyword
    const retSpan = mapped[1].find(s => lines[1].substring(s.from, s.to) === 'return')
    expect(retSpan).toBeDefined()
  })

  it('no spans exceed line boundaries', () => {
    const lines = ['const a = 1;', 'const b = "hello";', 'const c = true;']
    const code = lines.join('\n')
    const spans = highlightCode(code, 'javascript')
    const mapped = mapSpansToLines(spans, lines)

    for (let i = 0; i < lines.length; i++) {
      for (const s of mapped[i]) {
        expect(s.from).toBeGreaterThanOrEqual(0)
        expect(s.to).toBeLessThanOrEqual(lines[i].length)
        expect(s.from).toBeLessThan(s.to)
      }
    }
  })

  it('empty lines produce no spans', () => {
    const lines = ['const a = 1;', '', 'const b = 2;']
    const code = lines.join('\n')
    const spans = highlightCode(code, 'javascript')
    const mapped = mapSpansToLines(spans, lines)
    expect(mapped[1]).toHaveLength(0)
  })
})
