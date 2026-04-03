<template>
  <header class="bg-gray-100 dark:bg-gray-900 flex-shrink-0 z-10" :style="{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }">
    <div class="flex items-center justify-between px-3 py-2">
      <!-- Left: File dropdown & Title -->
      <div class="flex items-center gap-2 min-w-0">
        <!-- File dropdown -->
        <FileDropdown :has-note="!!currentNote" :mod-label="modLabel" :selection-count="selectionCount"
          @new-note="$emit('file-new')"
          @open-file="$emit('file-open')"
          @templates="$emit('show-templates')"
          @duplicate="$emit('file-duplicate')"
          @export-text="$emit('file-export-text')"
          @export-markdown="$emit('file-export-markdown')"
          @export-pdf="$emit('file-export-pdf')"
          @export-json="$emit('file-export-json')"
          @export-all="$emit('file-export-all')"
          @import="$emit('file-import')"
          @copy="$emit('file-copy')"
          @print="$emit('file-print')"
          @about="$emit('file-about')" />

        <button @click="$emit('show-meta')" class="text-left min-w-0">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-400 truncate max-w-[200px] sm:max-w-xs lg:max-w-sm xl:max-w-md">
            {{ currentNote?.title || 'Notes' }}
          </h1>
        </button>
      </div>

      <!-- Center: Markdown formatting (desktop only) -->
      <FormattingToolbar class="hidden lg:flex flex-1"
        @apply-format="(before, after) => $emit('apply-format', before, after)" />

      <!-- Spacer on mobile to push right actions to the end -->
      <div class="flex-1 lg:hidden"></div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1">
        <!-- Toggle markdown preview -->
        <button @click="$emit('toggle-markdown-preview')" class="p-2 rounded-lg transition-colors leading-none"
          :class="showMarkdownPreview
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850'" title="Toggle rendered preview">
          <Icon name="mdi:language-markdown-outline" class="w-5 h-5 block" />
        </button>

        <!-- Toggle inline results -->
        <button @click="$emit('toggle-inline')" class="p-2 rounded-lg transition-colors leading-none"
          :class="showInline
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850'" title="Toggle inline results">
          <Icon name="mdi:code-tags" class="w-5 h-5 block" />
        </button>

        <!-- Separator -->
        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <!-- Toggle sidebar -->
        <button @click="$emit('toggle-sidebar')"
          class="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
          title="Toggle notes list">
          <Icon name="mdi:menu" class="w-5 h-5 block" />
        </button>

      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentNote: {
    type: Object,
    default: null
  },
  showInline: {
    type: Boolean,
    default: true
  },
  showMarkdownPreview: {
    type: Boolean,
    default: false
  },
  modLabel: {
    type: String,
    default: 'Ctrl'
  },
  selectionCount: {
    type: Number,
    default: 0
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'toggle-sidebar',
  'show-meta',
  'show-templates',
  'apply-format',
  'toggle-inline',
  'toggle-markdown-preview',
  'file-new',
  'file-open',
  'file-duplicate',
  'file-export-text',
  'file-export-markdown',
  'file-export-pdf',
  'file-export-json',
  'file-export-all',
  'file-import',
  'file-copy',
  'file-print',
  'file-about',
])
</script>

