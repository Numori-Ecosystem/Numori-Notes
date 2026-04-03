<template>
  <div class="flex items-center justify-center gap-0.5 overflow-x-auto" :class="containerClass">
    <!-- Text editing buttons -->
    <button v-for="btn in buttons" :key="btn.title"
      @mousedown.prevent
      @click="$emit('apply-format', btn.before, btn.after)"
      class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 leading-none"
      :title="btn.title">
      <Icon :name="btn.icon" class="w-5 h-5 block" />
    </button>

    <!-- Separator -->
    <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-1 flex-shrink-0"></div>

    <!-- Markdown preview toggle -->
    <button @click="$emit('toggle-markdown-preview')"
      class="p-2 rounded-lg transition-colors flex-shrink-0 leading-none"
      :class="showMarkdownPreview
        ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/40'
        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'"
      title="Toggle rendered preview">
      <Icon name="mdi:language-markdown-outline" class="w-5 h-5 block" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  containerClass: {
    type: String,
    default: ''
  },
  showMarkdownPreview: {
    type: Boolean,
    default: false
  }
})

defineEmits(['apply-format', 'toggle-markdown-preview'])

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
