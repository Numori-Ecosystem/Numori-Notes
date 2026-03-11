<template>
  <div
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    class="p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
    :class="{ 'bg-white dark:bg-gray-925 border-l-4 border-l-primary-500': active }">
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-gray-900 dark:text-gray-400 truncate">
          {{ note.title || 'Untitled' }}
        </h3>
        <p v-if="note.description" class="text-sm text-gray-600 dark:text-gray-500 truncate mt-1">
          {{ note.description }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {{ formatDate(note.updatedAt) }}
        </p>
      </div>
      <button @click.stop="$emit('delete', note.id)"
        class="p-1 text-gray-400 hover:text-error-600 dark:text-gray-500 dark:hover:text-error-400 transition-colors"
        title="Delete note">
        <Icon name="mdi:trash-can-outline" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  note: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'edit', 'delete'])

const LONG_PRESS_DURATION = 500
const longPressTimer = ref(null)
const longPressTriggered = ref(false)

const startLongPress = () => {
  longPressTriggered.value = false
  longPressTimer.value = setTimeout(() => {
    longPressTriggered.value = true
    emit('edit', props.note.id)
  }, LONG_PRESS_DURATION)
}

const cancelLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const handleTouchStart = () => startLongPress()
const handleTouchEnd = () => cancelLongPress()
const handleMouseDown = () => startLongPress()
const handleMouseUp = () => cancelLongPress()

const handleClick = () => {
  if (!longPressTriggered.value) {
    emit('select', props.note.id)
  }
  longPressTriggered.value = false
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return date.toLocaleDateString()
}
</script>
