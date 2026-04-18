<template>
  <div class="h-full flex">
    <div
:class="[
      'flex-1 overflow-hidden transition-all duration-200 ease-in-out relative',
      bordered ? 'border border-gray-200 dark:border-gray-700 rounded-lg' : ''
    ]">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="!editorReady" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-925 text-gray-400 dark:text-gray-500">
          <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="text-sm">Loading editor…</span>
        </div>
      </Transition>
      <ClientOnly>
        <template #fallback>
          <div class="h-full flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
            <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm">Loading editor…</span>
          </div>
        </template>
        <NuxtCodeMirror
          ref="editorRef"
          v-model="localContent"
          :extensions="cmExtensions"
          :theme="cmThemeMode"
          :basic-setup="cmBasicSetup"
          :editable="props.editable"
          height="100%"
          class="h-full"
          :placeholder="placeholder"
          @on-create-editor="onEditorCreate"
        />
      </ClientOnly>

      <!-- Link action popup -->
      <UiPopup
:show="linkPopup.show" :x="linkPopup.x" :y="linkPopup.y" :offset-y="20"
        @close="closeLinkPopup">
        <div v-if="linkPopup.isExternal" class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Icon name="mdi:alert-outline" class="w-3.5 h-3.5 block flex-shrink-0" />
          <span>Be careful, external link</span>
        </div>
        <UiButton variant="menu-item" @click="openLink">
          <Icon name="mdi:open-in-new" class="w-4 h-4 block flex-shrink-0" />
          <span>Open Link</span>
        </UiButton>
        <UiButton variant="menu-item" @click="copyLinkUrl">
          <Icon name="mdi:content-copy" class="w-4 h-4 block flex-shrink-0" />
          <span>Copy Link</span>
        </UiButton>
        <UiButton variant="menu-item" @click="copyLinkName">
          <Icon name="mdi:format-text" class="w-4 h-4 block flex-shrink-0" />
          <span>Copy Link Name</span>
        </UiButton>
        <div class="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 truncate border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
          {{ linkPopup.url }}
        </div>
      </UiPopup>
    </div>
  </div>
</template>

<script setup>
import { EditorView, Decoration, WidgetType, keymap as cmKeymap, scrollPastEnd, lineNumbers as cmLineNumbers, highlightActiveLine as cmHighlightActiveLine, highlightActiveLineGutter as cmHighlightActiveLineGutter } from '@codemirror/view'
import { StateField, StateEffect, Compartment, EditorSelection } from '@codemirror/state'
import { foldGutter as cmFoldGutter, indentUnit } from '@codemirror/language'
import { closeBrackets as cmCloseBrackets } from '@codemirror/autocomplete'
import { undo as cmUndo, redo as cmRedo, undoDepth, redoDepth } from '@codemirror/commands'
import { numoriLanguage, numoriLightTheme, numoriDarkTheme } from '~/composables/useNumoriLanguage'
import { formatDisplay } from '~/composables/useDisplayFormatter'
import { highlightCode } from '~/composables/useCodeHighlight'

const props = defineProps({
  content: { type: String, default: '' },
  placeholder: { type: String, default: 'Start typing... (e.g., 10 + 20)' },
  showResults: { type: Boolean, default: false },
  showInline: { type: Boolean, default: true },
  inlineAlign: { type: String, default: null },
  bordered: { type: Boolean, default: false },
  localePreferences: { type: Object, default: null },
  markdownMode: { type: String, default: 'full' },
  shortcutHandlers: { type: Object, default: null },
  editable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:content'])

const displayLines = ref([])
const rawLines = ref([])
const currentLine = ref(0)
const lineHeight = computed(() => props.localePreferences?.editorLineHeight ?? 19)
const localContent = ref(props.content)
const editorRef = ref(null)
const editorReady = ref(false)
let editorView = null
let inlineStylesInjected = false
const canUndo = ref(false)
const canRedo = ref(false)

const updateUndoRedoState = () => {
  if (!editorView) { canUndo.value = false; canRedo.value = false; return }
  canUndo.value = undoDepth(editorView.state) > 0
  canRedo.value = redoDepth(editorView.state) > 0
}

const { evaluateLines } = useCalculator()
const colorMode = useColorMode()

// --- Compartments for dynamic reconfiguration ---
const themeCompartment = new Compartment()
const fontThemeCompartment = new Compartment()
const scrollPastEndCompartment = new Compartment()
const lineNumbersCompartment = new Compartment()
const foldGutterCompartment = new Compartment()
const activeLineCompartment = new Compartment()
const activeLineGutterCompartment = new Compartment()
const closeBracketsCompartment = new Compartment()
const tabSizeCompartment = new Compartment()
const wordWrapCompartment = new Compartment()

// --- Font family map ---
const FONT_FAMILY_MAP = {
  'system': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  'fira-code': "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'jetbrains-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'source-code-pro': "'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'cascadia-code': "'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'ibm-plex-mono': "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
}

const editorFontSize = computed(() => props.localePreferences?.editorFontSize ?? 16)
const editorFontFamily = computed(() => FONT_FAMILY_MAP[props.localePreferences?.editorFontFamily] ?? FONT_FAMILY_MAP.system)
const editorLineNumbers = computed(() => {
  const val = props.localePreferences?.editorLineNumbers
  return ['on', 'off', 'relative', 'interval'].includes(val) ? val : 'on'
})
const editorCursorStyle = computed(() => {
  const val = props.localePreferences?.editorCursorStyle
  return ['line', 'line-thin'].includes(val) ? val : 'line'
})
const autoCopyResult = computed(() => props.localePreferences?.autoCopyResult !== false)

// --- Build font/cursor theme ---
const buildFontTheme = () => {
  const fontSize = editorFontSize.value
  const fontFamily = editorFontFamily.value
  const lh = lineHeight.value
  const ligatures = props.localePreferences?.editorLigatures ? 'normal' : 'none'
  const cursorWidth = editorCursorStyle.value.includes('thin') ? '1px' : '2px'

  return EditorView.theme({
    '.cm-content': {
      fontFamily,
      fontSize: `${fontSize}px`,
      lineHeight: `${lh}px`,
      fontVariantLigatures: ligatures,
    },
    '.cm-gutters': {
      fontFamily,
      fontSize: `${fontSize}px`,
      lineHeight: `${lh}px`,
    },
    '.cm-cursor': {
      borderLeftWidth: cursorWidth,
    },
    '.cm-line': {
      lineHeight: `${lh}px`,
    },
  })
}

// --- Inline result widget ---
class InlineResultWidget extends WidgetType {
  constructor(text, className, padText) {
    super()
    this.text = text
    this.className = className
    this.padText = padText
  }
  toDOM() {
    const wrapper = document.createElement('span')
    // Padding span
    const pad = document.createElement('span')
    pad.className = 'numori-inline-pad'
    pad.textContent = this.padText
    wrapper.appendChild(pad)
    // Result span
    const result = document.createElement('span')
    result.className = this.className
    result.textContent = this.text
    wrapper.appendChild(result)
    return wrapper
  }
  eq(other) {
    return this.text === other.text && this.className === other.className && this.padText === other.padText
  }
  ignoreEvent() { return false }
}

// --- Markdown preview widget (prefix replacement) ---
class MdPrefixWidget extends WidgetType {
  constructor(content, className, lineNumber) {
    super()
    this.content = content
    this.className = className
    this.lineNumber = lineNumber ?? -1
  }
  toDOM() {
    const span = document.createElement('span')
    span.className = this.className
    span.textContent = this.content
    if (this.lineNumber >= 0) {
      span.dataset.line = String(this.lineNumber)
    }
    return span
  }
  eq(other) { return this.content === other.content && this.className === other.className && this.lineNumber === other.lineNumber }
  ignoreEvent() { return false }
}

// --- StateEffect for updating inline results ---
const setInlineResults = StateEffect.define()
const setMdDecorations = StateEffect.define()

// StateField for inline result decorations
const inlineResultField = StateField.define({
  create() { return Decoration.none },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setInlineResults)) return e.value
    }
    return decos.map(tr.changes)
  },
  provide: f => EditorView.decorations.from(f),
})

// StateField for markdown preview decorations
const mdPreviewField = StateField.define({
  create() { return Decoration.none },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setMdDecorations)) return e.value
    }
    return decos.map(tr.changes)
  },
  provide: f => EditorView.decorations.from(f),
})

// --- Build inline result decorations ---
const buildInlineDecorations = (view) => {
  if (!props.showInline) return Decoration.none
  const lines = displayLines.value
  if (!lines.length) return Decoration.none

  const doc = view.state.doc
  const docLines = doc.lines
  const maxLine = Math.min(lines.length, docLines)
  const alignRight = (props.inlineAlign ?? props.localePreferences?.inlineResultAlign ?? 'left') === 'right'

  // For right-alignment, estimate available columns using the scroller (viewport) width
  let targetCol = 0
  if (alignRight) {
    const scroller = view.scrollDOM
    const gutters = view.dom.querySelector('.cm-gutters')
    const gutterWidth = gutters ? gutters.offsetWidth : 0
    const availableWidth = (scroller ? scroller.clientWidth : 0) - gutterWidth - 16
    const charWidth = editorFontSize.value * 0.6
    if (charWidth > 0 && availableWidth > 0) targetCol = Math.floor(availableWidth / charWidth)
  }

  const widgets = []
  for (let i = 0; i < maxLine; i++) {
    const line = lines[i]
    if (!line.result && !line.error) continue
    if (line.hideResult) continue

    const docLine = doc.line(i + 1)
    const lineLength = docLine.length
    const resultStr = line.result ? `= ${line.result}` : `⚠ ${line.error}`
    const className = line.result ? 'numori-inline-result' : 'numori-inline-error'

    let padText
    if (alignRight && targetCol > 0) {
      const padCount = Math.max(2, targetCol - lineLength - resultStr.length)
      padText = ' '.repeat(padCount)
    } else {
      padText = '  '
    }

    const widget = Decoration.widget({
      widget: new InlineResultWidget(resultStr, className, padText),
      side: 1,
    })
    widgets.push(widget.range(docLine.to))
  }

  return Decoration.set(widgets)
}

// --- Inline markdown decoration helper ---
const applyInlineMarkdown = (text, lineFrom, widgets) => {
  // Collect inline spans to avoid overlapping ranges
  const spans = []

  // Inline code: `...`
  const codeRe = /`([^`]+)`/g
  let m
  while ((m = codeRe.exec(text)) !== null) {
    spans.push({ from: m.index, to: m.index + m[0].length, type: 'code', openLen: 1, closeLen: 1 })
  }

  // Bold: **...**
  const boldRe = /\*\*(.+?)\*\*/g
  while ((m = boldRe.exec(text)) !== null) {
    spans.push({ from: m.index, to: m.index + m[0].length, type: 'bold', openLen: 2, closeLen: 2 })
  }

  // Strikethrough: ~~...~~
  const strikeRe = /~~(.+?)~~/g
  while ((m = strikeRe.exec(text)) !== null) {
    spans.push({ from: m.index, to: m.index + m[0].length, type: 'strike', openLen: 2, closeLen: 2 })
  }

  // Italic: *...* (but not **)
  const italicRe = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g
  while ((m = italicRe.exec(text)) !== null) {
    spans.push({ from: m.index, to: m.index + m[0].length, type: 'italic', openLen: 1, closeLen: 1 })
  }

  // Links: [text](url)
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  while ((m = linkRe.exec(text)) !== null) {
    spans.push({ from: m.index, to: m.index + m[0].length, type: 'link', linkText: m[1], linkUrl: m[2], openLen: 1 })
  }

  // Sort by position, remove overlapping spans (first match wins)
  spans.sort((a, b) => a.from - b.from)
  const used = []
  for (const s of spans) {
    if (used.some(u => s.from < u.to && s.to > u.from)) continue
    used.push(s)
  }

  const classMap = {
    bold: 'numori-md-bold',
    italic: 'numori-md-italic',
    strike: 'numori-md-strike',
    code: 'numori-md-inline-code',
  }

  for (const s of used) {
    if (s.type === 'link') {
      // Hide [
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(lineFrom + s.from, lineFrom + s.from + 1))
      // Style link text
      const textEnd = s.from + 1 + s.linkText.length
      widgets.push(Decoration.mark({ class: 'numori-md-link', attributes: { title: s.linkUrl, 'data-href': s.linkUrl } }).range(lineFrom + s.from + 1, lineFrom + textEnd))
      // Hide ](url)
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(lineFrom + textEnd, lineFrom + s.to))
    } else {
      const cls = classMap[s.type]
      // Hide opening syntax
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(lineFrom + s.from, lineFrom + s.from + s.openLen))
      // Style content
      widgets.push(Decoration.mark({ class: cls }).range(lineFrom + s.from + s.openLen, lineFrom + s.to - s.closeLen))
      // Hide closing syntax
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(lineFrom + s.to - s.closeLen, lineFrom + s.to))
    }
  }
}

// --- Code block widget for fence lines ---
class MdCodeBlockFenceWidget extends WidgetType {
  constructor(lang) {
    super()
    this.lang = lang
  }
  toDOM() {
    const span = document.createElement('span')
    span.className = 'numori-md-code-fence-label'
    span.textContent = this.lang || ''
    return span
  }
  eq(other) { return this.lang === other.lang }
  ignoreEvent() { return false }
}

// --- Copy button widget for code blocks ---
class MdCodeBlockCopyWidget extends WidgetType {
  constructor(code) {
    super()
    this.code = code
  }
  toDOM() {
    const btn = document.createElement('button')
    btn.className = 'numori-md-code-copy-btn'
    btn.setAttribute('aria-label', 'Copy code')
    btn.title = 'Copy code'
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      navigator.clipboard.writeText(this.code).catch(() => {})
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      btn.classList.add('numori-md-code-copy-btn--copied')
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
        btn.classList.remove('numori-md-code-copy-btn--copied')
      }, 1500)
    })
    return btn
  }
  eq(other) { return this.code === other.code }
  ignoreEvent() { return false }
}

// --- Build markdown preview decorations ---
const buildMdDecorations = (view) => {
  if (props.markdownMode === 'off') return Decoration.none

  const doc = view.state.doc
  const cursorLine = props.markdownMode === 'edit' ? doc.lineAt(view.state.selection.main.head).number : -1
  const widgets = []

  // First pass: identify fenced code block ranges
  const codeBlockRanges = [] // { startLn, endLn, lang }
  let fenceStart = null
  let fenceLang = ''
  for (let ln = 1; ln <= doc.lines; ln++) {
    const text = doc.line(ln).text
    const trimmed = text.trim()
    if (fenceStart === null) {
      const fenceMatch = trimmed.match(/^```([\w+#.-]*)$/)
      if (fenceMatch) {
        fenceStart = ln
        fenceLang = fenceMatch[1] || ''
      }
    } else {
      if (trimmed === '```') {
        codeBlockRanges.push({ startLn: fenceStart, endLn: ln, lang: fenceLang })
        fenceStart = null
        fenceLang = ''
      }
    }
  }
  // Unclosed fence — treat rest of doc as code block
  if (fenceStart !== null) {
    codeBlockRanges.push({ startLn: fenceStart, endLn: doc.lines, lang: fenceLang })
  }

  // Helper to check if a line is inside a code block
  const getCodeBlock = (ln) => codeBlockRanges.find(r => ln >= r.startLn && ln <= r.endLn)

  // Pre-highlight code blocks
  const codeBlockHighlights = new Map()
  for (const block of codeBlockRanges) {
    const contentStart = block.startLn + 1
    const contentEnd = block.endLn - (doc.line(block.endLn).text.trim() === '```' ? 1 : 0)
    if (contentStart > contentEnd) continue
    const lines = []
    for (let ln = contentStart; ln <= contentEnd; ln++) {
      lines.push(doc.line(ln).text)
    }
    const code = lines.join('\n')
    try {
      const spans = highlightCode(code, block.lang)
      codeBlockHighlights.set(block, spans)
    } catch (e) {
      console.warn('[numori] highlightCode failed:', e)
    }
  }

  // Pre-compute max content line length per code block (for consistent width)
  const codeBlockMaxLen = new Map()
  for (const block of codeBlockRanges) {
    const contentStart = block.startLn + 1
    const contentEnd = block.endLn - (doc.line(block.endLn).text.trim() === '```' ? 1 : 0)
    let maxLen = block.lang ? block.lang.length : 0
    for (let ln = contentStart; ln <= contentEnd; ln++) {
      maxLen = Math.max(maxLen, doc.line(ln).text.length)
    }
    codeBlockMaxLen.set(block, maxLen)
  }

  for (let ln = 1; ln <= doc.lines; ln++) {
    const docLine = doc.line(ln)
    const text = docLine.text
    const trimmed = text.trim()

    // Handle fenced code block lines
    const codeBlock = getCodeBlock(ln)
    if (codeBlock) {
      // In edit mode, if cursor is on any line of this block, show raw
      if (props.markdownMode === 'edit' && cursorLine >= codeBlock.startLn && cursorLine <= codeBlock.endLn) continue

      if (ln === codeBlock.startLn) {
        // Opening fence: hide the ``` and show language label + copy button
        widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.to))
        if (codeBlock.lang) {
          widgets.push(Decoration.widget({
            widget: new MdCodeBlockFenceWidget(codeBlock.lang),
            side: 1,
          }).range(docLine.from))
        }
        // Collect code block content for copy button
        const contentStartLn = codeBlock.startLn + 1
        const contentEndLn = codeBlock.endLn - (doc.line(codeBlock.endLn).text.trim() === '```' ? 1 : 0)
        const codeLines = []
        for (let cl = contentStartLn; cl <= contentEndLn; cl++) {
          codeLines.push(doc.line(cl).text)
        }
        widgets.push(Decoration.widget({
          widget: new MdCodeBlockCopyWidget(codeLines.join('\n')),
          side: 1,
        }).range(docLine.from))
        const blockW = (codeBlockMaxLen.get(codeBlock) || 0) + 8
        widgets.push(Decoration.line({ class: 'numori-md-code-block-line numori-md-code-block-first', attributes: { style: `width: ${blockW}ch` } }).range(docLine.from))
      } else if (ln === codeBlock.endLn && trimmed === '```') {
        // Closing fence: hide it, add bottom border styling
        widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.to))
        const blockW = (codeBlockMaxLen.get(codeBlock) || 0) + 8
        widgets.push(Decoration.line({ class: 'numori-md-code-block-line numori-md-code-block-last', attributes: { style: `width: ${blockW}ch` } }).range(docLine.from))
      } else {
        // Content line inside code block — apply syntax highlighting
        const blockW = (codeBlockMaxLen.get(codeBlock) || 0) + 8
        widgets.push(Decoration.line({ class: 'numori-md-code-block-line', attributes: { style: `width: ${blockW}ch` } }).range(docLine.from))

        const spans = codeBlockHighlights.get(codeBlock)
        if (spans) {
          // Calculate offset of this line within the code block content
          const contentStartLn = codeBlock.startLn + 1
          let charOffset = 0
          for (let cl = contentStartLn; cl < ln; cl++) {
            charOffset += doc.line(cl).text.length + 1 // +1 for \n
          }
          const lineLen = text.length

          for (const span of spans) {
            if (!span.className) continue
            const spanEnd = span.offset + span.text.length
            // Check if this span overlaps with the current line
            if (spanEnd <= charOffset || span.offset >= charOffset + lineLen) continue
            const from = Math.max(0, span.offset - charOffset)
            const to = Math.min(lineLen, spanEnd - charOffset)
            if (from >= to) continue
            widgets.push(Decoration.mark({
              class: 'numori-hl ' + span.className
            }).range(docLine.from + from, docLine.from + to))
          }
        }
      }
      continue
    }

    if (!trimmed || ln === cursorLine) continue

    // # Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s(.+)$/)
    if (headerMatch) {
      const hashes = headerMatch[1]
      const prefixLen = text.indexOf(hashes) + hashes.length + 1
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixLen))
      widgets.push(Decoration.mark({ class: `numori-md-h${hashes.length}` }).range(docLine.from + prefixLen, docLine.to))
      applyInlineMarkdown(text.substring(prefixLen), docLine.from + prefixLen, widgets)
      continue
    }

    // // Comments
    if (trimmed.startsWith('//')) {
      const slashIdx = text.indexOf('//')
      const afterSlash = text.substring(slashIdx + 2)
      const spaceAfter = afterSlash.startsWith(' ') ? 1 : 0
      const prefixEnd = slashIdx + 2 + spaceAfter
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      widgets.push(Decoration.mark({ class: 'numori-md-comment' }).range(docLine.from + prefixEnd, docLine.to))
      continue
    }

    // - [x] / - [ ] Checkboxes (supports nesting via leading whitespace)
    const checkMatch = text.match(/^(\s*)- \[([ x])\]\s(.+)$/)
    if (checkMatch) {
      const indent = checkMatch[1].length
      const checked = checkMatch[2] === 'x'
      const prefixEnd = indent + (checked ? 6 : 6) // "- [x] " or "- [ ] " = 6 chars
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      const nestLevel = Math.floor(indent / 2)
      const padStr = '\u2003'.repeat(nestLevel) // em-space per nesting level
      // Top-level: square checkboxes, nested: circle checkboxes
      let icon
      if (nestLevel === 0) {
        icon = checked ? '\u25A3\u2009' : '\u25A2\u2009' // ▣ / ▢
      } else {
        icon = checked ? '\u25C9\u2009' : '\u25CB\u2009' // ◉ / ○
      }
      const iconClass = nestLevel === 0 ? 'numori-md-check-icon' : 'numori-md-check-icon-nested'
      widgets.push(Decoration.widget({
        widget: new MdPrefixWidget(padStr + icon, iconClass, ln),
        side: -1,
      }).range(docLine.from + prefixEnd))
      widgets.push(Decoration.mark({
        class: checked ? 'numori-md-checked' : 'numori-md-unchecked'
      }).range(docLine.from + prefixEnd, docLine.to))
      applyInlineMarkdown(text.substring(prefixEnd), docLine.from + prefixEnd, widgets)
      continue
    }

    // - List items (supports nesting via leading whitespace)
    const listMatch = text.match(/^(\s*)- (.+)$/)
    if (listMatch) {
      const indent = listMatch[1].length
      const prefixEnd = indent + 2 // "- " = 2 chars
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      const nestLevel = Math.floor(indent / 2)
      const bullets = ['\u2022', '\u25E6', '\u25AA', '\u25AB'] // ●, ◦, ▪, ▫
      const bullet = bullets[Math.min(nestLevel, bullets.length - 1)]
      const padStr = '\u2003'.repeat(nestLevel) // em-space per nesting level
      widgets.push(Decoration.widget({
        widget: new MdPrefixWidget(padStr + bullet + '\u2009', 'numori-md-bullet'),
        side: -1,
      }).range(docLine.from + prefixEnd))
      widgets.push(Decoration.mark({ class: 'numori-md-list-item' }).range(docLine.from + prefixEnd, docLine.to))
      applyInlineMarkdown(text.substring(prefixEnd), docLine.from + prefixEnd, widgets)
      continue
    }

    // > Blockquotes
    const quoteMatch = trimmed.match(/^>\s?(.+)$/)
    if (quoteMatch) {
      const gtIdx = text.indexOf('>')
      const afterGt = text.substring(gtIdx + 1)
      const spaceAfterGt = afterGt.startsWith(' ') ? 1 : 0
      const prefixEnd = gtIdx + 1 + spaceAfterGt
      widgets.push(Decoration.mark({ class: 'numori-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      widgets.push(Decoration.widget({
        widget: new MdPrefixWidget('\u2503\u2009', 'numori-md-quote-bar'),
        side: -1,
      }).range(docLine.from + prefixEnd))
      widgets.push(Decoration.mark({ class: 'numori-md-quote' }).range(docLine.from + prefixEnd, docLine.to))
      continue
    }

    // --- Inline markdown: bold, italic, strikethrough, code, links ---
    applyInlineMarkdown(text, docLine.from, widgets)
  }

  try {
    return Decoration.set(widgets, true)
  } catch (e) {
    console.warn('[numori] Decoration.set failed, falling back to sorted:', e.message)
    widgets.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide)
    try {
      return Decoration.set(widgets)
    } catch {
      return Decoration.none
    }
  }
}

// --- Dispatch decoration updates ---
const updateInlineDecorations = () => {
  if (!editorView) return
  const decos = buildInlineDecorations(editorView)
  editorView.dispatch({ effects: setInlineResults.of(decos) })
}

const updateMarkdownPreview = () => {
  if (!editorView) return
  const decos = buildMdDecorations(editorView)
  editorView.dispatch({ effects: setMdDecorations.of(decos) })
}

// --- Keyboard shortcuts ---
const buildKeymap = () => {
  const h = props.shortcutHandlers
  if (!h) return []
  const bindings = []
  const map = [
    ['Mod-s', h.save],
    ['Mod-Shift-n', h.newNote],
    ['Mod-o', h.openFile],
    ['Mod-p', h.print],
    ['Mod-d', h.duplicate],
    ['Mod-e', h.exportText],
    ['Mod-h', h.help],
    ['Mod-Shift-s', h.exportAll],
  ]
  for (const [key, handler] of map) {
    if (handler) {
      bindings.push({ key, run: () => { handler(); return true }, preventDefault: true })
    }
  }
  return cmKeymap.of(bindings)
}

// --- NuxtCodeMirror basicSetup config ---
// Only static settings here — dynamic ones are managed via compartments below.
const cmBasicSetup = computed(() => ({
  lineNumbers: false,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  closeBrackets: false,
  bracketMatching: true,
  autocompletion: false,
  highlightSelectionMatches: true,
  tabSize: false,
  drawSelection: true,
  rectangularSelection: true,
  crosshairCursor: false,
  dropCursor: true,
  allowMultipleSelections: true,
  indentOnInput: true,
  syntaxHighlighting: false,
  defaultKeymap: true,
  historyKeymap: true,
  searchKeymap: true,
  foldKeymap: true,
  completionKeymap: false,
  lintKeymap: false,
}))

// --- Theme mode for NuxtCodeMirror ---
// Pass "none" so the built-in oneDark / defaultLight themes are skipped;
// our own numori themes (in extensions via themeCompartment) handle everything.
const cmThemeMode = 'none'

// --- Helpers for dynamic compartment values ---
const buildLineNumbers = () => {
  const mode = editorLineNumbers.value
  if (mode === 'off') return []
  if (mode === 'relative') {
    return cmLineNumbers({
      formatNumber: (lineNo, state) => {
        const cursorLine = state.doc.lineAt(state.selection.main.head).number
        const diff = Math.abs(lineNo - cursorLine)
        return diff === 0 ? String(lineNo) : String(diff)
      }
    })
  }
  if (mode === 'interval') {
    return cmLineNumbers({
      formatNumber: (lineNo) => lineNo % 10 === 0 ? String(lineNo) : ''
    })
  }
  return cmLineNumbers()
}

const buildFoldGutter = () =>
  (props.localePreferences?.editorFolding ?? true) ? cmFoldGutter() : []

const buildActiveLine = () => {
  const val = props.localePreferences?.editorRenderLineHighlight ?? 'line'
  return ['line', 'all'].includes(val) ? cmHighlightActiveLine() : []
}

const buildActiveLineGutter = () => {
  const val = props.localePreferences?.editorRenderLineHighlight ?? 'line'
  return val === 'all' ? cmHighlightActiveLineGutter() : []
}

const buildCloseBrackets = () =>
  (props.localePreferences?.editorAutoClosingBrackets ?? 'always') !== 'never' ? cmCloseBrackets() : []

const buildTabSize = () =>
  indentUnit.of(' '.repeat(props.localePreferences?.editorTabSize ?? 2))

const buildWordWrap = () =>
  props.localePreferences?.editorWordWrap ? EditorView.lineWrapping : []

const buildScrollPastEnd = () =>
  props.editable && props.localePreferences?.editorScrollPastEnd !== false ? scrollPastEnd() : []

// --- Extensions array ---
const cmExtensions = computed(() => [
  numoriLanguage,
  themeCompartment.of(colorMode.value === 'dark' ? numoriDarkTheme : numoriLightTheme),
  fontThemeCompartment.of(buildFontTheme()),
  lineNumbersCompartment.of(buildLineNumbers()),
  foldGutterCompartment.of(buildFoldGutter()),
  activeLineCompartment.of(buildActiveLine()),
  activeLineGutterCompartment.of(buildActiveLineGutter()),
  closeBracketsCompartment.of(buildCloseBrackets()),
  tabSizeCompartment.of(buildTabSize()),
  wordWrapCompartment.of(buildWordWrap()),
  scrollPastEndCompartment.of(buildScrollPastEnd()),
  inlineResultField,
  mdPreviewField,
  buildKeymap(),
  // Cursor position tracking
  EditorView.updateListener.of((update) => {
    if (update.selectionSet || update.docChanged) {
      const line = update.state.doc.lineAt(update.state.selection.main.head)
      currentLine.value = line.number - 1
      // Relative line numbers need a gutter refresh on every cursor move
      if (editorLineNumbers.value === 'relative') {
        update.view.dispatch({
          effects: lineNumbersCompartment.reconfigure(buildLineNumbers())
        })
      }
    }
    if (update.docChanged || update.transactions.some(t => t.isUserEvent('undo') || t.isUserEvent('redo'))) {
      updateUndoRedoState()
    }
  }),
  // Click handler for inline results (copy on click)
  EditorView.domEventHandlers({
    click: (event, view) => {
      if (handleMdClick(event, view)) return true
      return handleResultClick(event, view)
    },
    touchstart: (event, view) => {
      return handleMdTouchStart(event, view)
    },
    touchmove: (event) => {
      return handleMdTouchMove(event)
    },
    touchend: (event, view) => {
      if (handleMdTouchEnd(event, view)) return true
      return handleResultTouch(event, view)
    },
    contextmenu: (event, view) => {
      // Alt+click on link (works in all modes: try rendered element, fall back to raw text)
      if (event.altKey) {
        const el = event.target
        const linkEl = findLinkEl(el)
        if (linkEl) {
          event.preventDefault()
          triggerLinkPopup(linkEl, view, event.clientX, event.clientY)
          return true
        }
        // Fallback: parse raw markdown link from text at cursor position
        if (triggerRawLinkPopup(view, event.clientX, event.clientY)) {
          event.preventDefault()
          return true
        }
      }
      if (props.markdownMode === 'off') return false
      const el = event.target
      const linkEl = findLinkEl(el)
      if (linkEl) {
        event.preventDefault()
        return true
      }
      // Alt+click on checkbox (macOS contextmenu path)
      if (event.altKey) {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
        if (pos != null) {
          const line = view.state.doc.lineAt(pos)
          const checkMatch = line.text.match(/^(\s*)- \[([ x])\]\s/)
          if (checkMatch) {
            event.preventDefault()
            const bracketOffset = checkMatch[1].length + 3
            const from = line.from + bracketOffset
            const to = from + 1
            const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
            view.dispatch({ changes: { from, to, insert: newChar } })
            return true
          }
        }
      }
      return false
    },
  }),
])

// --- Click/touch handlers for inline result copy ---
const handleResultClick = (event, view) => {
  if (!props.showInline || !autoCopyResult.value) return false
  const el = event.target
  if (!el || !el.classList.contains('numori-inline-result')) return false

  const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
  if (pos == null) return false
  const line = view.state.doc.lineAt(pos)
  const lineIndex = line.number - 1
  const lineData = displayLines.value[lineIndex]
  if (!lineData?.result) return false

  copyResult(lineData.result, lineIndex)
  showCopiedToast(view, event.clientX, event.clientY, lineIndex)
  return false
}

const handleResultTouch = (event, view) => {
  if (!props.showInline || !autoCopyResult.value) return false
  const touch = event.changedTouches?.[0]
  if (!touch) return false

  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  if (!el || !el.classList.contains('numori-inline-result')) return false

  const pos = view.posAtCoords({ x: touch.clientX, y: touch.clientY })
  if (pos == null) return false
  const line = view.state.doc.lineAt(pos)
  const lineIndex = line.number - 1
  const lineData = displayLines.value[lineIndex]
  if (!lineData?.result) return false

  event.preventDefault()
  copyResult(lineData.result, lineIndex)
  showCopiedToast(view, touch.clientX, touch.clientY, lineIndex)
  return false
}

// --- Link popup state ---
const linkPopup = reactive({ show: false, url: '', text: '', x: 0, y: 0, isExternal: false })

const closeLinkPopup = () => { linkPopup.show = false }

const isExternalUrl = (url) => {
  try {
    const u = new URL(url, window.location.origin)
    return u.origin !== window.location.origin
  } catch { return true }
}

const showLinkPopup = (url, text, x, y) => {
  linkPopup.url = url
  linkPopup.text = text
  linkPopup.x = x
  linkPopup.y = y
  linkPopup.isExternal = isExternalUrl(url)
  linkPopup.show = true
}

const openLink = () => {
  closeLinkPopup()
  window.open(linkPopup.url, '_blank', 'noopener,noreferrer')
}

const copyLinkUrl = async () => {
  closeLinkPopup()
  try { await navigator.clipboard.writeText(linkPopup.url) } catch { /* ignore */ }
}

const copyLinkName = async () => {
  closeLinkPopup()
  try { await navigator.clipboard.writeText(linkPopup.text) } catch { /* ignore */ }
}

// --- Markdown click handler (links + checkboxes) ---
const _isMac = import.meta.client && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
let longPressTimer = null
let longPressTriggered = false

const findLinkEl = (el) => el?.closest?.('.numori-md-link') || (el?.classList?.contains('numori-md-link') ? el : null)

// Find a markdown link from raw text at a given cursor position within the line
const findRawLinkAt = (lineText, charOffset) => {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let m
  while ((m = linkRe.exec(lineText)) !== null) {
    if (charOffset >= m.index && charOffset < m.index + m[0].length) {
      return { text: m[1], url: m[2] }
    }
  }
  return null
}

const triggerLinkPopup = (linkEl, view, x, y) => {
  const url = linkEl.getAttribute('data-href')
  const text = linkEl.textContent
  if (!url) return
  const rect = view.dom.getBoundingClientRect()
  showLinkPopup(url, text, x - rect.left, y - rect.top)
}

// Show link popup from raw text at a screen position
const triggerRawLinkPopup = (view, x, y) => {
  const pos = view.posAtCoords({ x, y })
  if (pos == null) return false
  const line = view.state.doc.lineAt(pos)
  const charOffset = pos - line.from
  const link = findRawLinkAt(line.text, charOffset)
  if (!link) return false
  const rect = view.dom.getBoundingClientRect()
  showLinkPopup(link.url, link.text, x - rect.left, y - rect.top)
  return true
}

const handleMdClick = (event, view) => {
  // Alt+click on raw checklist text (works in all modes, including edit-only)
  if (event.altKey && props.editable) {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
    if (pos != null) {
      const line = view.state.doc.lineAt(pos)
      const checkMatch = line.text.match(/^(\s*)- \[([ x])\]\s/)
      if (checkMatch) {
        event.preventDefault()
        const bracketOffset = checkMatch[1].length + 3
        const from = line.from + bracketOffset
        const to = from + 1
        const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
        view.dispatch({ changes: { from, to, insert: newChar } })
        return true
      }
    }
  }

  // Alt+click on link (works in all modes: try rendered element first, fall back to raw text)
  if (event.altKey) {
    const el = event.target
    const linkEl = findLinkEl(el)
    if (linkEl) {
      event.preventDefault()
      triggerLinkPopup(linkEl, view, event.clientX, event.clientY)
      return true
    }
    // Fallback: parse raw markdown link from text at cursor position
    event.preventDefault()
    if (triggerRawLinkPopup(view, event.clientX, event.clientY)) return true
  }

  if (props.markdownMode === 'off') return false
  const el = event.target

  // Checkbox click (icon, or anywhere on the checkbox line in view-only mode)
  const isCheckIcon = el?.classList?.contains('numori-md-check-icon') || el?.classList?.contains('numori-md-check-icon-nested')
  const isViewOnly = !props.editable
  if (isCheckIcon || isViewOnly) {
    const lineNum = isCheckIcon
      ? parseInt(el.dataset?.line, 10)
      : (() => {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (pos == null) return null
          return view.state.doc.lineAt(pos).number
        })()
    if (!lineNum || lineNum < 1) return false
    const doc = view.state.doc
    if (lineNum > doc.lines) return false
    const line = doc.line(lineNum)
    const lineText = line.text
    const checkMatch = lineText.match(/^(\s*)- \[([ x])\]\s/)
    if (checkMatch) {
      event.preventDefault()
      const bracketOffset = checkMatch[1].length + 3 // indent + "- ["
      const from = line.from + bracketOffset
      const to = from + 1
      const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
      view.dispatch({ changes: { from, to, insert: newChar } })
      return true
    }
  }

  // Close link popup if clicking elsewhere
  if (linkPopup.show) closeLinkPopup()

  return false
}

// Touch: long-press on link shows popup, tap on checkbox toggles
const handleMdTouchStart = (event, view) => {
  if (props.markdownMode === 'off') return false
  const touch = event.touches?.[0]
  if (!touch) return false

  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  const linkEl = findLinkEl(el)
  if (!linkEl) return false

  // Prevent OS long-press actions (context menu, text selection) on links
  event.preventDefault()

  longPressTriggered = false
  const startX = touch.clientX
  const startY = touch.clientY

  longPressTimer = setTimeout(() => {
    longPressTriggered = true
    triggerLinkPopup(linkEl, view, startX, startY)
  }, 500)

  return true
}

const handleMdTouchMove = (event) => {
  if (!longPressTimer) return false
  // Cancel long-press if finger moves too far
  const touch = event.touches?.[0]
  if (touch) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  return false
}

const handleMdTouchEnd = (event, view) => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  // If long-press already triggered the popup, swallow the touchend
  if (longPressTriggered) {
    longPressTriggered = false
    event.preventDefault()
    return true
  }

  if (props.markdownMode === 'off') return false
  const touch = event.changedTouches?.[0]
  if (!touch) return false
  const el = document.elementFromPoint(touch.clientX, touch.clientY)

  // Checkbox touch
  if (el?.classList?.contains('numori-md-check-icon') || el?.classList?.contains('numori-md-check-icon-nested')) {
    if (!props.editable) return false
    const lineNum = parseInt(el.dataset?.line, 10)
    if (!lineNum || lineNum < 1) return false
    const doc = view.state.doc
    if (lineNum > doc.lines) return false
    const line = doc.line(lineNum)
    const lineText = line.text
    const checkMatch = lineText.match(/^(\s*)- \[([ x])\]\s/)
    if (checkMatch) {
      event.preventDefault()
      const bracketOffset = checkMatch[1].length + 3
      const from = line.from + bracketOffset
      const to = from + 1
      const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
      view.dispatch({ changes: { from, to, insert: newChar } })
      return true
    }
  }

  return false
}

// --- Editor lifecycle ---
const initEditor = (view) => {
  if (editorReady.value) return
  editorView = view
  injectInlineStyles()
  updateLines(props.content)
  updateInlineDecorations()
  updateMarkdownPreview()
  editorReady.value = true
}

// NuxtCodeMirror emits "onCreateEditor" with { view, state } payload.
const onEditorCreate = (payload) => {
  initEditor(payload.view)
}

// Primary approach: watch the exposed view ref from NuxtCodeMirror.
// defineExpose'd refs are auto-unwrapped through template refs in Vue 3,
// so editorRef.value?.view gives us the EditorView directly.
// We use a short poll as a safety net since the child mounts inside <ClientOnly>.
let initPollTimer = null
const pollForView = () => {
  if (editorReady.value) { clearInterval(initPollTimer); return }
  const view = editorRef.value?.view
  if (view && typeof view.dispatch === 'function') {
    clearInterval(initPollTimer)
    initEditor(view)
  }
}
onMounted(() => {
  initPollTimer = setInterval(pollForView, 50)
  // Give up after 10s
  setTimeout(() => clearInterval(initPollTimer), 10000)
})

onBeforeUnmount(() => {
  if (initPollTimer) clearInterval(initPollTimer)
  if (longPressTimer) clearTimeout(longPressTimer)
})

// Compute initial results on mount
onMounted(() => {
  updateLines(props.content)
})

// --- Watchers ---

// Re-format display when locale preferences change
watch(() => props.localePreferences, () => {
  reformatDisplay()
  if (editorView) {
    editorView.dispatch({
      effects: [
        fontThemeCompartment.reconfigure(buildFontTheme()),
        lineNumbersCompartment.reconfigure(buildLineNumbers()),
        foldGutterCompartment.reconfigure(buildFoldGutter()),
        activeLineCompartment.reconfigure(buildActiveLine()),
        activeLineGutterCompartment.reconfigure(buildActiveLineGutter()),
        closeBracketsCompartment.reconfigure(buildCloseBrackets()),
        tabSizeCompartment.reconfigure(buildTabSize()),
        wordWrapCompartment.reconfigure(buildWordWrap()),
        scrollPastEndCompartment.reconfigure(buildScrollPastEnd()),
      ]
    })
  }
}, { deep: true })

// Re-evaluate when code block result visibility changes
watch(() => props.localePreferences?.showResultsInCodeBlocks, () => {
  updateLines(localContent.value)
  updateInlineDecorations()
})

// Theme changes
watch(() => colorMode.value, () => {
  if (!editorView) return
  editorView.dispatch({
    effects: themeCompartment.reconfigure(
      colorMode.value === 'dark' ? numoriDarkTheme : numoriLightTheme
    )
  })
})

// Live clock
const tickLiveTime = () => {
  const raw = rawLines.value
  if (!raw.length) return
  const hasLive = raw.some(l => l.liveTime)
  if (!hasLive) return
  for (const line of raw) {
    if (!line.liveTime) continue
    const now = new Date()
    if (line.iana) {
      line.result = now.toLocaleString('en-US', { timeZone: line.iana })
    } else {
      line.result = now.toLocaleString('en-US')
    }
    line.value = now.getTime()
  }
  reformatDisplay()
}
useIntervalFn(tickLiveTime, 1000)

// Re-apply inline decorations
watch(displayLines, () => {
  nextTick(() => {
    updateInlineDecorations()
    if (props.markdownMode !== 'off') updateMarkdownPreview()
  })
})

watch(() => props.showInline, () => updateInlineDecorations())
watch(() => props.inlineAlign, () => updateInlineDecorations())
watch(() => props.localePreferences?.inlineResultAlign, () => updateInlineDecorations())

// Markdown mode change
watch(() => props.markdownMode, () => nextTick(() => updateMarkdownPreview()))

// Cursor line change → re-render markdown (reveal raw on cursor line in edit mode)
watch(currentLine, () => {
  if (props.markdownMode === 'edit' && editorView) {
    nextTick(() => updateMarkdownPreview())
  }
})

// External content changes (switching notes, sync from other devices, inserting templates).
// When the editor is live and content genuinely differs, we compute a minimal
// diff (common prefix/suffix) and dispatch only the changed region as a CM
// transaction. This lets CodeMirror map cursor/selection through the change
// instead of resetting to position 0.
// We also sync localContent *before* dispatching so NuxtCodeMirror's internal
// watchEffect sees value === doc and doesn't fire a redundant full replacement.
let suppressEmit = false

watch(() => props.content, (newContent) => {
  if (localContent.value === newContent) return

  if (editorView) {
    const currentDoc = editorView.state.doc.toString()
    if (currentDoc === newContent) {
      // CM doc already matches — just align the ref silently
      suppressEmit = true
      localContent.value = newContent
      nextTick(() => { suppressEmit = false })
      return
    }

    // Compute minimal diff: find common prefix and suffix
    const oldStr = currentDoc
    const newStr = newContent
    let prefixLen = 0
    const minLen = Math.min(oldStr.length, newStr.length)
    while (prefixLen < minLen && oldStr[prefixLen] === newStr[prefixLen]) prefixLen++

    let suffixLen = 0
    const maxSuffix = minLen - prefixLen
    while (
      suffixLen < maxSuffix &&
      oldStr[oldStr.length - 1 - suffixLen] === newStr[newStr.length - 1 - suffixLen]
    ) suffixLen++

    const from = prefixLen
    const to = oldStr.length - suffixLen
    const insert = newStr.slice(prefixLen, newStr.length - suffixLen)

    // Sync the ref first so NuxtCodeMirror's watchEffect sees no diff
    suppressEmit = true
    localContent.value = newContent

    // Dispatch the minimal change — CM maps cursor/selection through it
    editorView.dispatch({
      changes: { from, to, insert },
    })

    nextTick(() => { suppressEmit = false })
    updateLines(newContent)
  } else {
    // Editor not ready yet (initial load / note switch) — direct assign is fine
    localContent.value = newContent
    updateLines(newContent)
  }
})

const debouncedUpdateLines = useDebounceFn((text) => updateLines(text), 80)

watch(localContent, (newContent) => {
  if (!suppressEmit) {
    emit('update:content', newContent)
  }
  debouncedUpdateLines(newContent)
})

// --- Core logic ---
const updateLines = (text) => {
  if (!text) {
    rawLines.value = []
    displayLines.value = []
    return
  }
  const lines = text.split('\n')
  rawLines.value = evaluateLines(lines, {
    showResultsInCodeBlocks: props.localePreferences?.showResultsInCodeBlocks ?? false,
  })
  reformatDisplay()
}

const reformatDisplay = () => {
  const prefs = props.localePreferences
  if (!prefs || !rawLines.value.length) {
    displayLines.value = rawLines.value
    return
  }
  displayLines.value = rawLines.value.map(line => {
    if (!line.result) return line
    return { ...line, result: formatDisplay(line.result, null, prefs) }
  })
}

// --- Inject CSS for inline result decorations and markdown preview ---
const injectInlineStyles = () => {
  if (inlineStylesInjected) return
  inlineStylesInjected = true
  // Remove any stale style element from HMR
  const existing = document.getElementById('numori-inline-styles')
  if (existing) existing.remove()
  const style = document.createElement('style')
  style.id = 'numori-inline-styles'
  style.textContent = `
    .cm-scroller { overscroll-behavior: none; -webkit-overflow-scrolling: auto; }
    .numori-inline-result { color: #CC2D56; font-style: italic; opacity: 0.75; cursor: pointer; }
    .cm-theme-dark .numori-inline-result,
    .dark .numori-inline-result { color: #FF6188; opacity: 0.7; }
    .numori-inline-error { color: #dc2626; font-style: italic; opacity: 0.65; cursor: default; }
    .cm-theme-dark .numori-inline-error,
    .dark .numori-inline-error { color: #FC9867; }
    .numori-inline-pad { cursor: default; }
    .numori-md-hidden-syntax { font-size: 0 !important; letter-spacing: 0 !important; width: 0 !important; display: inline-block; overflow: hidden; }
    .numori-md-h1 { font-size: 1.7em !important; font-weight: 700 !important; }
    .numori-md-h2 { font-size: 1.4em !important; font-weight: 600 !important; }
    .numori-md-h3 { font-size: 1.2em !important; font-weight: 600 !important; }
    .numori-md-h4 { font-size: 1.1em !important; font-weight: 600 !important; }
    .numori-md-h5 { font-size: 1.05em !important; font-weight: 600 !important; }
    .numori-md-h6 { font-size: 1em !important; font-weight: 600 !important; }
    .numori-md-comment { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: normal !important; color: #939293 !important; }
    .cm-theme-dark .numori-md-comment,
    .dark .numori-md-comment { color: #727072 !important; }
    .numori-md-list-item { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    .numori-md-bullet { opacity: 0.6; }
    .numori-md-checked { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; text-decoration: line-through !important; opacity: 0.6 !important; }
    .numori-md-unchecked { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    .numori-md-check-icon { font-style: normal !important; font-size: 1.1em !important; vertical-align: baseline !important; cursor: pointer !important; }
    .numori-md-check-icon-nested { font-style: normal !important; font-size: 1.05em !important; vertical-align: baseline !important; cursor: pointer !important; }
    .numori-md-quote { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: italic !important; opacity: 0.85 !important; }
    .numori-md-quote-bar { color: #FF6188 !important; font-style: normal !important; }
    .cm-theme-dark .numori-md-quote-bar,
    .dark .numori-md-quote-bar { color: #FF6188 !important; }
    .numori-md-bold { font-weight: 700 !important; }
    .numori-md-italic { font-style: italic !important; }
    .numori-md-strike { text-decoration: line-through !important; opacity: 0.6 !important; }
    .numori-md-inline-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      background: rgba(135,131,120,0.15) !important; border-radius: 3px !important;
      padding: 1px 4px !important; font-size: 0.9em !important;
    }
    .cm-theme-dark .numori-md-inline-code,
    .dark .numori-md-inline-code { background: rgba(255,255,255,0.1) !important; }
    .numori-md-link {
      color: #2563eb !important; text-decoration: underline !important;
      text-underline-offset: 2px !important; cursor: pointer !important;
    }
    .cm-theme-dark .numori-md-link,
    .dark .numori-md-link { color: #60a5fa !important; }
    .numori-md-code-block-line {
      background: rgba(135,131,120,0.1) !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      padding-left: 12px !important;
      padding-right: 12px !important;
      margin-left: 8px !important;
    }
    .cm-theme-dark .numori-md-code-block-line,
    .dark .numori-md-code-block-line { background: rgba(255,255,255,0.06) !important; }
    .numori-md-code-block-first { border-radius: 6px 6px 0 0 !important; padding-top: 4px !important; }
    .numori-md-code-block-last { border-radius: 0 0 6px 6px !important; }
    .numori-md-code-fence-label {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 0.75em !important; opacity: 0.5 !important; font-style: italic !important;
    }
    .numori-md-code-copy-btn {
      float: right; margin-right: 0px; margin-top: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer;
      background: rgba(135,131,120,0.15); color: #6b7280;
      opacity: 0.6; transition: opacity 0.15s ease, background 0.15s ease;
      -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    }
    .numori-md-code-copy-btn:hover,
    .numori-md-code-copy-btn:focus { opacity: 1; background: rgba(135,131,120,0.3); }
    .cm-theme-dark .numori-md-code-copy-btn,
    .dark .numori-md-code-copy-btn { background: rgba(255,255,255,0.1); color: #9ca3af; }
    .cm-theme-dark .numori-md-code-copy-btn:hover,
    .dark .numori-md-code-copy-btn:hover { background: rgba(255,255,255,0.2); }
    .numori-md-code-copy-btn--copied { opacity: 1 !important; color: #22c55e !important; }
    /* highlight.js syntax colors — light (aligned with numori palette) */
    .numori-hl.hljs-keyword,
    .numori-hl.hljs-selector-tag,
    .numori-hl.hljs-built_in { color: #CC2D56 !important; }
    .numori-hl.hljs-string,
    .numori-hl.hljs-addition { color: #4D8C2A !important; }
    .numori-hl.hljs-comment,
    .numori-hl.hljs-quote { color: #939293 !important; font-style: italic !important; }
    .numori-hl.hljs-number,
    .numori-hl.hljs-literal { color: #A68A1B !important; }
    .numori-hl.hljs-title,
    .numori-hl.hljs-title.class_,
    .numori-hl.hljs-title.function_ { color: #7B5FC4 !important; }
    .numori-hl.hljs-type,
    .numori-hl.hljs-template-variable { color: #1A8A9A !important; }
    .numori-hl.hljs-variable,
    .numori-hl.hljs-params { color: #2D2A2E !important; }
    .numori-hl.hljs-regexp { color: #C4621A !important; }
    .numori-hl.hljs-symbol,
    .numori-hl.hljs-bullet { color: #7B5FC4 !important; }
    .numori-hl.hljs-meta,
    .numori-hl.hljs-meta .hljs-keyword { color: #C4621A !important; }
    .numori-hl.hljs-deletion { color: #CC2D56 !important; background: rgba(204,45,86,0.08) !important; }
    .numori-hl.hljs-section { color: #2D2A2E !important; font-weight: 700 !important; }
    .numori-hl.hljs-name,
    .numori-hl.hljs-tag { color: #CC2D56 !important; }
    .numori-hl.hljs-attr,
    .numori-hl.hljs-attribute { color: #C4621A !important; }
    .numori-hl.hljs-selector-class,
    .numori-hl.hljs-selector-id { color: #7B5FC4 !important; }
    .numori-hl.hljs-property { color: #1A8A9A !important; }
    .numori-hl.hljs-operator { color: #939293 !important; }
    .numori-hl.hljs-punctuation { color: #727072 !important; }
    .numori-hl.hljs-subst { color: #2D2A2E !important; }
    /* highlight.js syntax colors — dark (aligned with numori palette) */
    .cm-theme-dark .numori-hl.hljs-keyword,
    .dark .numori-hl.hljs-keyword,
    .cm-theme-dark .numori-hl.hljs-selector-tag,
    .dark .numori-hl.hljs-selector-tag,
    .cm-theme-dark .numori-hl.hljs-built_in,
    .dark .numori-hl.hljs-built_in { color: #FF6188 !important; }
    .cm-theme-dark .numori-hl.hljs-string,
    .dark .numori-hl.hljs-string,
    .cm-theme-dark .numori-hl.hljs-addition,
    .dark .numori-hl.hljs-addition { color: #A9DC76 !important; }
    .cm-theme-dark .numori-hl.hljs-comment,
    .dark .numori-hl.hljs-comment,
    .cm-theme-dark .numori-hl.hljs-quote,
    .dark .numori-hl.hljs-quote { color: #727072 !important; font-style: italic !important; }
    .cm-theme-dark .numori-hl.hljs-number,
    .dark .numori-hl.hljs-number,
    .cm-theme-dark .numori-hl.hljs-literal,
    .dark .numori-hl.hljs-literal { color: #FFD866 !important; }
    .cm-theme-dark .numori-hl.hljs-title,
    .dark .numori-hl.hljs-title,
    .cm-theme-dark .numori-hl.hljs-title.class_,
    .dark .numori-hl.hljs-title.class_,
    .cm-theme-dark .numori-hl.hljs-title.function_,
    .dark .numori-hl.hljs-title.function_ { color: #AB9DF2 !important; }
    .cm-theme-dark .numori-hl.hljs-type,
    .dark .numori-hl.hljs-type,
    .cm-theme-dark .numori-hl.hljs-template-variable,
    .dark .numori-hl.hljs-template-variable { color: #78DCE8 !important; }
    .cm-theme-dark .numori-hl.hljs-variable,
    .dark .numori-hl.hljs-variable,
    .cm-theme-dark .numori-hl.hljs-params,
    .dark .numori-hl.hljs-params { color: #FCFCFA !important; }
    .cm-theme-dark .numori-hl.hljs-regexp,
    .dark .numori-hl.hljs-regexp { color: #FC9867 !important; }
    .cm-theme-dark .numori-hl.hljs-symbol,
    .dark .numori-hl.hljs-symbol,
    .cm-theme-dark .numori-hl.hljs-bullet,
    .dark .numori-hl.hljs-bullet { color: #AB9DF2 !important; }
    .cm-theme-dark .numori-hl.hljs-meta,
    .dark .numori-hl.hljs-meta { color: #FC9867 !important; }
    .cm-theme-dark .numori-hl.hljs-deletion,
    .dark .numori-hl.hljs-deletion { color: #FF6188 !important; background: rgba(255,97,136,0.1) !important; }
    .cm-theme-dark .numori-hl.hljs-section,
    .dark .numori-hl.hljs-section { color: #FCFCFA !important; font-weight: 700 !important; }
    .cm-theme-dark .numori-hl.hljs-name,
    .dark .numori-hl.hljs-name,
    .cm-theme-dark .numori-hl.hljs-tag,
    .dark .numori-hl.hljs-tag { color: #FF6188 !important; }
    .cm-theme-dark .numori-hl.hljs-attr,
    .dark .numori-hl.hljs-attr,
    .cm-theme-dark .numori-hl.hljs-attribute,
    .dark .numori-hl.hljs-attribute { color: #FC9867 !important; }
    .cm-theme-dark .numori-hl.hljs-selector-class,
    .dark .numori-hl.hljs-selector-class,
    .cm-theme-dark .numori-hl.hljs-selector-id,
    .dark .numori-hl.hljs-selector-id { color: #AB9DF2 !important; }
    .cm-theme-dark .numori-hl.hljs-property,
    .dark .numori-hl.hljs-property { color: #78DCE8 !important; }
    .cm-theme-dark .numori-hl.hljs-operator,
    .dark .numori-hl.hljs-operator { color: #727072 !important; }
    .cm-theme-dark .numori-hl.hljs-punctuation,
    .dark .numori-hl.hljs-punctuation { color: #939293 !important; }
    .cm-theme-dark .numori-hl.hljs-subst,
    .dark .numori-hl.hljs-subst { color: #FCFCFA !important; }
    .numori-inline-copied-toast {
      position: absolute; pointer-events: none; z-index: 100;
      padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;
      color: #4D8C2A; background: #F0FDF4; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      white-space: nowrap;
    }
    .dark .numori-inline-copied-toast { color: #A9DC76; background: #221F22; }
    .numori-toast-float-up { animation: numori-float-up 0.8s ease-out forwards; }
    @keyframes numori-float-up {
      0% { opacity: 1; transform: translateY(0); }
      70% { opacity: 1; transform: translateY(-4px); }
      100% { opacity: 0; transform: translateY(-8px); }
    }
    .numori-toast-fade { animation: numori-fade 0.8s ease-in-out forwards; }
    @keyframes numori-fade {
      0% { opacity: 0; } 15% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; }
    }
    .numori-toast-scale-pop { animation: numori-scale-pop 0.8s ease-out forwards; }
    @keyframes numori-scale-pop {
      0% { opacity: 0; transform: scale(0.5); }
      20% { opacity: 1; transform: scale(1.15); }
      35% { transform: scale(1); } 70% { opacity: 1; }
      100% { opacity: 0; transform: scale(0.9); }
    }
    .numori-toast-slide-right { animation: numori-slide-right 0.8s ease-out forwards; }
    @keyframes numori-slide-right {
      0% { opacity: 0; transform: translateX(-12px); }
      20% { opacity: 1; transform: translateX(0); }
      70% { opacity: 1; }
      100% { opacity: 0; transform: translateX(8px); }
    }
    .numori-toast-bounce { animation: numori-bounce 0.8s ease-out forwards; }
    @keyframes numori-bounce {
      0% { opacity: 0; transform: translateY(6px); }
      25% { opacity: 1; transform: translateY(-6px); }
      45% { transform: translateY(2px); } 60% { transform: translateY(-2px); }
      75% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; }
    }
    .numori-toast-glow { animation: numori-glow 0.8s ease-out forwards; }
    @keyframes numori-glow {
      0% { opacity: 0; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      20% { opacity: 1; box-shadow: 0 0 8px 2px rgba(16,185,129,0.5); }
      60% { opacity: 1; box-shadow: 0 0 2px 0 rgba(16,185,129,0.2); }
      100% { opacity: 0; box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .numori-toast-none { animation: numori-none 0.6s forwards; }
    @keyframes numori-none {
      0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

// --- Copied toast ---
const showCopiedToast = (view, posx, posy, lineIndex) => {
  const editorDom = view.dom
  if (!editorDom) return
  const animStyle = props.localePreferences?.copyAnimationStyle || 'float-up'
  const toast = document.createElement('div')
  toast.className = `numori-inline-copied-toast numori-toast-${animStyle}`
  toast.textContent = 'Copied'
  const rect = editorDom.getBoundingClientRect()
  toast.style.left = `${posx - rect.left}px`
  toast.style.top = lineIndex <= 1
    ? `${posy - rect.top + 8}px`
    : `${posy - rect.top - 24}px`
  editorDom.style.position = 'relative'
  editorDom.appendChild(toast)
  setTimeout(() => toast.remove(), 850)
}

const copyResult = async (result, _index) => {
  if (!autoCopyResult.value) return
  try {
    await navigator.clipboard.writeText(result)
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = result
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    } catch (fallbackErr) {
      console.error('Failed to copy:', fallbackErr)
    }
  }
}

// --- Expose methods for toolbar actions ---
const insertText = (text) => {
  if (!editorView) {
    const newContent = localContent.value + text
    localContent.value = newContent
    emit('update:content', newContent)
    return
  }
  const { from } = editorView.state.selection.main
  editorView.dispatch({
    changes: { from, insert: text },
    selection: EditorSelection.cursor(from + text.length),
  })
  editorView.focus()
}

const wrapSelection = (before, after = before) => {
  if (!editorView) {
    const newContent = localContent.value + before + after
    localContent.value = newContent
    emit('update:content', newContent)
    return
  }
  const { from, to } = editorView.state.selection.main
  const selectedText = editorView.state.sliceDoc(from, to)

  if (selectedText) {
    const wrapped = before + selectedText + after
    editorView.dispatch({
      changes: { from, to, insert: wrapped },
      selection: EditorSelection.range(from + before.length, from + before.length + selectedText.length),
    })
  } else {
    editorView.dispatch({
      changes: { from, insert: before + after },
      selection: EditorSelection.cursor(from + before.length),
    })
  }
  editorView.focus()
}

const indentLine = () => {
  if (!editorView) return
  const line = editorView.state.doc.lineAt(editorView.state.selection.main.head)
  editorView.dispatch({
    changes: { from: line.from, insert: '  ' },
    selection: EditorSelection.cursor(editorView.state.selection.main.head + 2),
  })
  editorView.focus()
}

const outdentLine = () => {
  if (!editorView) return
  const line = editorView.state.doc.lineAt(editorView.state.selection.main.head)
  const text = line.text
  if (text.startsWith('  ')) {
    editorView.dispatch({
      changes: { from: line.from, to: line.from + 2, insert: '' },
      selection: EditorSelection.cursor(Math.max(line.from, editorView.state.selection.main.head - 2)),
    })
  } else if (text.startsWith('\t')) {
    editorView.dispatch({
      changes: { from: line.from, to: line.from + 1, insert: '' },
      selection: EditorSelection.cursor(Math.max(line.from, editorView.state.selection.main.head - 1)),
    })
  }
  editorView.focus()
}

defineExpose({
  insertText,
  wrapSelection,
  indentLine,
  outdentLine,
  canUndo,
  canRedo,
  linkPopup,
  closeLinkPopup,
  openLink,
  copyLinkUrl,
  copyLinkName,
  undo: () => { if (editorView) { cmUndo(editorView); updateUndoRedoState(); editorView.focus() } },
  redo: () => { if (editorView) { cmRedo(editorView); updateUndoRedoState(); editorView.focus() } },
  blur: () => { if (editorView) { editorView.contentDOM.blur() } },
})
</script>
