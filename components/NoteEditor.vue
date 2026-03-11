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

    <!-- Results column (separate, synced scroll) -->
    <ResultsPanel
      :lines="displayLines"
      :visible="props.showResults"
      :bordered="bordered"
      :width="sidebarWidth"
      :scroll-top="scrollTop"
      :current-line="currentLine"
      :line-height="lineHeight"
      :copyable="autoCopyResult"
      :copied-index="copiedIndex"
      @copy-result="copyResult" />
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
    default: true
  },
  showInline: {
    type: Boolean,
    default: false
  },
  bordered: {
    type: Boolean,
    default: false
  },
  localePreferences: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:content'])

const displayLines = ref([])
const rawLines = ref([])     // cached raw calculator output (never locale-formatted)
const scrollTop = ref(0)
const currentLine = ref(0)
const lineHeight = computed(() => props.localePreferences?.editorLineHeight ?? 19)
const localContent = ref(props.content)
const editorRef = ref(null)
const copiedIndex = ref(null)
let copiedTimeout = null

// Inline result decorations
let monacoEditorInstance = null
let decorationsCollection = null
let monacoInstance = null
let inlineStylesInjected = false

const { evaluateLines } = useCalculator()
const { registerCalcLanguage } = useMonacoCalcLanguage()
const colorMode = useColorMode()
import { formatDisplay } from '~/composables/useDisplayFormatter'

const FONT_FAMILY_MAP = {
  'system': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  'fira-code': "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'jetbrains-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'source-code-pro': "'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'cascadia-code': "'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  'ibm-plex-mono': "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
}

const sidebarWidth = computed(() => props.localePreferences?.resultsSidebarWidth ?? 256)
const editorFontSize = computed(() => props.localePreferences?.editorFontSize ?? 16)
const editorFontFamily = computed(() => FONT_FAMILY_MAP[props.localePreferences?.editorFontFamily] ?? FONT_FAMILY_MAP.system)
const editorWordWrap = computed(() => props.localePreferences?.editorWordWrap ? 'on' : 'off')
const editorLineNumbers = computed(() => {
  const val = props.localePreferences?.editorLineNumbers
  return ['on', 'off', 'relative', 'interval'].includes(val) ? val : 'on'
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
})

// Editor options
const editorOptions = computed(() => ({
  theme: colorMode.value === 'dark' ? 'vs-dark' : 'vs',
  fontSize: editorFontSize.value,
  fontFamily: editorFontFamily.value,
  lineHeight: lineHeight.value,
  minimap: { enabled: false },
  scrollBeyondLastLine: true,
  wordWrap: editorWordWrap.value,
  lineNumbers: editorLineNumbers.value,
  glyphMargin: true,
  folding: true,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  renderLineHighlight: 'line',
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
  // Workaround for Monaco bug on Firefox: accessibilitySupport "auto" breaks
  // keyboard text replacement (first keystroke after selection is swallowed).
  // See: https://github.com/microsoft/monaco-editor/issues/4892
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

    // Listen for scroll changes to sync results column
    editor.onDidScrollChange((e) => {
      scrollTop.value = e.scrollTop
    })

    // Re-render right-aligned decorations when editor is resized
    editor.onDidLayoutChange(() => {
      if (props.localePreferences?.inlineResultAlign === 'right' && props.showInline) {
        updateInlineDecorations()
      }
    })

    // Set initial cursor position
    const position = editor.getPosition()
    if (position) {
      currentLine.value = position.lineNumber - 1
    }

    // Apply real decorations
    updateInlineDecorations()
  })
}

// Re-apply decorations whenever displayLines or showResults mode changes
watch(displayLines, () => {
  updateInlineDecorations()
})

watch(() => props.showInline, () => {
  updateInlineDecorations()
})

watch(() => props.localePreferences?.inlineResultAlign, () => {
  updateInlineDecorations()
})

// Watch for external content changes (e.g. switching notes, inserting templates)
watch(() => props.content, (newContent) => {
  if (localContent.value !== newContent) {
    localContent.value = newContent
  }
  updateLines(newContent)
})

// Watch local content and emit changes + update calculations
watch(localContent, (newContent) => {
  emit('update:content', newContent)
  updateLines(newContent)
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

// Inject CSS for inline result decorations (once)
const injectInlineStyles = () => {
  if (inlineStylesInjected) return
  inlineStylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .calcnotes-inline-result { color: #0062a3; font-style: italic; opacity: 0.85; }
    .vs-dark .calcnotes-inline-result { color: #4fc1ff; }
    .calcnotes-inline-error { color: #f44336; font-style: italic; opacity: 0.75; }
    .vs-dark .calcnotes-inline-error { color: #ef5350; }
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

    let text
    if (alignRight && targetCol > 0) {
      // Pad so the result ends near the right edge of the visible area
      // totalUsed = lineLength (existing text) + padding + resultStr.length
      // We want totalUsed ≈ targetCol, so padding = targetCol - lineLength - resultStr.length
      const padCount = Math.max(4, targetCol - lineLength - resultStr.length)
      text = ' '.repeat(padCount) + resultStr
    } else {
      text = `  ${resultStr}`
    }

    const className = line.result ? 'calcnotes-inline-result' : 'calcnotes-inline-error'

    newDecorations.push({
      range: new monacoInstance.Range(lineNumber, lineLength + 1, lineNumber, lineLength + 1),
      options: {
        description: 'calcnotes-inline-result',
        after: {
          content: text,
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
  copiedIndex.value = index
  clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => {
    copiedIndex.value = null
  }, 800)
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
