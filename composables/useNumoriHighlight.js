import { numoriStreamParser } from '~/composables/useNumoriLanguage'

/**
 * Tokenize a single line of numori code into highlighted spans.
 * Returns an array of { text, token } objects where token is the
 * stream parser token type (or null for plain text).
 */
export function tokenizeLine(line) {
  const spans = []
  const state = numoriStreamParser.startState()

  // Minimal StringStream implementation matching CodeMirror's interface
  let pos = 0
  const stream = {
    pos: 0,
    start: 0,
    string: line,
    sol() {
      return this.pos === 0
    },
    eol() {
      return this.pos >= line.length
    },
    peek() {
      return line.charAt(this.pos) || undefined
    },
    next() {
      if (this.pos < line.length) return line.charAt(this.pos++)
    },
    eat(match) {
      const ch = line.charAt(this.pos)
      if (typeof match === 'string') {
        if (ch === match) {
          this.pos++
          return ch
        }
      } else if (match instanceof RegExp) {
        if (match.test(ch)) {
          this.pos++
          return ch
        }
      } else if (typeof match === 'function') {
        if (match(ch)) {
          this.pos++
          return ch
        }
      }
      return undefined
    },
    eatWhile(match) {
      const start = this.pos
      while (this.pos < line.length) {
        if (!this.eat(match)) break
      }
      return this.pos > start
    },
    eatSpace() {
      const start = this.pos
      while (this.pos < line.length && /\s/.test(line.charAt(this.pos))) this.pos++
      return this.pos > start
    },
    skipToEnd() {
      this.pos = line.length
    },
    match(pattern, consume) {
      if (consume === undefined) consume = true
      if (typeof pattern === 'string') {
        if (line.slice(this.pos, this.pos + pattern.length) === pattern) {
          if (consume) this.pos += pattern.length
          return true
        }
        return false
      }
      const match = line.slice(this.pos).match(pattern)
      if (match && match.index === 0) {
        if (consume) this.pos += match[0].length
        return match
      }
      return null
    },
    current() {
      return line.slice(this.start, this.pos)
    },
    column() {
      return this.pos
    },
  }

  while (!stream.eol()) {
    stream.start = stream.pos
    const token = numoriStreamParser.token(stream, state)
    const text = stream.current()
    if (text) {
      spans.push({ text, token })
    }
    // Safety: if pos didn't advance, skip a char
    if (stream.pos === pos) {
      spans.push({ text: line.charAt(stream.pos), token: null })
      stream.pos++
    }
    pos = stream.pos
  }

  return spans
}

/**
 * Map a numori token type to CSS classes for light/dark mode.
 * Returns a class string.
 */
export function tokenToClasses(token) {
  switch (token) {
    case 'heading':
      return 'numori-heading'
    case 'comment':
      return 'numori-comment'
    case 'labelName':
      return 'numori-label'
    case 'keyword':
      return 'numori-keyword'
    case 'operatorKeyword':
      return 'numori-opkeyword'
    case 'typeName':
      return 'numori-typename'
    case 'name.definition':
      return 'numori-function'
    case 'atom':
      return 'numori-atom'
    case 'unit':
      return 'numori-unit'
    case 'number':
      return 'numori-number'
    case 'string':
      return 'numori-string'
    case 'variableName':
      return 'numori-variable'
    case 'operator':
      return 'numori-operator'
    case 'bracket':
      return 'numori-bracket'
    default:
      return ''
  }
}
