<template>
  <div class="flex items-center justify-center gap-1 overflow-x-auto" :class="containerClass">
    <button v-for="btn in buttons" :key="btn.title"
      @mousedown.prevent
      @click="$emit('apply-format', btn.before, btn.after)"
      class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
      :title="btn.title">
      <Icon :name="btn.icon" class="w-5 h-5 block" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  containerClass: {
    type: String,
    default: ''
  }
})

defineEmits(['apply-format'])

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
