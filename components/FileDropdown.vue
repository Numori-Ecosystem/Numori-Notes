<template>
  <div class="relative" ref="dropdownRef">
    <button @click="open = !open"
      class="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
      title="File menu">
      <Icon name="mdi:file-document-outline" class="w-4 h-4 block" />
      <span class="hidden sm:inline">File</span>
      <Icon name="mdi:chevron-down" class="w-3 h-3 block transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="open"
        class="absolute left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">

        <!-- Create -->
        <DropdownItem icon="mdi:plus" label="New Note" shortcut="Ctrl+N" @click="action('new-note')" />
        <DropdownItem icon="mdi:folder-open-outline" label="Open File…" shortcut="Ctrl+O" @click="action('open-file')" />
        <DropdownItem icon="mdi:content-duplicate" label="Duplicate Note" :disabled="!hasNote" @click="action('duplicate')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
        
        <DropdownItem icon="mdi:file-document-outline" label="Templates" @click="action('templates')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <!-- Export sub-menu -->
        <DropdownSubmenu icon="mdi:export" label="Export" :disabled="!hasNote">
          <DropdownItem icon="mdi:download" label="Text (.txt)" @click="action('export-text')" />
          <DropdownItem icon="mdi:language-markdown-outline" label="Markdown (.md)" @click="action('export-markdown')" />
          <DropdownItem icon="mdi:file-pdf-box" label="PDF" @click="action('export-pdf')" />
        </DropdownSubmenu>

        <DropdownItem icon="mdi:content-copy" label="Copy to Clipboard" :disabled="!hasNote" @click="action('copy')" />
        <DropdownItem icon="mdi:printer" label="Print" :disabled="!hasNote" @click="action('print')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <!-- Backup & restore -->
        <DropdownItem icon="mdi:code-json" label="Export as JSON" :disabled="!hasNote" @click="action('export-json')" />
        <DropdownItem icon="mdi:database-export" label="Export All Notes" @click="action('export-all')" />
        <DropdownItem icon="mdi:upload" label="Import Notes…" @click="action('import')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <DropdownItem icon="mdi:information-outline" label="About" @click="action('about')" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  hasNote: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'new-note',
  'open-file',
  'templates',
  'duplicate',
  'export-text',
  'export-markdown',
  'export-pdf',
  'export-json',
  'export-all',
  'import',
  'copy',
  'print',
  'about',
])

const open = ref(false)
const dropdownRef = ref(null)

const action = (name) => {
  open.value = false
  emit(name)
}

const onClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    open.value = false
  }
}

const onKeydown = (e) => {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>
