<template>
  <div class="h-full flex">
    <!-- Monaco Editor -->
    <div :class="[
      'flex-1 overflow-hidden transition-all duration-200 ease-in-out',
      bordered ? 'border border-gray-200 dark:border-gray-700 rounded-lg' : ''
    ]">
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
        <MonacoEditor ref="editorRef" v-model="localContent" :options="editorOptions" lang="calcnotes" class="h-full" @load="onEditorLoad" />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Start typing... (e.g., 10 + 20)'
  },
  showResults: {
    type: Boolean,
    default: false
  },
  showInline: {
    type: Boolean,
    default: true
  },
  bordered: {
    type: Boolean,
    default: false
  },
  localePreferences: {
    type: Object,
    default: null
  },
  showMarkdownPreview: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:content'])

const displayLines = ref([])
const rawLines = ref([])     // cached raw calculator output (never locale-formatted)
const currentLine = ref(0)
const lineHeight = computed(() => props.localePreferences?.editorLineHeight ?? 19)
const localContent = ref(props.content)
const editorRef = ref(null)

// Inline result decorations
let monacoEditorInstance = null
let decorationsCollection = null
let monacoInstance = null
let inlineStylesInjected = false
let updateDebounceTimer = null

const { evaluateLines } = useCalculator()
const { registerCalcLanguage } = useMonacoCalcLanguage()
const colorMode = useColorMode()
import { formatDisplay } from '~/composables/useDisplayFormatter'

// --- Inline markdown rendering via Monaco decorations ---
let mdDecorationCollection = null

const updateMarkdownPreview = () => {
  if (!monacoEditorInstance || !monacoInstance) return
  const editor = monacoEditorInstance

  if (mdDecorationCollection) mdDecorationCollection.set([])

  if (!props.showMarkdownPreview) return

  const model = editor.getModel()
  if (!model) return

  const lineCount = model.getLineCount()
  const cursorLine = (editor.getPosition()?.lineNumber) ?? 0
  const decorations = []

  for (let ln = 1; ln <= lineCount; ln++) {
    const text = model.getLineContent(ln)
    const trimmed = text.trim()
    if (!trimmed) continue

    // Don't render the line the cursor is on — let user see raw source
    if (ln === cursorLine) continue

    // # Headers — hide the `# ` prefix, style the rest
    const headerMatch = trimmed.match(/^(#{1,6})\s(.+)$/)
    if (headerMatch) {
      const hashes = headerMatch[1]
      const prefixLen = text.indexOf(hashes) + hashes.length + 1 // includes the space
      decorations.push({
        range: new monacoInstance.Range(ln, 1, ln, prefixLen + 1),
        options: { inlineClassName: 'calcnotes-md-hidden-syntax', description: 'md-header-prefix' }
      })
      decorations.push({
        range: new monacoInstance.Range(ln, prefixLen + 1, ln, model.getLineMaxColumn(ln)),
        options: { inlineClassName: `calcnotes-md-h${hashes.length}`, description: 'md-header-text' }
      })
      continue
    }

    // // Comments — hide the `// ` prefix, style as prose
    if (trimmed.startsWith('//')) {
      const slashIdx = text.indexOf('//')
      const afterSlash = text.substring(slashIdx + 2)
      const spaceAfter = afterSlash.startsWith(' ') ? 1 : 0
      const prefixEnd = slashIdx + 2 + spaceAfter
      decorations.push({
        range: new monacoInstance.Range(ln, 1, ln, prefixEnd + 1),
        options: { inlineClassName: 'calcnotes-md-hidden-syntax', description: 'md-comment-prefix' }
      })
      decorations.push({
        range: new monacoInstance.Range(ln, prefixEnd + 1, ln, model.getLineMaxColumn(ln)),
        options: { inlineClassName: 'calcnotes-md-comment', description: 'md-comment-text' }
      })
      continue
    }

    // - [x] / - [ ] Checkboxes — hide the prefix, show a checkbox glyph
    const checkMatch = trimmed.match(/^- \[([ x])\]\s(.+)$/)
    if (checkMatch) {
      const checked = checkMatch[1] === 'x'
      const prefixStr = checked ? '- [x] ' : '- [ ] '
      const prefixStart = text.indexOf(prefixStr)
      const prefixEnd = prefixStart + prefixStr.length
      decorations.push({
        range: new monacoInstance.Range(ln, 1, ln, prefixEnd + 1),
        options: { inlineClassName: 'calcnotes-md-hidden-syntax', description: 'md-check-prefix' }
      })
      decorations.push({
        range: new monacoInstance.Range(ln, prefixEnd + 1, ln, model.getLineMaxColumn(ln)),
        options: {
          inlineClassName: checked ? 'calcnotes-md-checked' : 'calcnotes-md-unchecked',
          description: 'md-check-text',
          before: {
            content: checked ? '\u2611\u2009' : '\u2610\u2009',
            inlineClassName: 'calcnotes-md-check-icon',
          }
        }
      })
      continue
    }

    // - List items — hide the `- `, show a bullet
    const listMatch = trimmed.match(/^- (.+)$/)
    if (listMatch) {
      const dashIdx = text.indexOf('- ')
      decorations.push({
        range: new monacoInstance.Range(ln, 1, ln, dashIdx + 3),
        options: { inlineClassName: 'calcnotes-md-hidden-syntax', description: 'md-list-prefix' }
      })
      decorations.push({
        range: new monacoInstance.Range(ln, dashIdx + 3, ln, model.getLineMaxColumn(ln)),
        options: {
          inlineClassName: 'calcnotes-md-list-item',
          description: 'md-list-text',
          before: {
            content: '\u2022\u2009',
            inlineClassName: 'calcnotes-md-bullet',
          }
        }
      })
      continue
    }

    // > Blockquotes — hide the `> `, style with left border feel
    const quoteMatch = trimmed.match(/^>\s?(.+)$/)
    if (quoteMatch) {
      const gtIdx = text.indexOf('>')
      const afterGt = text.substring(gtIdx + 1)
      const spaceAfterGt = afterGt.startsWith(' ') ? 1 : 0
      const prefixEnd = gtIdx + 1 + spaceAfterGt
      decorations.push({
        range: new monacoInstance.Range(ln, 1, ln, prefixEnd + 1),
        options: { inlineClassName: 'calcnotes-md-hidden-syntax', description: 'md-quote-prefix' }
      })
      decorations.push({
        range: new monacoInstance.Range(ln, prefixEnd + 1, ln, model.getLineMaxColumn(ln)),
        options: {
          inlineClassName: 'calcnotes-md-quote',
          description: 'md-quote-text',
          before: {
            content: '\u2503\u2009',
            inlineClassName: 'calcnotes-md-quote-bar',
          }
        }
      })
      continue
    }
  }

  if (mdDecorationCollection) {
    mdDecorationCollection.set(decorations)
  } else {
    mdDecorationCollection = editor.createDecorationsCollection(decorations)
  }
}

// When cursor moves, re-evaluate which line to reveal raw
watch(currentLine, () => {
  if (!props.showMarkdownPreview || !monacoEditorInstance) return
  nextTick(() => updateMarkdownPreview())
})

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
const editorWordWrap = computed(() => props.localePreferences?.editorWordWrap ? 'on' : 'off')
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

// Re-format display when locale preferences change (no recalculation)
watch(() => props.localePreferences, () => {
  reformatDisplay()
}, { deep: true })

// Live clock: update lines tagged liveTime every second
let liveTimer = null
const tickLiveTime = () => {
  const raw = rawLines.value
  if (!raw.length) return
  const hasLive = raw.some(l => l.liveTime)
  if (!hasLive) return

  // Update raw results for live-time lines with fresh timestamps
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

onMounted(() => {
  liveTimer = setInterval(tickLiveTime, 1000)
})
onUnmounted(() => {
  if (liveTimer) clearInterval(liveTimer)
  if (updateDebounceTimer) clearTimeout(updateDebounceTimer)
})

// Editor options
const editorOptions = computed(() => ({
  theme: colorMode.value === 'dark' ? 'vs-dark' : 'vs',
  fontSize: editorFontSize.value,
  fontFamily: editorFontFamily.value,
  fontLigatures: props.localePreferences?.editorLigatures ?? false,
  lineHeight: lineHeight.value,
  minimap: { enabled: props.localePreferences?.editorMinimap ?? false },
  scrollBeyondLastLine: true,
  wordWrap: editorWordWrap.value,
  lineNumbers: editorLineNumbers.value,
  cursorStyle: editorCursorStyle.value,
  cursorBlinking: editorCursorBlinking.value,
  cursorSmoothCaretAnimation: props.localePreferences?.editorCursorSmoothCaret ? 'on' : 'off',
  smoothScrolling: props.localePreferences?.editorSmoothScrolling ?? false,
  glyphMargin: props.localePreferences?.editorGlyphMargin ?? true,
  folding: props.localePreferences?.editorFolding ?? true,
  stickyScroll: { enabled: props.localePreferences?.editorStickyScroll ?? false },
  renderWhitespace: props.localePreferences?.editorRenderWhitespace ?? 'none',
  autoClosingBrackets: props.localePreferences?.editorAutoClosingBrackets ?? 'always',
  autoClosingQuotes: props.localePreferences?.editorAutoClosingQuotes ?? 'always',
  bracketPairColorization: { enabled: props.localePreferences?.editorBracketPairColorization ?? true },
  tabSize: props.localePreferences?.editorTabSize ?? 2,
  renderLineHighlight: props.localePreferences?.editorRenderLineHighlight ?? 'line',
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    useShadows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  automaticLayout: true,
  accessibilitySupport: 'off',
}))

// Compute initial results on mount
onMounted(() => {
  updateLines(props.content)
})

// Called by nuxt-monaco-editor @load event — receives the raw IStandaloneCodeEditor
const onEditorLoad = (editor) => {
  useMonaco().then((monaco) => {
    monacoInstance = monaco
    monacoEditorInstance = editor

    injectInlineStyles()

    // Firefox workaround: Monaco crashes when caretPositionFromPoint returns null
    if (typeof document.caretPositionFromPoint === 'function') {
      const original = document.caretPositionFromPoint.bind(document)
      document.caretPositionFromPoint = (x, y) => {
        const result = original(x, y)
        if (!result) {
          return { offsetNode: document.body, offset: 0 }
        }
        return result
      }
    }

    // Register language and set theme
    registerCalcLanguage(monaco)
    const themeName = colorMode.value === 'dark' ? 'calcnotes-dark' : 'calcnotes-light'
    monaco.editor.setTheme(themeName)

    // Set language on the existing model (don't dispose — the component owns it)
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, 'calcnotes')
    }

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      currentLine.value = e.position.lineNumber - 1
    })

    // Re-render right-aligned decorations when editor is resized
    editor.onDidLayoutChange(() => {
      if (props.localePreferences?.inlineResultAlign === 'right' && props.showInline) {
        updateInlineDecorations()
      }
    })

    // Click-to-copy on inline result decorations
    editor.onMouseDown((e) => {
      if (!props.showInline || !autoCopyResult.value) return
      // Check if the click target is an inline result decoration
      const target = e.target
      if (target.type !== monacoInstance.editor.MouseTargetType.CONTENT_TEXT) return
      const el = target.element
      if (!el || !el.classList.contains('calcnotes-inline-result')) return

      const lineIndex = target.position.lineNumber - 1
      const line = displayLines.value[lineIndex]
      if (!line?.result) return

      copyResult(line.result, lineIndex)

      // Show a small "Copied" toast near the click
      const editorDom = editor.getDomNode()
      if (editorDom) {
        const animStyle = props.localePreferences?.copyAnimationStyle || 'float-up'
        const toast = document.createElement('div')
        toast.className = `calcnotes-inline-copied-toast calcnotes-toast-${animStyle}`
        toast.textContent = 'Copied'
        const rect = editorDom.getBoundingClientRect()
        toast.style.left = `${e.event.posx - rect.left}px`
        toast.style.top = lineIndex <= 1
          ? `${e.event.posy - rect.top + 8}px`
          : `${e.event.posy - rect.top - 24}px`
        editorDom.style.position = 'relative'
        editorDom.appendChild(toast)
        setTimeout(() => toast.remove(), 850)
      }
    })

    // Set initial cursor position
    const position = editor.getPosition()
    if (position) {
      currentLine.value = position.lineNumber - 1
    }

    // Apply real decorations
    updateInlineDecorations()
    updateMarkdownPreview()
  })
}

// Re-apply decorations whenever displayLines or showResults mode changes.
// Use nextTick so Monaco's model has ingested any pending content change first.
watch(displayLines, () => {
  nextTick(() => updateInlineDecorations())
})

watch(() => props.showInline, () => {
  updateInlineDecorations()
})

watch(() => props.localePreferences?.inlineResultAlign, () => {
  updateInlineDecorations()
})

// Re-render markdown preview when toggle or content changes
watch(() => props.showMarkdownPreview, () => {
  nextTick(() => updateMarkdownPreview())
})

watch(displayLines, () => {
  nextTick(() => {
    if (props.showMarkdownPreview) updateMarkdownPreview()
  })
})

// Watch for external content changes (e.g. switching notes, inserting templates)
watch(() => props.content, (newContent) => {
  if (localContent.value !== newContent) {
    localContent.value = newContent
    // Note switch: evaluate immediately (skip debounce) so results appear instantly
    clearTimeout(updateDebounceTimer)
    updateLines(newContent)
  }
  // If content is the same (e.g. re-render), do nothing — localContent watcher won't fire.
})

// Watch local content and emit changes + debounce calculations while typing
watch(localContent, (newContent) => {
  emit('update:content', newContent)
  clearTimeout(updateDebounceTimer)
  updateDebounceTimer = setTimeout(() => updateLines(newContent), 80)
})

const updateLines = (text) => {
  if (!text) {
    rawLines.value = []
    displayLines.value = []
    if (decorationsCollection) decorationsCollection.set([])
    return
  }
  const lines = text.split('\n')
  rawLines.value = evaluateLines(lines)
  reformatDisplay()
}

// Apply locale display formatting to cached raw results (no recalculation)
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

// Inject CSS for inline result decorations and markdown preview (once)
const injectInlineStyles = () => {
  if (inlineStylesInjected) return
  inlineStylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .calcnotes-inline-result { color: #0062a3; font-style: italic; opacity: 0.85; }
    .vs-dark .calcnotes-inline-result { color: #4fc1ff; }
    .calcnotes-inline-error { color: #f44336; font-style: italic; opacity: 0.75; }
    .vs-dark .calcnotes-inline-error { color: #ef5350; }
    .calcnotes-md-hidden-syntax { font-size: 0 !important; letter-spacing: 0 !important; width: 0 !important; }
    .calcnotes-md-h1 { font-size: 1.7em !important; font-weight: 700 !important; }
    .calcnotes-md-h2 { font-size: 1.4em !important; font-weight: 600 !important; }
    .calcnotes-md-h3 { font-size: 1.2em !important; font-weight: 600 !important; }
    .calcnotes-md-h4 { font-size: 1.1em !important; font-weight: 600 !important; }
    .calcnotes-md-h5 { font-size: 1.05em !important; font-weight: 600 !important; }
    .calcnotes-md-h6 { font-size: 1em !important; font-weight: 600 !important; }
    .calcnotes-md-comment { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: normal !important; color: #444 !important; }
    .vs-dark .calcnotes-md-comment { color: #bbb !important; }
    .calcnotes-md-list-item { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    .calcnotes-md-bullet { opacity: 0.6; }
    .calcnotes-md-checked { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; text-decoration: line-through !important; opacity: 0.6 !important; }
    .calcnotes-md-unchecked { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    .calcnotes-md-check-icon { font-style: normal !important; }
    .calcnotes-md-quote { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: italic !important; opacity: 0.85 !important; }
    .calcnotes-md-quote-bar { color: #007acc !important; font-style: normal !important; }
    .vs-dark .calcnotes-md-quote-bar { color: #4fc1ff !important; }
    .calcnotes-inline-result { cursor: pointer; }
    .calcnotes-inline-error { cursor: default; }
    .calcnotes-inline-pad { cursor: default; }
    .calcnotes-inline-copied-toast {
      position: absolute; pointer-events: none; z-index: 100;
      padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;
      color: #16a34a; background: #dcfce7; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      white-space: nowrap;
    }
    .vs-dark .calcnotes-inline-copied-toast { color: #4ade80; background: #14532d; }

    /* float-up (original) */
    .calcnotes-toast-float-up { animation: calcnotes-float-up 0.8s ease-out forwards; }
    @keyframes calcnotes-float-up {
      0% { opacity: 1; transform: translateY(0); }
      70% { opacity: 1; transform: translateY(-4px); }
      100% { opacity: 0; transform: translateY(-8px); }
    }

    /* fade */
    .calcnotes-toast-fade { animation: calcnotes-fade 0.8s ease-in-out forwards; }
    @keyframes calcnotes-fade {
      0% { opacity: 0; }
      15% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* scale-pop */
    .calcnotes-toast-scale-pop { animation: calcnotes-scale-pop 0.8s ease-out forwards; }
    @keyframes calcnotes-scale-pop {
      0% { opacity: 0; transform: scale(0.5); }
      20% { opacity: 1; transform: scale(1.15); }
      35% { transform: scale(1); }
      70% { opacity: 1; }
      100% { opacity: 0; transform: scale(0.9); }
    }

    /* slide-right */
    .calcnotes-toast-slide-right { animation: calcnotes-slide-right 0.8s ease-out forwards; }
    @keyframes calcnotes-slide-right {
      0% { opacity: 0; transform: translateX(-12px); }
      20% { opacity: 1; transform: translateX(0); }
      70% { opacity: 1; }
      100% { opacity: 0; transform: translateX(8px); }
    }

    /* bounce */
    .calcnotes-toast-bounce { animation: calcnotes-bounce 0.8s ease-out forwards; }
    @keyframes calcnotes-bounce {
      0% { opacity: 0; transform: translateY(6px); }
      25% { opacity: 1; transform: translateY(-6px); }
      45% { transform: translateY(2px); }
      60% { transform: translateY(-2px); }
      75% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; }
    }

    /* glow */
    .calcnotes-toast-glow { animation: calcnotes-glow 0.8s ease-out forwards; }
    @keyframes calcnotes-glow {
      0% { opacity: 0; box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
      20% { opacity: 1; box-shadow: 0 0 8px 2px rgba(22,163,74,0.5); }
      60% { opacity: 1; box-shadow: 0 0 2px 0 rgba(22,163,74,0.2); }
      100% { opacity: 0; box-shadow: 0 0 0 0 rgba(22,163,74,0); }
    }

    /* none */
    .calcnotes-toast-none { animation: calcnotes-none 0.6s forwards; }
    @keyframes calcnotes-none {
      0% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

// Update Monaco inline decorations from displayLines
const updateInlineDecorations = () => {
  if (!monacoEditorInstance || !monacoInstance) return

  // Only show inline decorations when enabled
  if (!props.showInline) {
    if (decorationsCollection) decorationsCollection.set([])
    return
  }

  const lines = displayLines.value
  const model = monacoEditorInstance.getModel()
  if (!model) return

  let modelLineCount
  try {
    modelLineCount = model.getLineCount()
  } catch {
    return
  }
  if (!modelLineCount || modelLineCount < 1) return

  const alignRight = props.localePreferences?.inlineResultAlign === 'right'

  // For right-alignment, calculate visible columns from editor layout
  let targetCol = 0
  if (alignRight) {
    const layoutInfo = monacoEditorInstance.getLayoutInfo()
    const charWidthPx = monacoEditorInstance.getOption(monacoInstance.editor.EditorOption.fontInfo).typicalHalfwidthCharacterWidth
    if (layoutInfo && charWidthPx > 0) {
      // contentWidth is the area where text is rendered (excludes line numbers, scrollbar, etc.)
      targetCol = Math.floor(layoutInfo.contentWidth / charWidthPx)
    }
  }

  const maxLine = Math.min(lines.length, modelLineCount)
  const newDecorations = []
  for (let i = 0; i < maxLine; i++) {
    const line = lines[i]
    if (!line.result && !line.error) continue

    const lineNumber = i + 1
    let lineLength
    try {
      lineLength = model.getLineLength(lineNumber)
    } catch {
      continue
    }

    const resultStr = line.result
      ? `= ${line.result}`
      : `⚠ ${line.error}`

    let padText
    if (alignRight && targetCol > 0) {
      const padCount = Math.max(4, targetCol - lineLength - resultStr.length)
      padText = ' '.repeat(padCount)
    } else {
      padText = '  '
    }

    const className = line.result ? 'calcnotes-inline-result' : 'calcnotes-inline-error'

    // Padding decoration (not clickable)
    newDecorations.push({
      range: new monacoInstance.Range(lineNumber, lineLength + 1, lineNumber, lineLength + 1),
      options: {
        description: 'calcnotes-inline-pad',
        after: {
          content: padText,
          inlineClassName: 'calcnotes-inline-pad',
        },
        showIfCollapsed: true,
      }
    })

    // Result decoration (clickable for results)
    newDecorations.push({
      range: new monacoInstance.Range(lineNumber, lineLength + 1, lineNumber, lineLength + 1),
      options: {
        description: 'calcnotes-inline-result',
        after: {
          content: resultStr,
          inlineClassName: className,
        },
        showIfCollapsed: true,
      }
    })
  }

  if (decorationsCollection) {
    decorationsCollection.set(newDecorations)
  } else {
    decorationsCollection = monacoEditorInstance.createDecorationsCollection(newDecorations)
  }
}

const copyResult = async (result, index) => {
  if (!autoCopyResult.value) return
  try {
    await navigator.clipboard.writeText(result)
  } catch {
    // WORKAROUND: Firefox does not support clipboard API on localhost over HTTP.
    // TODO: Remove this fallback once Firefox improves localhost clipboard support.
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
      return
    }
  }
}

// Watch for theme changes
watch(() => colorMode.value, (newMode) => {
  if (window.monaco) {
    const monaco = window.monaco
    const themeName = newMode === 'dark' ? 'calcnotes-dark' : 'calcnotes-light'
    monaco.editor.setTheme(themeName)
  }
})

// Helper to get the Monaco editor instance
const getEditor = () => monacoEditorInstance

// Expose methods for toolbar actions
const insertText = (text) => {
  const editor = getEditor()
  if (!editor) {
    // Fallback: append to content
    const newContent = localContent.value + text
    localContent.value = newContent
    emit('update:content', newContent)
    return
  }

  if (typeof editor.executeEdits === 'function') {
    const position = editor.getPosition()
    const range = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    }

    editor.executeEdits('toolbar', [{
      range: range,
      text: text,
      forceMoveMarkers: true
    }])

    // Move cursor after inserted text
    editor.setPosition({
      lineNumber: position.lineNumber,
      column: position.column + text.length
    })

    editor.focus()
  } else {
    // Fallback
    const newContent = localContent.value + text
    localContent.value = newContent
    emit('update:content', newContent)
  }
}

const wrapSelection = (before, after = before) => {
  const editor = getEditor()
  if (!editor) {
    // Fallback: append to content
    const newContent = localContent.value + before + after
    localContent.value = newContent
    emit('update:content', newContent)
    return
  }

  if (typeof editor.executeEdits === 'function') {
    const selection = editor.getSelection()
    const selectedText = editor.getModel().getValueInRange(selection)

    if (selectedText) {
      // Wrap selected text
      const wrappedText = before + selectedText + after
      editor.executeEdits('toolbar', [{
        range: selection,
        text: wrappedText,
        forceMoveMarkers: true
      }])

      // Select the wrapped content (excluding the wrapper)
      editor.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn + before.length,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn + before.length
      })
    } else {
      // No selection, insert at cursor with cursor between wrappers
      const position = editor.getPosition()
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      }

      editor.executeEdits('toolbar', [{
        range: range,
        text: before + after,
        forceMoveMarkers: true
      }])

      // Position cursor between the wrappers
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + before.length
      })
    }

    editor.focus()
  } else {
    // Fallback
    const newContent = localContent.value + before + after
    localContent.value = newContent
    emit('update:content', newContent)
  }
}

defineExpose({
  insertText,
  wrapSelection,
})
</script>
