<template>
  <div class="relative numori-codeblock rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
    <!-- Highlighted content -->
    <div ref="contentEl" class="p-3.5 font-mono text-[13px] leading-[1.7] space-y-0">
      <div v-for="(line, i) in highlightedLines" :key="i" class="whitespace-pre-wrap">
        <template v-if="line.length === 0">&nbsp;</template>
        <template v-for="(span, j) in line" :key="j">
          <span v-if="span.cls" :class="span.cls">{{ span.text }}</span>
          <template v-else>{{ span.text }}</template>
        </template>
      </div>
    </div>
    <!-- Action buttons -->
    <div class="flex items-center gap-2 px-3.5 pb-3 -mt-1">
      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 active:bg-gray-200 dark:active:bg-gray-600/50 transition-colors"
        @click="handleCopy"
      >
        <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-3.5 h-3.5" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
      <button
        v-if="canInsert"
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 active:bg-primary-100 dark:active:bg-primary-900/50 transition-colors"
        @click="handleInsert"
      >
        <Icon name="mdi:file-plus-outline" class="w-3.5 h-3.5" />
        <span>Insert in note</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { tokenizeLine, tokenToClasses } from '~/composables/useNumoriHighlight'

const props = defineProps({
  lines: { type: Array, default: () => [] },
})

const canInsert = inject('helpCanInsert', ref(false))
const onInsert = inject('helpOnInsert', null)

const contentEl = ref(null)
const copied = ref(false)

// Highlight lines using the numori tokenizer
const highlightedLines = computed(() => {
  if (props.lines.length === 0) return []
  return props.lines.map((line) => {
    if (!line.trim()) return []
    const tokens = tokenizeLine(line)
    return tokens.map((t) => ({
      text: t.text,
      cls: tokenToClasses(t.token),
    }))
  })
})

// Extract just the input expressions for copy/insert
const extractText = () => {
  return props.lines.filter((l) => l.trim()).join('\n')
}

const handleCopy = async () => {
  const text = extractText()
  if (text) {
    try { await navigator.clipboard.writeText(text) } catch (_e) { /* clipboard unavailable */ }
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const handleInsert = () => {
  const text = extractText()
  if (text && onInsert) onInsert(text)
}
</script>

<style>
/* Light mode numori highlighting */
.numori-codeblock {
  background-color: #FCFCFA;
}
.numori-heading { color: #2D2A2E; font-weight: 700; }
.numori-comment { color: #939293; font-style: italic; }
.numori-label { color: #727072; font-weight: 600; }
.numori-keyword { color: #CC2D56; font-weight: 600; }
.numori-opkeyword { color: #939293; }
.numori-typename { color: #1A8A9A; }
.numori-function { color: #4D8C2A; }
.numori-atom { color: #7B5FC4; }
.numori-unit { color: #C4621A; }
.numori-number { color: #A68A1B; }
.numori-string { color: #C4621A; }
.numori-variable { color: #2D2A2E; }
.numori-operator { color: #C1C0C0; }
.numori-bracket { color: #C1C0C0; }

/* Dark mode numori highlighting */
.dark .numori-codeblock {
  background-color: #2D2A2E;
}
.dark .numori-heading { color: #FCFCFA; font-weight: 700; }
.dark .numori-comment { color: #727072; font-style: italic; }
.dark .numori-label { color: #C1C0C0; font-weight: 600; }
.dark .numori-keyword { color: #FF6188; font-weight: 600; }
.dark .numori-opkeyword { color: #727072; }
.dark .numori-typename { color: #78DCE8; }
.dark .numori-function { color: #A9DC76; }
.dark .numori-atom { color: #AB9DF2; }
.dark .numori-unit { color: #FC9867; }
.dark .numori-number { color: #FFD866; }
.dark .numori-string { color: #FC9867; }
.dark .numori-variable { color: #FCFCFA; }
.dark .numori-operator { color: #5B595C; }
.dark .numori-bracket { color: #5B595C; }
</style>
