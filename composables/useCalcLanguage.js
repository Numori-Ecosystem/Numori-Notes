// CodeMirror 6 language definition for CalcNotes
import { StreamLanguage } from '@codemirror/language'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

// StreamLanguage tokenizer — mirrors the old Monarch grammar.
// Token names must be valid @lezer/highlight tag names or dot-separated
// modifier chains (e.g. "name.function").  See createTokenType in
// @codemirror/language for the lookup logic.
const calcnotesStreamParser = {
  startState() { return {} },
  token(stream) {
    // Start of line checks
    if (stream.sol()) {
      if (stream.match(/^#.*$/)) return 'heading'
      if (stream.match(/^\/\/.*$/)) return 'comment'
      if (stream.match(/^[^:\n]+:/)) return 'labelName'
    }

    // Skip whitespace
    if (stream.eatSpace()) return null

    // Date/time keywords → typeName (distinct from regular keyword)
    if (stream.match(/\b(now|time|today|yesterday|tomorrow)\b/)) return 'typeName'
    if (stream.match(/\b(next|last)\s+(week|month|year)\b/)) return 'typeName'

    // Special keywords
    if (stream.match(/\b(sum|total|average|avg|prev)\b/)) return 'keyword'

    // Conversion keywords → operatorKeyword
    if (stream.match(/\b(in|to|as|into|of|on|off)\b/)) return 'operatorKeyword'

    // Word operators
    if (stream.match(/\b(plus|minus|times|divide|mod|and|with|without)\b/)) return 'operator'

    // Functions with parentheses → "name definition" (function modifier)
    if (stream.match(/\b(sqrt|cbrt|abs|log|ln|fact|round|ceil|floor|sin|cos|tan|fromunix)\s*\(/)) return 'name.definition'

    // Constants → atom
    if (stream.match(/\b(pi|tau|phi)\b/)) return 'atom'
    if (stream.match(/\bc\b/)) return 'atom'
    if (stream.match(/\be\b/)) return 'atom'

    // Currency symbols → unit
    if (stream.match(/[$€£¥₹₽]/)) return 'unit'

    // Currency codes
    if (stream.match(/\b(USD|EUR|GBP|JPY|INR|RUB|CAD|AUD|CHF|CNY)\b/i)) return 'unit'

    // Percentages (before plain numbers)
    if (stream.match(/\d+\.?\d*\s*%/)) return 'unit'

    // Numbers with units
    if (stream.match(/\d+\.?\d*\s*(km|m|cm|mm|ft|inch|in|yd|mi|kg|g|mg|lb|oz|l|ml|gal|qt|pt|sec|min|hour|day|week|month|year|KB|MB|GB|TB|px|pt|em|rem)\b/)) return 'number'

    // Plain numbers
    if (stream.match(/\d+\.?\d*/)) return 'number'

    // Symbol operators
    if (stream.match(/[+\-*\/^%]/)) return 'operator'
    if (stream.match(/[=<>!&|]/)) return 'operator'

    // Parentheses
    if (stream.match(/[()]/)) return 'bracket'

    // Variables (identifiers)
    if (stream.match(/\b[a-zA-Z_]\w*\b/)) return 'variableName'

    // Advance past anything else
    stream.next()
    return null
  },
}

export const calcnotesLanguage = StreamLanguage.define(calcnotesStreamParser)

// Light theme highlight style
const lightHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#0000ff', fontWeight: 'bold' },
  { tag: t.comment, color: '#008000', fontStyle: 'italic' },
  { tag: t.labelName, color: '#001080', fontWeight: 'bold' },
  { tag: t.keyword, color: '#0000ff', fontWeight: 'bold' },
  { tag: t.operatorKeyword, color: '#0000ff' },           // conversion: in, to, as…
  { tag: t.typeName, color: '#a31515' },                   // date/time: now, today…
  { tag: t.definition(t.name), color: '#795e26' },         // functions: sqrt, abs…
  { tag: t.atom, color: '#0070c1' },                       // constants: pi, e…
  { tag: t.unit, color: '#098658' },                       // currencies, percentages
  { tag: t.number, color: '#098658' },
  { tag: t.variableName, color: '#001080' },
  { tag: t.operator, color: '#000000' },
  { tag: t.bracket, color: '#000000' },
])

// Dark theme highlight style
const darkHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#569cd6', fontWeight: 'bold' },
  { tag: t.comment, color: '#6a9955', fontStyle: 'italic' },
  { tag: t.labelName, color: '#9cdcfe', fontWeight: 'bold' },
  { tag: t.keyword, color: '#569cd6', fontWeight: 'bold' },
  { tag: t.operatorKeyword, color: '#569cd6' },
  { tag: t.typeName, color: '#ce9178' },
  { tag: t.definition(t.name), color: '#dcdcaa' },
  { tag: t.atom, color: '#4fc1ff' },
  { tag: t.unit, color: '#b5cea8' },
  { tag: t.number, color: '#b5cea8' },
  { tag: t.variableName, color: '#9cdcfe' },
  { tag: t.operator, color: '#d4d4d4' },
  { tag: t.bracket, color: '#ffd700' },
])

// Light editor theme (chrome colors)
const lightEditorTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#000000' },
  '.cm-gutters': { backgroundColor: '#ffffff', borderRight: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { color: '#237893' },
  '.cm-activeLineGutter .cm-gutterElement': { color: '#0b216f' },
  '.cm-activeLine': { backgroundColor: '#f0f0f0' },
  '.cm-cursor': { borderLeftColor: '#000000' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#add6ff' },
}, { dark: false })

// Dark editor theme (chrome colors)
const darkEditorTheme = EditorView.theme({
  '&': { backgroundColor: '#1e1e1e', color: '#d4d4d4' },
  '.cm-gutters': { backgroundColor: '#1e1e1e', borderRight: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { color: '#858585' },
  '.cm-activeLineGutter .cm-gutterElement': { color: '#c6c6c6' },
  '.cm-activeLine': { backgroundColor: '#282828' },
  '.cm-cursor': { borderLeftColor: '#aeafad' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#264f78' },
}, { dark: true })

export const calcnotesLightTheme = [lightEditorTheme, syntaxHighlighting(lightHighlight)]
export const calcnotesDarkTheme = [darkEditorTheme, syntaxHighlighting(darkHighlight)]
