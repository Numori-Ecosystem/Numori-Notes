// CodeMirror 6 language definition for CalcNotes
import { StreamLanguage } from '@codemirror/language'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

// StreamLanguage tokenizer — mirrors the old Monarch grammar.
const calcnotesStreamParser = {
  startState() { return {} },
  token(stream) {
    if (stream.sol()) {
      if (stream.match(/^#.*$/)) return 'heading'
      if (stream.match(/^\/\/.*$/)) return 'comment'
      if (stream.match(/^[^:\n]+:/)) return 'labelName'
    }

    if (stream.eatSpace()) return null

    if (stream.match(/\b(now|time|today|yesterday|tomorrow)\b/)) return 'typeName'
    if (stream.match(/\b(next|last)\s+(week|month|year)\b/)) return 'typeName'

    if (stream.match(/\b(sum|total|average|avg|prev)\b/)) return 'keyword'

    if (stream.match(/\b(in|to|as|into|of|on|off)\b/)) return 'operatorKeyword'

    if (stream.match(/\b(plus|minus|times|divide|mod|and|with|without)\b/)) return 'operator'

    if (stream.match(/\b(sqrt|cbrt|abs|log|ln|fact|round|ceil|floor|sin|cos|tan|fromunix)\s*\(/)) return 'name.definition'

    if (stream.match(/\b(pi|tau|phi)\b/)) return 'atom'
    if (stream.match(/\bc\b/)) return 'atom'
    if (stream.match(/\be\b/)) return 'atom'

    if (stream.match(/[$€£¥₹₽]/)) return 'unit'
    if (stream.match(/\b(USD|EUR|GBP|JPY|INR|RUB|CAD|AUD|CHF|CNY)\b/i)) return 'unit'

    if (stream.match(/\d+\.?\d*\s*%/)) return 'unit'
    if (stream.match(/\d+\.?\d*\s*(km|m|cm|mm|ft|inch|in|yd|mi|kg|g|mg|lb|oz|l|ml|gal|qt|pt|sec|min|hour|day|week|month|year|KB|MB|GB|TB|px|pt|em|rem)\b/)) return 'number'
    if (stream.match(/\d+\.?\d*/)) return 'number'

    if (stream.match(/[+\-*\/^%]/)) return 'operator'
    if (stream.match(/[=<>!&|]/)) return 'operator'

    if (stream.match(/[()]/)) return 'bracket'

    if (stream.match(/\b[a-zA-Z_]\w*\b/)) return 'variableName'

    stream.next()
    return null
  },
}

export const calcnotesLanguage = StreamLanguage.define(calcnotesStreamParser)

// ─── Palette ────────────────────────────────────────────────────────
// Dark                              Light (inverted for paper feel)
// bg:        #2D2A2E                bg:        #FCFCFA
// fg:        #FCFCFA                fg:        #2D2A2E
// keyword:   #FF6188                keyword:   #CC2D56
// argument:  #FC9867                argument:  #C4621A
// string:    #FFD866                string:    #A68A1B
// function:  #A9DC76                function:  #4D8C2A
// class:     #78DCE8                class:     #1A8A9A
// constant:  #AB9DF2                constant:  #7B5FC4
// dimmed 1:  #C1C0C0                dimmed 1:  #939293
// dimmed 2:  #939293                dimmed 2:  #727072
// dimmed 3:  #727072                dimmed 3:  #5B595C
// dimmed 4:  #5B595C                dimmed 4:  #403E41
// dimmed 5:  #403E41                dimmed 5:  #C1C0C0
// bg dim 1:  #221F22                bg dim 1:  #F5F4F2
// bg dim 2:  #19181A                bg dim 2:  #ECEAE8

// ─────────────────────────────────────────────────────────────────────
// Light theme — warm paper feel, muted accent colours for readability
// ─────────────────────────────────────────────────────────────────────
const lightHighlight = HighlightStyle.define([
  // Structure
  { tag: t.heading,                color: '#2D2A2E', fontWeight: '700' },
  { tag: t.comment,                color: '#939293', fontStyle: 'italic' },
  { tag: t.labelName,              color: '#727072', fontWeight: '600' },

  // Aggregation keywords: sum, total, avg, prev
  { tag: t.keyword,                color: '#CC2D56', fontWeight: '600' },

  // Conversion glue words: in, to, as, of, on, off
  { tag: t.operatorKeyword,        color: '#939293' },

  // Date/time: now, today, tomorrow, yesterday, next/last week…
  { tag: t.typeName,               color: '#1A8A9A' },

  // Functions: sqrt(), round(), sin()…
  { tag: t.definition(t.name),     color: '#4D8C2A' },

  // Constants: pi, e, tau, phi
  { tag: t.atom,                   color: '#7B5FC4' },

  // Currency symbols/codes & percentages
  { tag: t.unit,                   color: '#C4621A' },

  // Plain numbers & numbers with units
  { tag: t.number,                 color: '#A68A1B' },

  // Variables / identifiers
  { tag: t.variableName,           color: '#2D2A2E' },

  // Operators: + - * / ^ = and word operators
  { tag: t.operator,               color: '#C1C0C0' },

  // Brackets
  { tag: t.bracket,                color: '#C1C0C0' },
])

// ─────────────────────────────────────────────────────────────────────
// Dark theme — rich warm tones on a deep charcoal background
// ─────────────────────────────────────────────────────────────────────
const darkHighlight = HighlightStyle.define([
  // Structure
  { tag: t.heading,                color: '#FCFCFA', fontWeight: '700' },
  { tag: t.comment,                color: '#727072', fontStyle: 'italic' },
  { tag: t.labelName,              color: '#C1C0C0', fontWeight: '600' },

  // Aggregation keywords
  { tag: t.keyword,                color: '#FF6188', fontWeight: '600' },

  // Conversion glue words
  { tag: t.operatorKeyword,        color: '#727072' },

  // Date/time
  { tag: t.typeName,               color: '#78DCE8' },

  // Functions
  { tag: t.definition(t.name),     color: '#A9DC76' },

  // Constants
  { tag: t.atom,                   color: '#AB9DF2' },

  // Currency & percentages
  { tag: t.unit,                   color: '#FC9867' },

  // Numbers
  { tag: t.number,                 color: '#FFD866' },

  // Variables
  { tag: t.variableName,           color: '#FCFCFA' },

  // Operators
  { tag: t.operator,               color: '#5B595C' },

  // Brackets
  { tag: t.bracket,                color: '#5B595C' },
])

// ─────────────────────────────────────────────────────────────────────
// Light editor chrome
// ─────────────────────────────────────────────────────────────────────
const lightEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#FCFCFA',
    color: '#2D2A2E',
  },
  '.cm-gutters': {
    backgroundColor: '#F5F4F2',
    borderRight: '1px solid #ECEAE8',
  },
  '.cm-lineNumbers .cm-gutterElement': { color: '#C1C0C0' },
  '.cm-activeLineGutter .cm-gutterElement': { color: '#727072' },
  '.cm-activeLine': { backgroundColor: '#F5F4F280' },
  '.cm-cursor': { borderLeftColor: '#2D2A2E' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#CC2D5625',
  },
  '.cm-selectionMatch': { backgroundColor: '#CC2D5615' },
  '.cm-matchingBracket': { backgroundColor: '#A9DC7640', color: '#4D8C2A', outline: 'none' },
  '.cm-searchMatch': { backgroundColor: '#FFD86640', outline: '1px solid #A68A1B' },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: '#FFD86660' },
  '.cm-placeholder': { color: '#C1C0C0', fontStyle: 'italic' },
}, { dark: false })

// ─────────────────────────────────────────────────────────────────────
// Dark editor chrome
// ─────────────────────────────────────────────────────────────────────
const darkEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#2D2A2E',
    color: '#FCFCFA',
  },
  '.cm-gutters': {
    backgroundColor: '#2D2A2E',
    borderRight: '1px solid #403E41',
  },
  '.cm-lineNumbers .cm-gutterElement': { color: '#5B595C' },
  '.cm-activeLineGutter .cm-gutterElement': { color: '#939293' },
  '.cm-activeLine': { backgroundColor: '#403E4180' },
  '.cm-cursor': { borderLeftColor: '#FCFCFA' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#FF618830',
  },
  '.cm-selectionMatch': { backgroundColor: '#FF618818' },
  '.cm-matchingBracket': { backgroundColor: '#AB9DF240', color: '#AB9DF2', outline: 'none' },
  '.cm-searchMatch': { backgroundColor: '#FFD86630', outline: '1px solid #FFD866' },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: '#FFD86650' },
  '.cm-placeholder': { color: '#5B595C', fontStyle: 'italic' },
}, { dark: true })

export const calcnotesLightTheme = [lightEditorTheme, syntaxHighlighting(lightHighlight)]
export const calcnotesDarkTheme = [darkEditorTheme, syntaxHighlighting(darkHighlight)]
