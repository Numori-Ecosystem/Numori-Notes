<template>
  <div class="flex items-center" :class="containerClass">
    <!-- Undo / Redo (pinned left) -->
    <div class="flex items-center flex-shrink-0">
      <button @mousedown.prevent @click="$emit('undo')"
        :disabled="!canUndo"
        class="p-2 rounded-lg transition-colors leading-none"
        :class="canUndo
          ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
          : 'text-gray-300 dark:text-gray-700 cursor-default'"
        title="Undo">
        <Icon name="mdi:undo" class="w-5 h-5 block" />
      </button>
      <button @mousedown.prevent @click="$emit('redo')"
        :disabled="!canRedo"
        class="p-2 rounded-lg transition-colors leading-none"
        :class="canRedo
          ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
          : 'text-gray-300 dark:text-gray-700 cursor-default'"
        title="Redo">
        <Icon name="mdi:redo" class="w-5 h-5 block" />
      </button>
      <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-1"></div>
    </div>

    <!-- Scrollable format buttons (middle) -->
    <div ref="scrollRef"
      class="flex items-center gap-0.5 overflow-x-auto min-w-0 scrollbar-none"
      :class="{ 'cursor-grabbing': isDragging, 'cursor-grab': !isDragging }"
      @mousedown="onDragStart"
      @mousemove="onDragMove"
      @mouseup="onDragEnd"
      @mouseleave="onDragEnd">
      <button v-for="btn in buttons" :key="btn.title"
        @mousedown.prevent
        @click="$emit('apply-format', btn.before, btn.after)"
        class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 leading-none"
        :title="btn.title">
        <Icon :name="btn.icon" class="w-5 h-5 block" />
      </button>
      <!-- Separator -->
      <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
      <!-- Indent / Outdent -->
      <button @mousedown.prevent @click="$emit('indent')"
        class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 leading-none"
        title="Indent (nest)">
        <Icon name="mdi:format-indent-increase" class="w-5 h-5 block" />
      </button>
      <button @mousedown.prevent @click="$emit('outdent')"
        class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 leading-none"
        title="Outdent (unnest)">
        <Icon name="mdi:format-indent-decrease" class="w-5 h-5 block" />
      </button>
    </div>

    <!-- Dismiss keyboard (pinned right, optional) -->
    <div v-if="showDismiss" class="flex items-center flex-shrink-0">
      <div class="w-px h-5 bg-gray-300/60 dark:bg-gray-700 mx-1"></div>
      <button @mousedown.prevent @click="$emit('dismiss-keyboard')"
        class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors leading-none"
        title="Dismiss keyboard">
        <Icon name="mdi:keyboard-close" class="w-5 h-5 block" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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
  showDismiss: {
    type: Boolean,
    default: false
  },
})

defineEmits(['apply-format', 'indent', 'outdent', 'undo', 'redo', 'dismiss-keyboard'])

const buttons = [
  { before: '**', after: '**', title: 'Bold', icon: 'mdi:format-bold' },
  { before: '*', after: '*', title: 'Italic', icon: 'mdi:format-italic' },
  { before: '~~', after: '~~', title: 'Strikethrough', icon: 'mdi:format-strikethrough' },
  { before: '# ', after: '', title: 'Heading 1', icon: 'mdi:format-header-1' },
  { before: '## ', after: '', title: 'Heading 2', icon: 'mdi:format-header-2' },
  { before: '### ', after: '', title: 'Heading 3', icon: 'mdi:format-header-3' },
  { before: '- ', after: '', title: 'List', icon: 'mdi:format-list-bulleted' },
  { before: '- [ ] ', after: '', title: 'Checklist', icon: 'mdi:checkbox-marked-outline' },
  { before: '> ', after: '', title: 'Quote', icon: 'mdi:format-quote-close' },
  { before: '`', after: '`', title: 'Code', icon: 'mdi:code-tags' },
  { before: '[', after: '](url)', title: 'Link', icon: 'mdi:link-variant' },
]

// Mouse drag-to-scroll
const scrollRef = ref(null)
const isDragging = ref(false)
let dragStartX = 0
let dragScrollLeft = 0

const onDragStart = (e) => {
  if (!scrollRef.value) return
  isDragging.value = true
  dragStartX = e.pageX
  dragScrollLeft = scrollRef.value.scrollLeft
}

const onDragMove = (e) => {
  if (!isDragging.value || !scrollRef.value) return
  e.preventDefault()
  const dx = e.pageX - dragStartX
  scrollRef.value.scrollLeft = dragScrollLeft - dx
}

const onDragEnd = () => {
  isDragging.value = false
}
</script>
