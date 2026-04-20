<template>
  <header
    class="bg-gray-100 dark:bg-gray-900 flex-shrink-0"
    :style="{
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
    }"
  >
    <div class="flex flex-col px-3 py-1.5 gap-0.5">
      <!-- Top row: Centered title -->
      <UiButton
        variant="ghost"
        color="gray"
        class="text-center min-w-0 px-1 py-0.5 mb-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-md"
        @click="$emit('show-meta')"
      >
        <h1 class="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-400 truncate">
          {{ currentNote?.title || 'Numori' }}
        </h1>
      </UiButton>

      <!-- Bottom row: All controls -->
      <div class="flex items-center gap-1">
        <!-- Left: Sidebar toggle + dropdowns -->
        <div class="flex items-center gap-0.5">
          <UiButton
            variant="ghost"
            color="gray"
            icon-only
            title="Toggle notes list"
            @click="$emit('toggle-sidebar')"
          >
            <Icon name="mdi:menu" class="w-4.5 h-4.5 block" />
          </UiButton>
          <FileDropdown
            :has-note="!!currentNote"
            :mod-label="modLabel"
            :selection-count="selectionCount"
            @new-note="$emit('file-new')"
            @open-file="$emit('file-open')"
            @duplicate="$emit('file-duplicate')"
            @backup="$emit('file-backup')"
            @restore="$emit('file-restore')"
            @copy="$emit('file-copy')"
            @print="$emit('file-print')"
          />
          <ViewDropdown
            :markdown-mode="markdownMode"
            :editor-font-size="editorFontSize"
            :check-for-update="checkForUpdate"
            @update:markdown-mode="(mode) => $emit('update:markdown-mode', mode)"
            @zoom-in="$emit('zoom-in')"
            @zoom-out="$emit('zoom-out')"
            @zoom-reset="$emit('zoom-reset')"
            @templates="$emit('show-templates')"
            @help="$emit('show-help')"
            @about="$emit('file-about')"
          />
        </div>

        <!-- Center: Markdown formatting (desktop only) -->
        <FormattingToolbar
          class="hidden lg:flex flex-1 justify-center"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @apply-format="(before, after) => $emit('apply-format', before, after)"
          @indent="$emit('indent')"
          @outdent="$emit('outdent')"
          @undo="$emit('undo')"
          @redo="$emit('redo')"
        />

        <!-- Spacer on mobile -->
        <div class="flex-1 lg:hidden" />

        <!-- Right: Actions -->
        <div class="flex items-center gap-0.5">
          <!-- Inline results mode group -->
          <UiButtonsGroup
            :model-value="inlineMode"
            :options="[
              { value: 'left', icon: 'mdi:dock-left', title: 'Results on left' },
              { value: 'off', icon: 'mdi:eye-off-outline', title: 'Results off' },
              { value: 'right', icon: 'mdi:dock-right', title: 'Results on right' },
            ]"
            @update:model-value="$emit('update:inline-mode', $event)"
          />

          <UiDivider direction="vertical" class="mx-0.5" />

          <!-- Focus mode -->
          <UiButton
            variant="ghost"
            color="gray"
            icon-only
            title="Focus mode"
            @click="$emit('toggle-focus')"
          >
            <Icon name="mdi:fullscreen" class="w-5 h-5 block" />
          </UiButton>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentNote: {
    type: Object,
    default: null,
  },
  inlineMode: {
    type: String,
    default: 'left',
  },
  markdownMode: {
    type: String,
    default: 'edit',
  },
  modLabel: {
    type: String,
    default: 'Ctrl',
  },
  selectionCount: {
    type: Number,
    default: 0,
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  canUndo: {
    type: Boolean,
    default: false,
  },
  canRedo: {
    type: Boolean,
    default: false,
  },
  editorFontSize: {
    type: Number,
    default: 16,
  },
  checkForUpdate: {
    type: Function,
    default: null,
  },
})

defineEmits([
  'toggle-sidebar',
  'toggle-focus',
  'show-meta',
  'show-templates',
  'show-help',
  'apply-format',
  'indent',
  'outdent',
  'update:inline-mode',
  'update:markdown-mode',
  'zoom-in',
  'zoom-out',
  'zoom-reset',
  'undo',
  'redo',
  'file-new',
  'file-open',
  'file-duplicate',
  'file-backup',
  'file-restore',
  'file-copy',
  'file-print',
  'file-about',
])
</script>
