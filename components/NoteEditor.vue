<template>
  <div class="h-full flex">
    <div :class="[
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
          :editable="true"
          height="100%"
          class="h-full"
          :placeholder="placeholder"
          @onCreateEditor="onEditorCreate"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import { EditorView, Decoration, WidgetType, keymap as cmKeymap } from '@codemirror/view'
import { StateField, StateEffect, Compartment, EditorSelection } from '@codemirror/state'
import { calcnotesLanguage, calcnotesLightTheme, calcnotesDarkTheme } from '~/composables/useCalcLanguage'
import { formatDisplay } from '~/composables/useDisplayFormatter'

const props = defineProps({
  content: { type: String, default: '' },
  placeholder: { type: String, default: 'Start typing... (e.g., 10 + 20)' },
  showResults: { type: Boolean, default: false },
  showInline: { type: Boolean, default: true },
  bordered: { type: Boolean, default: false },
  localePreferences: { type: Object, default: null },
  showMarkdownPreview: { type: Boolean, default: false },
  shortcutHandlers: { type: Object, default: null }
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

const { evaluateLines } = useCalculator()
const colorMode = useColorMode()

// --- Compartments for dynamic reconfiguration ---
const themeCompartment = new Compartment()
const fontThemeCompartment = new Compartment()

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
  return ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'].includes(val) ? val : 'line'
})
const editorCursorBlinking = computed(() => {
  const val = props.localePreferences?.editorCursorBlinking
  return ['blink', 'smooth', 'phase', 'expand', 'solid'].includes(val) ? val : 'blink'
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
    pad.className = 'calcnotes-inline-pad'
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
  constructor(content, className) {
    super()
    this.content = content
    this.className = className
  }
  toDOM() {
    const span = document.createElement('span')
    span.className = this.className
    span.textContent = this.content
    return span
  }
  eq(other) { return this.content === other.content && this.className === other.className }
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
  const alignRight = props.localePreferences?.inlineResultAlign === 'right'

  // For right-alignment, estimate visible columns
  let targetCol = 0
  if (alignRight) {
    const contentDom = view.contentDOM
    if (contentDom) {
      const contentWidth = contentDom.clientWidth
      const charWidth = editorFontSize.value * 0.6 // approximate
      if (charWidth > 0) targetCol = Math.floor(contentWidth / charWidth)
    }
  }

  const widgets = []
  for (let i = 0; i < maxLine; i++) {
    const line = lines[i]
    if (!line.result && !line.error) continue

    const docLine = doc.line(i + 1)
    const lineLength = docLine.length
    const resultStr = line.result ? `= ${line.result}` : `⚠ ${line.error}`
    const className = line.result ? 'calcnotes-inline-result' : 'calcnotes-inline-error'

    let padText
    if (alignRight && targetCol > 0) {
      const padCount = Math.max(4, targetCol - lineLength - resultStr.length)
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

// --- Build markdown preview decorations ---
const buildMdDecorations = (view) => {
  if (!props.showMarkdownPreview) return Decoration.none

  const doc = view.state.doc
  const cursorLine = doc.lineAt(view.state.selection.main.head).number
  const widgets = []

  for (let ln = 1; ln <= doc.lines; ln++) {
    const docLine = doc.line(ln)
    const text = docLine.text
    const trimmed = text.trim()
    if (!trimmed || ln === cursorLine) continue

    // # Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s(.+)$/)
    if (headerMatch) {
      const hashes = headerMatch[1]
      const prefixLen = text.indexOf(hashes) + hashes.length + 1
      widgets.push(Decoration.mark({ class: 'calcnotes-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixLen))
      widgets.push(Decoration.mark({ class: `calcnotes-md-h${hashes.length}` }).range(docLine.from + prefixLen, docLine.to))
      continue
    }

    // // Comments
    if (trimmed.startsWith('//')) {
      const slashIdx = text.indexOf('//')
      const afterSlash = text.substring(slashIdx + 2)
      const spaceAfter = afterSlash.startsWith(' ') ? 1 : 0
      const prefixEnd = slashIdx + 2 + spaceAfter
      widgets.push(Decoration.mark({ class: 'calcnotes-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      widgets.push(Decoration.mark({ class: 'calcnotes-md-comment' }).range(docLine.from + prefixEnd, docLine.to))
      continue
    }

    // - [x] / - [ ] Checkboxes
    const checkMatch = trimmed.match(/^- \[([ x])\]\s(.+)$/)
    if (checkMatch) {
      const checked = checkMatch[1] === 'x'
      const prefixStr = checked ? '- [x] ' : '- [ ] '
      const prefixStart = text.indexOf(prefixStr)
      const prefixEnd = prefixStart + prefixStr.length
      widgets.push(Decoration.mark({ class: 'calcnotes-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      widgets.push(Decoration.widget({
        widget: new MdPrefixWidget(checked ? '\u2611\u2009' : '\u2610\u2009', 'calcnotes-md-check-icon'),
        side: -1,
      }).range(docLine.from + prefixEnd))
      widgets.push(Decoration.mark({
        class: checked ? 'calcnotes-md-checked' : 'calcnotes-md-unchecked'
      }).range(docLine.from + prefixEnd, docLine.to))
      continue
    }

    // - List items
    const listMatch = trimmed.match(/^- (.+)$/)
    if (listMatch) {
      const dashIdx = text.indexOf('- ')
      const prefixEnd = dashIdx + 2
      widgets.push(Decoration.mark({ class: 'calcnotes-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      widgets.push(Decoration.widget({
        widget: new MdPrefixWidget('\u2022\u2009', 'calcnotes-md-bullet'),
        side: -1,
      }).range(docLine.from + prefixEnd))
      widgets.push(Decoration.mark({ class: 'calcnotes-md-list-item' }).range(docLine.from + prefixEnd, docLine.to))
      continue
    }

    // > Blockquotes
    const quoteMatch = trimmed.match(/^>\s?(.+)$/)
    if (quoteMatch) {
      const gtIdx = text.indexOf('>')
      const afterGt = text.substring(gtIdx + 1)
      const spaceAfterGt = afterGt.startsWith(' ') ? 1 : 0
      const prefixEnd = gtIdx + 1 + spaceAfterGt
      widgets.push(Decoration.mark({ class: 'calcnotes-md-hidden-syntax' }).range(docLine.from, docLine.from + prefixEnd))
      widgets.push(Decoration.widget({
        widget: new MdPrefixWidget('\u2503\u2009', 'calcnotes-md-quote-bar'),
        side: -1,
      }).range(docLine.from + prefixEnd))
      widgets.push(Decoration.mark({ class: 'calcnotes-md-quote' }).range(docLine.from + prefixEnd, docLine.to))
      continue
    }
  }

  return Decoration.set(widgets, true)
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
const cmBasicSetup = computed(() => ({
  lineNumbers: editorLineNumbers.value !== 'off',
  foldGutter: props.localePreferences?.editorFolding ?? true,
  highlightActiveLine: (props.localePreferences?.editorRenderLineHighlight ?? 'line') !== 'none',
  highlightActiveLineGutter: (props.localePreferences?.editorRenderLineHighlight ?? 'line') !== 'none',
  bracketMatching: true,
  closeBrackets: (props.localePreferences?.editorAutoClosingBrackets ?? 'always') !== 'never',
  autocompletion: false,
  highlightSelectionMatches: true,
  tabSize: props.localePreferences?.editorTabSize ?? 2,
  drawSelection: true,
  rectangularSelection: true,
  crosshairCursor: false,
  dropCursor: true,
  allowMultipleSelections: true,
  indentOnInput: true,
  // Disable the default syntaxHighlighting so our custom HighlightStyle
  // from useCalcLanguage is the sole source of token colours.
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
// our own calcnotes themes (in extensions via themeCompartment) handle everything.
const cmThemeMode = 'none'

// --- Extensions array ---
const cmExtensions = computed(() => [
  calcnotesLanguage,
  themeCompartment.of(colorMode.value === 'dark' ? calcnotesDarkTheme : calcnotesLightTheme),
  fontThemeCompartment.of(buildFontTheme()),
  inlineResultField,
  mdPreviewField,
  buildKeymap(),
  // Cursor position tracking
  EditorView.updateListener.of((update) => {
    if (update.selectionSet || update.docChanged) {
      const line = update.state.doc.lineAt(update.state.selection.main.head)
      currentLine.value = line.number - 1
    }
  }),
  // Word wrap
  props.localePreferences?.editorWordWrap ? EditorView.lineWrapping : [],
  // Click handler for inline results (copy on click)
  EditorView.domEventHandlers({
    click: handleResultClick,
    touchend: handleResultTouch,
  }),
])

// --- Click/touch handlers for inline result copy ---
const handleResultClick = (event, view) => {
  if (!props.showInline || !autoCopyResult.value) return false
  const el = event.target
  if (!el || !el.classList.contains('calcnotes-inline-result')) return false

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
  if (!el || !el.classList.contains('calcnotes-inline-result')) return false

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
})

// Compute initial results on mount
onMounted(() => {
  updateLines(props.content)
})

// --- Watchers ---

// Re-format display when locale preferences change
watch(() => props.localePreferences, () => {
  reformatDisplay()
  // Reconfigure font theme
  if (editorView) {
    editorView.dispatch({
      effects: fontThemeCompartment.reconfigure(buildFontTheme())
    })
  }
}, { deep: true })

// Theme changes
watch(() => colorMode.value, () => {
  if (!editorView) return
  editorView.dispatch({
    effects: themeCompartment.reconfigure(
      colorMode.value === 'dark' ? calcnotesDarkTheme : calcnotesLightTheme
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
    if (props.showMarkdownPreview) updateMarkdownPreview()
  })
})

watch(() => props.showInline, () => updateInlineDecorations())
watch(() => props.localePreferences?.inlineResultAlign, () => updateInlineDecorations())

// Markdown preview toggle
watch(() => props.showMarkdownPreview, () => nextTick(() => updateMarkdownPreview()))

// Cursor line change → re-render markdown (reveal raw on cursor line)
watch(currentLine, () => {
  if (props.showMarkdownPreview && editorView) {
    nextTick(() => updateMarkdownPreview())
  }
})

// External content changes (switching notes, inserting templates)
watch(() => props.content, (newContent) => {
  if (localContent.value !== newContent) {
    localContent.value = newContent
    // Evaluate immediately (skip debounce) so results appear instantly
    updateLines(newContent)
  }
})

const debouncedUpdateLines = useDebounceFn((text) => updateLines(text), 80)

watch(localContent, (newContent) => {
  emit('update:content', newContent)
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
  rawLines.value = evaluateLines(lines)
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
  const style = document.createElement('style')
  style.textContent = `
    .calcnotes-inline-result { color: #CC2D56; font-style: italic; opacity: 0.75; cursor: pointer; }
    .cm-theme-dark .calcnotes-inline-result,
    .dark .calcnotes-inline-result { color: #FF6188; opacity: 0.7; }
    .calcnotes-inline-error { color: #dc2626; font-style: italic; opacity: 0.65; cursor: default; }
    .cm-theme-dark .calcnotes-inline-error,
    .dark .calcnotes-inline-error { color: #FC9867; }
    .calcnotes-inline-pad { cursor: default; }
    .calcnotes-md-hidden-syntax { font-size: 0 !important; letter-spacing: 0 !important; width: 0 !important; display: inline-block; overflow: hidden; }
    .calcnotes-md-h1 { font-size: 1.7em !important; font-weight: 700 !important; }
    .calcnotes-md-h2 { font-size: 1.4em !important; font-weight: 600 !important; }
    .calcnotes-md-h3 { font-size: 1.2em !important; font-weight: 600 !important; }
    .calcnotes-md-h4 { font-size: 1.1em !important; font-weight: 600 !important; }
    .calcnotes-md-h5 { font-size: 1.05em !important; font-weight: 600 !important; }
    .calcnotes-md-h6 { font-size: 1em !important; font-weight: 600 !important; }
    .calcnotes-md-comment { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: normal !important; color: #939293 !important; }
    .cm-theme-dark .calcnotes-md-comment,
    .dark .calcnotes-md-comment { color: #727072 !important; }
    .calcnotes-md-list-item { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    .calcnotes-md-bullet { opacity: 0.6; }
    .calcnotes-md-checked { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; text-decoration: line-through !important; opacity: 0.6 !important; }
    .calcnotes-md-unchecked { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    .calcnotes-md-check-icon { font-style: normal !important; }
    .calcnotes-md-quote { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: italic !important; opacity: 0.85 !important; }
    .calcnotes-md-quote-bar { color: #FF6188 !important; font-style: normal !important; }
    .cm-theme-dark .calcnotes-md-quote-bar,
    .dark .calcnotes-md-quote-bar { color: #FF6188 !important; }
    .calcnotes-inline-copied-toast {
      position: absolute; pointer-events: none; z-index: 100;
      padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;
      color: #4D8C2A; background: #F0FDF4; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      white-space: nowrap;
    }
    .dark .calcnotes-inline-copied-toast { color: #A9DC76; background: #221F22; }
    .calcnotes-toast-float-up { animation: calcnotes-float-up 0.8s ease-out forwards; }
    @keyframes calcnotes-float-up {
      0% { opacity: 1; transform: translateY(0); }
      70% { opacity: 1; transform: translateY(-4px); }
      100% { opacity: 0; transform: translateY(-8px); }
    }
    .calcnotes-toast-fade { animation: calcnotes-fade 0.8s ease-in-out forwards; }
    @keyframes calcnotes-fade {
      0% { opacity: 0; } 15% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; }
    }
    .calcnotes-toast-scale-pop { animation: calcnotes-scale-pop 0.8s ease-out forwards; }
    @keyframes calcnotes-scale-pop {
      0% { opacity: 0; transform: scale(0.5); }
      20% { opacity: 1; transform: scale(1.15); }
      35% { transform: scale(1); } 70% { opacity: 1; }
      100% { opacity: 0; transform: scale(0.9); }
    }
    .calcnotes-toast-slide-right { animation: calcnotes-slide-right 0.8s ease-out forwards; }
    @keyframes calcnotes-slide-right {
      0% { opacity: 0; transform: translateX(-12px); }
      20% { opacity: 1; transform: translateX(0); }
      70% { opacity: 1; }
      100% { opacity: 0; transform: translateX(8px); }
    }
    .calcnotes-toast-bounce { animation: calcnotes-bounce 0.8s ease-out forwards; }
    @keyframes calcnotes-bounce {
      0% { opacity: 0; transform: translateY(6px); }
      25% { opacity: 1; transform: translateY(-6px); }
      45% { transform: translateY(2px); } 60% { transform: translateY(-2px); }
      75% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; }
    }
    .calcnotes-toast-glow { animation: calcnotes-glow 0.8s ease-out forwards; }
    @keyframes calcnotes-glow {
      0% { opacity: 0; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      20% { opacity: 1; box-shadow: 0 0 8px 2px rgba(16,185,129,0.5); }
      60% { opacity: 1; box-shadow: 0 0 2px 0 rgba(16,185,129,0.2); }
      100% { opacity: 0; box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .calcnotes-toast-none { animation: calcnotes-none 0.6s forwards; }
    @keyframes calcnotes-none {
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
  toast.className = `calcnotes-inline-copied-toast calcnotes-toast-${animStyle}`
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

const copyResult = async (result, index) => {
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

defineExpose({
  insertText,
  wrapSelection,
})
</script>
