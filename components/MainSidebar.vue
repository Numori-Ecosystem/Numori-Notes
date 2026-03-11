<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
      <button @click="$emit('new-note')"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md">
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span>New Note</span>
      </button>
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto">
      <div v-for="note in notes" :key="note.id" 
        @click="handleNoteClick(note.id)"
        @touchstart="handleTouchStart(note.id)"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        @mousedown="handleMouseDown(note.id)"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        class="p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
        :class="{ 'bg-white dark:bg-gray-925 border-l-4 border-l-primary-500': note.id === currentNoteId }">
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
          <button @click.stop="$emit('delete-note', note.id)"
            class="p-1 text-gray-400 hover:text-error-600 dark:text-gray-500 dark:hover:text-error-400 transition-colors"
            title="Delete note">
            <Icon name="mdi:trash-can-outline" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom toolbar -->
    <div class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-1">
        <button @click="$emit('show-templates')"
          class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
          title="Templates">
          <Icon name="mdi:file-document-outline" class="w-5 h-5 block" />
        </button>
        <button @click="$emit('show-help')"
          class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
          title="Help">
          <Icon name="mdi:help-circle-outline" class="w-5 h-5 block" />
        </button>
        <button @click="$emit('show-locale-settings')"
          class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
          title="Settings">
          <Icon name="mdi:cog-outline" class="w-5 h-5 block" />
        </button>
      </div>
      <div class="flex items-center gap-1">
        <button @click="$emit('show-language')"
          class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
          title="Language">
          <Icon name="mdi:translate" class="w-5 h-5 block" />
        </button>
        <ThemeSwitcher />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  notes: {
    type: Array,
    required: true
  },
  currentNoteId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['new-note', 'select-note', 'delete-note', 'edit-note', 'show-templates', 'show-help', 'show-locale-settings', 'show-language'])

// Long press handling
const longPressTimer = ref(null)
const longPressTriggered = ref(false)
const LONG_PRESS_DURATION = 500 // milliseconds

const handleTouchStart = (noteId) => {
  longPressTriggered.value = false
  longPressTimer.value = setTimeout(() => {
    longPressTriggered.value = true
    emit('edit-note', noteId)
  }, LONG_PRESS_DURATION)
}

const handleTouchEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const handleMouseDown = (noteId) => {
  longPressTriggered.value = false
  longPressTimer.value = setTimeout(() => {
    longPressTriggered.value = true
    emit('edit-note', noteId)
  }, LONG_PRESS_DURATION)
}

const handleMouseUp = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const handleNoteClick = (noteId) => {
  // Only emit select if long press wasn't triggered
  if (!longPressTriggered.value) {
    emit('select-note', noteId)
  }
  longPressTriggered.value = false
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now'
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}d ago`
  }

  // Format as date
  return date.toLocaleDateString()
}
</script>
