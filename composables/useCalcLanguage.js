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

// ── Light theme ──────────────────────────────────────────────────────
const lightHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#2451ed', fontWeight: 'bold' },
  { tag: t.comment, color: '#71717a', fontStyle: 'italic' },
  { tag: t.labelName, color: '#1c3eda', fontWeight: 'bold' },
  { tag: t.keyword, color: '#2451ed', fontWeight: 'bold' },
  { tag: t.operatorKeyword, color: '#7c3aed' },
  { tag: t.typeName, color: '#b45309' },
  { tag: t.definition(t.name), color: '#0369a1' },
  { tag: t.atom, color: '#7c3aed' },
  { tag: t.unit, color: '#059669' },
  { tag: t.number, color: '#059669' },
  { tag: t.variableName, color: '#18181b' },
  { tag: t.operator, color: '#52525b' },
  { tag: t.bracket, color: '#71717a' },
])

const darkHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#90baff', fontWeight: 'bold' },
  { tag: t.comment, color: '#63636e', fontStyle: 'italic' },
  { tag: t.labelName, color: '#bdd4ff', fontWeight: 'bold' },
  { tag: t.keyword, color: '#90baff', fontWeight: 'bold' },
  { tag: t.operatorKeyword, color: '#c4b5fd' },
  { tag: t.typeName, color: '#fbbf24' },
  { tag: t.definition(t.name), color: '#67e8f9' },
  { tag: t.atom, color: '#c4b5fd' },
  { tag: t.unit, color: '#6ee7b7' },
  { tag: t.number, color: '#6ee7b7' },
  { tag: t.variableName, color: '#e4e4e7' },
  { tag: t.operator, color: '#a1a1aa' },
  { tag: t.bracket, color: '#71717a' },
])

// ── Light editor chrome ──────────────────────────────────────────────
const lightEditorTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#18181b' },
  '.cm-gutters': { backgroundColor: '#fafafa', borderRight: '1px solid #e4e4e7' },
  '.cm-lineNumbers .cm-gutterElement': { color: '#a1a1aa' },
  '.cm-activeLineGutter .cm-gutterElement': { color: '#52525b' },
  '.cm-activeLine': { backgroundColor: '#f4f4f5' },
  '.cm-cursor': { borderLeftColor: '#2451ed' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#dae6ff' },
  '.cm-selectionMatch': { backgroundColor: '#dae6ff80' },
  '.cm-matchingBracket': { backgroundColor: '#bdd4ff', color: '#1c3eda' },
}, { dark: false })

// ── Dark editor chrome ───────────────────────────────────────────────
const darkEditorTheme = EditorView.theme({
  '&': { backgroundColor: '#161618', color: '#e4e4e7' },
  '.cm-gutters': { backgroundColor: '#161618', borderRight: '1px solid #27272a' },
  '.cm-lineNumbers .cm-gutterElement': { color: '#52525b' },
  '.cm-activeLineGutter .cm-gutterElement': { color: '#a1a1aa' },
  '.cm-activeLine': { backgroundColor: '#1c1c1f' },
  '.cm-cursor': { borderLeftColor: '#5c94ff' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#1e318b50' },
  '.cm-selectionMatch': { backgroundColor: '#1e318b40' },
  '.cm-matchingBracket': { backgroundColor: '#1e318b', color: '#90baff' },
}, { dark: true })

export const calcnotesLightTheme = [lightEditorTheme, syntaxHighlighting(lightHighlight)]
export const calcnotesDarkTheme = [darkEditorTheme, syntaxHighlighting(darkHighlight)]
