<template>
  <div class="flex items-center gap-0.5 overflow-x-auto" :class="containerClass">
    <div class="min-w-3 flex-shrink-0 flex-grow" aria-hidden="true">&nbsp;</div>
    <!-- Undo / Redo -->
    <button @mousedown.prevent @click="$emit('undo')"
      :disabled="!canUndo"
      class="p-2 rounded-lg transition-colors flex-shrink-0 leading-none"
      :class="canUndo
        ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
        : 'text-gray-300 dark:text-gray-700 cursor-default'"
      title="Undo">
      <Icon name="mdi:undo" class="w-5 h-5 block" />
    </button>
    <button @mousedown.prevent @click="$emit('redo')"
      :disabled="!canRedo"
      class="p-2 rounded-lg transition-colors flex-shrink-0 leading-none"
      :class="canRedo
        ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
        : 'text-gray-300 dark:text-gray-700 cursor-default'"
      title="Redo">
      <Icon name="mdi:redo" class="w-5 h-5 block" />
    </button>
    <!-- Separator -->
    <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
    <!-- Text editing buttons -->
    <button v-for="btn in buttons" :key="btn.title"
      @mousedown.prevent
      @click="$emit('apply-format', btn.before, btn.after)"
      class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 leading-none"
      :title="btn.title">
      <Icon :name="btn.icon" class="w-5 h-5 block" />
    </button>
    <div class="min-w-3 flex-shrink-0 flex-grow" aria-hidden="true">&nbsp;</div>


  </div>
</template>

<script setup>
defineProps({
  containerClass: {
    type: String,
    default: ''
  },
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  },
})

defineEmits(['apply-format', 'undo', 'redo'])

const buttons = [
  { before: '**', after: '**', title: 'Bold', icon: 'mdi:format-bold' },
  { before: '*', after: '*', title: 'Italic', icon: 'mdi:format-italic' },
  { before: '~~', after: '~~', title: 'Strikethrough', icon: 'mdi:format-strikethrough' },
  { before: '# ', after: '', title: 'Heading', icon: 'mdi:format-header-1' },
  { before: '- ', after: '', title: 'List', icon: 'mdi:format-list-bulleted' },
  { before: '- [ ] ', after: '', title: 'Checklist', icon: 'mdi:checkbox-marked-outline' },
  { before: '> ', after: '', title: 'Quote', icon: 'mdi:format-quote-close' },
  { before: '`', after: '`', title: 'Code', icon: 'mdi:code-tags' },
  { before: '[', after: '](url)', title: 'Link', icon: 'mdi:link-variant' },
]
</script>
