<template>
  <header class="bg-gray-100 dark:bg-gray-900 flex-shrink-0 z-10" :style="{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }">
    <div class="flex items-center justify-between px-3 py-1.5 gap-1">
      <!-- Left: File dropdown & Title -->
      <div class="flex items-center gap-1.5 min-w-0">
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
          <h1 class="text-base font-semibold text-gray-900 dark:text-gray-400 truncate max-w-[180px] sm:max-w-xs lg:max-w-sm xl:max-w-md">
            {{ currentNote?.title || 'Notes' }}
          </h1>
        </button>
      </div>

      <!-- Center: Markdown formatting (desktop only) -->
      <FormattingToolbar class="hidden lg:flex flex-1"
        :show-markdown-preview="showMarkdownPreview"
        @apply-format="(before, after) => $emit('apply-format', before, after)"
        @toggle-markdown-preview="$emit('toggle-markdown-preview')" />

      <!-- Spacer on mobile -->
      <div class="flex-1 lg:hidden"></div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-0.5">
        <!-- Inline results mode group -->
        <div class="inline-flex items-center bg-gray-200/50 dark:bg-gray-800 rounded-lg p-0.5" role="group">
          <button @click="$emit('update:inline-mode', 'left')"
            class="p-2 rounded-md transition-all leading-none"
            :class="inlineMode === 'left'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
            title="Results on left">
            <Icon name="mdi:dock-left" class="w-5 h-5 block" />
          </button>
          <button @click="$emit('update:inline-mode', 'off')"
            class="p-2 rounded-md transition-all leading-none"
            :class="inlineMode === 'off'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
            title="Results off">
            <Icon name="mdi:eye-off-outline" class="w-5 h-5 block" />
          </button>
          <button @click="$emit('update:inline-mode', 'right')"
            class="p-2 rounded-md transition-all leading-none"
            :class="inlineMode === 'right'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
            title="Results on right">
            <Icon name="mdi:dock-right" class="w-5 h-5 block" />
          </button>
        </div>

        <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-0.5"></div>

        <!-- Toggle sidebar -->
        <button @click="$emit('toggle-sidebar')"
          class="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors leading-none"
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
  inlineMode: {
    type: String,
    default: 'left'
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
  'update:inline-mode',
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
