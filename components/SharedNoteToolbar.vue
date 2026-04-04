<template>
  <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg px-2 py-1.5">
    <!-- Left: View controls -->
    <div class="inline-flex items-center bg-gray-200/50 dark:bg-gray-800 rounded-lg" role="group">
      <button @click="$emit('update:renderMarkdown', true)"
        class="p-1.5 rounded-lg transition-all leading-none"
        :class="renderMarkdown
          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
        title="Render Markdown">
        <Icon name="mdi:language-markdown" class="w-4.5 h-4.5 block" />
      </button>
      <button @click="$emit('update:renderMarkdown', false)"
        class="p-1.5 rounded-lg transition-all leading-none"
        :class="!renderMarkdown
          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
        title="Raw text">
        <Icon name="mdi:format-text" class="w-4.5 h-4.5 block" />
      </button>
    </div>

    <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-0.5"></div>

    <div class="inline-flex items-center bg-gray-200/50 dark:bg-gray-800 rounded-lg" role="group">
      <button @click="$emit('update:resultsPosition', 'left')"
        class="p-1.5 rounded-lg transition-all leading-none"
        :class="resultsPosition === 'left'
          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
        title="Results on left">
        <Icon name="mdi:dock-left" class="w-4.5 h-4.5 block" />
      </button>
      <button @click="$emit('update:resultsPosition', 'off')"
        class="p-1.5 rounded-lg transition-all leading-none"
        :class="resultsPosition === 'off'
          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
        title="Results off">
        <Icon name="mdi:eye-off-outline" class="w-4.5 h-4.5 block" />
      </button>
      <button @click="$emit('update:resultsPosition', 'right')"
        class="p-1.5 rounded-lg transition-all leading-none"
        :class="resultsPosition === 'right'
          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
        title="Results on right">
        <Icon name="mdi:dock-right" class="w-4.5 h-4.5 block" />
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Right: Actions -->
    <button @click="$emit('import')"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      title="Import to my notes">
      <Icon name="mdi:download" class="w-4 h-4 block" />
      <span class="hidden sm:inline">Import</span>
    </button>

    <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-0.5"></div>

    <button @click="handleCopy"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
      :title="copied ? 'Copied!' : 'Copy to clipboard'">
      <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4 block" :class="copied ? 'text-green-500' : ''" />
      <span class="hidden sm:inline">{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>

    <div class="relative" ref="exportMenuRef">
      <button @click="showExportMenu = !showExportMenu"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
        title="Export note">
        <Icon name="mdi:export" class="w-4 h-4 block" />
        <span class="hidden sm:inline">Export</span>
        <Icon name="mdi:chevron-down" class="w-3 h-3 block transition-transform" :class="{ 'rotate-180': showExportMenu }" />
      </button>
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95">
        <div v-if="showExportMenu"
          :class="['absolute right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-52', dropUp ? 'bottom-full mb-1' : 'top-full']">
          <button @click="emitExport('text')"
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <Icon name="mdi:file-document-outline" class="w-4 h-4 block flex-shrink-0" />
            <span>Text (.txt)</span>
          </button>
          <button @click="emitExport('markdown')"
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <Icon name="mdi:language-markdown-outline" class="w-4 h-4 block flex-shrink-0" />
            <span>Markdown (.md)</span>
          </button>
          <button @click="emitExport('pdf')"
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <Icon name="mdi:file-pdf-box" class="w-4 h-4 block flex-shrink-0" />
            <span>PDF</span>
          </button>
          <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
          <button @click="emitExport('json')"
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <Icon name="mdi:code-json" class="w-4 h-4 block flex-shrink-0" />
            <span>Export as JSON</span>
          </button>
        </div>
      </Transition>
    </div>

    <button @click="$emit('print')"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
      title="Print">
      <Icon name="mdi:printer" class="w-4 h-4 block" />
      <span class="hidden sm:inline">Print</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  renderMarkdown: { type: Boolean, default: true },
  resultsPosition: { type: String, default: 'left' },
  copied: { type: Boolean, default: false },
  dropUp: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:renderMarkdown',
  'update:resultsPosition',
  'copy',
  'export',
  'print',
  'import',
])

const showExportMenu = ref(false)
const exportMenuRef = ref(null)

const handleCopy = () => emit('copy')

const emitExport = (format) => {
  showExportMenu.value = false
  emit('export', format)
}

onClickOutside(exportMenuRef, () => {
  showExportMenu.value = false
})
</script>
