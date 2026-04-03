<template>
  <div class="relative" ref="dropdownRef">
    <button @click="open = !open"
      class="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title="File menu">
      <Icon name="mdi:file-document-outline" class="w-4.5 h-4.5 block" />
      <span class="hidden sm:inline text-sm">File</span>
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
        <DropdownItem icon="mdi:plus" label="New Note" :shortcut="`${modLabel}+⇧+N`" @click="action('new-note')" />
        <DropdownItem icon="mdi:folder-open-outline" label="Open File…" :shortcut="`${modLabel}+O`" @click="action('open-file')" />
        <DropdownItem icon="mdi:content-duplicate" label="Duplicate Note" :shortcut="`${modLabel}+D`" :disabled="!hasNote" @click="action('duplicate')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
        
        <DropdownItem icon="mdi:file-document-outline" label="Templates" @click="action('templates')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <!-- Export sub-menu -->
        <DropdownSubmenu icon="mdi:export" :label="selectionCount > 0 ? `Export Selection (${selectionCount})` : 'Export'" :disabled="!hasNote && selectionCount === 0">
          <DropdownItem icon="mdi:download" :label="selectionCount > 0 ? `Selection as JSON (${selectionCount})` : 'Text (.txt)'" :shortcut="selectionCount > 0 ? '' : `${modLabel}+E`" @click="action('export-text')" />
          <DropdownItem v-if="selectionCount === 0" icon="mdi:language-markdown-outline" label="Markdown (.md)" @click="action('export-markdown')" />
          <DropdownItem v-if="selectionCount === 0" icon="mdi:file-pdf-box" label="PDF" @click="action('export-pdf')" />
        </DropdownSubmenu>

        <DropdownItem icon="mdi:content-copy" label="Copy to Clipboard" :disabled="!hasNote" @click="action('copy')" />
        <DropdownItem icon="mdi:printer" label="Print" :shortcut="`${modLabel}+P`" :disabled="!hasNote" @click="action('print')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <!-- Backup & restore -->
        <DropdownItem icon="mdi:code-json" :label="selectionCount > 0 ? `Export Selection as JSON (${selectionCount})` : 'Export as JSON'" :disabled="!hasNote && selectionCount === 0" @click="action('export-json')" />
        <DropdownItem icon="mdi:database-export" :label="selectionCount > 0 ? `Export Selection (${selectionCount})` : 'Export All Notes'" :shortcut="selectionCount > 0 ? '' : `${modLabel}+⇧+S`" @click="action('export-all')" />
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
  modLabel: {
    type: String,
    default: 'Ctrl',
  },
  selectionCount: {
    type: Number,
    default: 0,
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

onClickOutside(dropdownRef, () => {
  open.value = false
})

useEventListener(document, 'keydown', (e) => {
  if (e.key === 'Escape') open.value = false
})
</script>
