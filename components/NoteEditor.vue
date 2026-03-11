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
        <MonacoEditor ref="editorRef" v-model="localContent" :options="editorOptions" lang="calcnotes" class="h-full" />
      </ClientOnly>
    </div>

    <!-- Results column (separate, synced scroll) -->
    <div :class="[
      'flex-shrink-0 overflow-hidden bg-white dark:bg-gray-925 transition-all duration-200 ease-in-out',
      props.showResults ? 'opacity-100 border-l border-gray-200 dark:border-gray-800' : 'w-0 opacity-0',
      bordered && props.showResults ? 'ml-2 rounded-lg' : ''
    ]" :style="props.showResults ? { width: sidebarWidth + 'px' } : {}">
      <div :style="{ width: sidebarWidth + 'px', transform: `translateY(-${scrollTop}px)` }">
        <div class="p-0">
          <div v-for="(line, index) in displayLines" :key="index" :class="[
            'text-right whitespace-nowrap leading-6 flex items-center justify-end gap-2',
            currentLine === index ? 'bg-primary-100 dark:bg-primary-900' : ''
          ]" :style="{ height: lineHeight + 'px' }">
            <span v-if="line.result" @click="copyResult(line.result)"
              :class="[
                'text-primary-600 dark:text-primary-400 text-lg hover:text-primary-700 dark:hover:text-primary-400 transition-colors pl-1',
                autoCopyResult ? 'cursor-pointer' : 'cursor-default'
              ]">{{
                line.result }}</span>
            <span v-else-if="line.error" class="text-error-500 dark:text-error-400 text-sm italic">{{ line.error
              }}</span>
          </div>
        </div>
      </div>
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
    default: true
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

// Try to setup Monaco after mount
onMounted(async () => {
  updateLines(props.content)

  // Wait for Monaco to be available
  await nextTick()

  // Try multiple times to find Monaco
  let attempts = 0
  const maxAttempts = 20

  const trySetupMonaco = () => {
    attempts++

    // Try to import monaco-editor directly
    import('monaco-editor').then((monaco) => {
      setupMonaco(monaco)
    }).catch(() => {
      // Try window.monaco
      if (window.monaco) {
        setupMonaco(window.monaco)
      } else if (attempts < maxAttempts) {
        setTimeout(trySetupMonaco, 200)
      }
    })
  }

  setTimeout(trySetupMonaco, 500)
})

const setupMonaco = (monaco) => {
  try {
    // Firefox workaround: Monaco crashes when caretPositionFromPoint returns null
    // during hit-testing (e.g. text selection). Patch it to return a safe fallback.
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

    // Register language first
    registerCalcLanguage(monaco)

    // Set theme
    const themeName = colorMode.value === 'dark' ? 'calcnotes-dark' : 'calcnotes-light'
    monaco.editor.setTheme(themeName)

    // Get the editor instance - try multiple times if needed
    const attachListeners = () => {
      if (!editorRef.value) return false

      const editorComponent = editorRef.value

      // Try different ways to access the editor
      const editor = editorComponent.editor ||
        editorComponent.$editor ||
        editorComponent._editor ||
        editorComponent

      if (editor && editor.getModel && typeof editor.onDidChangeCursorPosition === 'function') {
        const currentModel = editor.getModel()

        if (currentModel) {
          // Get current content
          const content = currentModel.getValue()

          // Dispose old model
          currentModel.dispose()

          // Create new model with calcnotes language
          const newModel = monaco.editor.createModel(content, 'calcnotes')

          // Set the new model
          editor.setModel(newModel)
        }

        // Listen for cursor position changes
        editor.onDidChangeCursorPosition((e) => {
          currentLine.value = e.position.lineNumber - 1 // Monaco uses 1-based line numbers
        })

        // Listen for scroll changes to sync results column
        editor.onDidScrollChange((e) => {
          scrollTop.value = e.scrollTop
        })

        // Set initial cursor position
        const position = editor.getPosition()
        if (position) {
          currentLine.value = position.lineNumber - 1
        }

        return true
      }

      return false
    }

    // Try to attach listeners immediately
    if (!attachListeners()) {
      // If it fails, try again after a delay
      let retries = 0
      const retryInterval = setInterval(() => {
        if (attachListeners() || retries++ > 10) {
          clearInterval(retryInterval)
        }
      }, 200)
    }
  } catch (e) {
    console.error('Error setting up Monaco:', e)
  }
}

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

const copyResult = async (result) => {
  if (!autoCopyResult.value) return
  try {
    await navigator.clipboard.writeText(result)
  } catch (err) {
    console.error('Failed to copy:', err)
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

// Expose methods for toolbar actions
const insertText = (text) => {
  if (!editorRef.value) {
    // Fallback: append to content
    const newContent = localContent.value + text
    localContent.value = newContent
    emit('update:content', newContent)
    return
  }

  const editorComponent = editorRef.value
  const editor = editorComponent.editor ||
    editorComponent.$editor ||
    editorComponent._editor ||
    editorComponent

  if (editor && editor.getModel && typeof editor.executeEdits === 'function') {
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
  if (!editorRef.value) {
    // Fallback: append to content
    const newContent = localContent.value + before + after
    localContent.value = newContent
    emit('update:content', newContent)
    return
  }

  const editorComponent = editorRef.value
  const editor = editorComponent.editor ||
    editorComponent.$editor ||
    editorComponent._editor ||
    editorComponent

  if (editor && editor.getModel && typeof editor.executeEdits === 'function') {
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
