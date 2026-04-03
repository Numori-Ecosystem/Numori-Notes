<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
    <!-- Selection Toolbar (shown in select mode) -->
    <div v-if="selectMode"
      class="p-3 border-b border-gray-200 dark:border-gray-800 bg-primary-50 dark:bg-primary-900/20 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
          {{ selectedIds.size }} selected
        </span>
        <button @click="exitSelectMode"
          class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Cancel selection">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button @click="toggleSelectAll"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Icon :name="allSelected ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'" class="w-4 h-4" />
          {{ allSelected ? 'Deselect All' : 'Select All' }}
        </button>
        <button @click="bulkDelete" :disabled="selectedIds.size === 0"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed">
          <Icon name="mdi:trash-can-outline" class="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>

    <!-- Header (hidden in select mode) -->
    <div v-else class="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
      <button @click="$emit('new-note')"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md">
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span>New Note</span>
      </button>

      <!-- Search + select toggle -->
      <div class="flex items-center gap-2">
        <button @click="toggleSelectMode"
          class="flex-shrink-0 p-1.5 rounded-lg transition-colors leading-none"
          :class="selectMode
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
          title="Select notes">
          <Icon name="mdi:checkbox-multiple-marked-outline" class="w-4 h-4 block" />
        </button>
        <div class="relative flex-1">
          <Icon name="mdi:magnify" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="searchQuery" type="text" placeholder="Search notes..."
            class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
        </div>
      </div>

      <!-- Tag filter -->
      <div v-if="allTags.length" class="flex flex-wrap gap-1.5">
        <button v-for="tag in allTags" :key="tag"
          @click="toggleTag(tag)"
          class="px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
          :class="selectedTags.includes(tag)
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'">
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto" ref="listRef">
      <div v-if="filteredNotes.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No notes found
      </div>
      <div v-for="(note, index) in filteredNotes" :key="note.id"
        :data-index="index"
        :draggable="canReorder"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @dragend="onDragEnd"
        @touchstart="onTouchStart($event, index)"
        class="relative"
        :class="{
          'border-t-2 border-t-primary-500': dropTargetIndex === index && dropPosition === 'before',
          'border-b-2 border-b-primary-500': dropTargetIndex === index && dropPosition === 'after',
          'opacity-50': draggingIndex === index
        }">
        <NoteListItem
          :note="note" :active="note.id === currentNoteId"
          :select-mode="selectMode"
          :selected="selectedIds.has(note.id)"
          @select="id => $emit('select-note', id)"
          @delete="id => $emit('delete-note', id)"
          @toggle-select="toggleNoteSelection" />
      </div>
    </div>

    <!-- Bottom toolbar -->
    <SidebarFooter
      :is-logged-in="isLoggedIn"
      :user="user"
      @show-help="$emit('show-help')"
      @show-locale-settings="$emit('show-locale-settings')"
      @show-language="$emit('show-language')"
      @show-auth="$emit('show-auth')"
      @logout="$emit('logout')"
      @edit-profile="$emit('edit-profile')" />
  </div>
</template>

<script setup>
const props = defineProps({
  notes: { type: Array, required: true },
  currentNoteId: { type: String, default: null },
  allTags: { type: Array, default: () => [] },
  isLoggedIn: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits([
  'new-note', 'select-note', 'delete-note', 'edit-note',
  'show-help', 'show-locale-settings', 'show-language',
  'show-auth', 'logout', 'edit-profile',
  'bulk-delete', 'selection-change', 'reorder'
])

const searchQuery = ref('')
const selectedTags = ref([])
const listRef = ref(null)

// ── Drag-to-reorder ─────────────────────────────────────

const draggingIndex = ref(null)
const dropTargetIndex = ref(null)
const dropPosition = ref(null)

const isFiltering = computed(() => searchQuery.value.trim() !== '' || selectedTags.value.length > 0)
const canReorder = computed(() => !selectMode.value && !isFiltering.value)

// -- Mouse (HTML5 drag) --

const onDragStart = (e, index) => {
  if (!canReorder.value) return
  draggingIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
}

const onDragOver = (e, index) => {
  if (draggingIndex.value === null || draggingIndex.value === index) {
    dropTargetIndex.value = null
    dropPosition.value = null
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  dropPosition.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  dropTargetIndex.value = index
}

const onDragEnd = () => {
  commitReorder()
}

// -- Touch --

let touchDragActive = false
let touchHoldTimer = null
const TOUCH_HOLD_MS = 300

const onTouchStart = (e, index) => {
  if (!canReorder.value) return

  // Wait a short hold before activating drag so normal taps/scrolls aren't hijacked
  touchHoldTimer = setTimeout(() => {
    touchDragActive = true
    draggingIndex.value = index

    const onTouchMove = (ev) => {
      if (!touchDragActive) return
      ev.preventDefault() // stop scrolling while dragging
      const touch = ev.touches[0]
      const hit = getItemAtY(touch.clientY)
      if (hit !== null && hit.index !== draggingIndex.value) {
        dropTargetIndex.value = hit.index
        dropPosition.value = hit.position
      } else {
        dropTargetIndex.value = null
        dropPosition.value = null
      }
    }

    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
      touchDragActive = false
      commitReorder()
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onTouchEnd)
  }, TOUCH_HOLD_MS)

  // If the finger moves before the hold completes, cancel (it's a scroll)
  const onEarlyMove = () => {
    clearTimeout(touchHoldTimer)
    e.target.removeEventListener('touchmove', onEarlyMove)
  }
  e.target.addEventListener('touchmove', onEarlyMove, { once: true, passive: true })

  // Clean up hold timer if touch ends before hold
  const onEarlyEnd = () => {
    clearTimeout(touchHoldTimer)
    e.target.removeEventListener('touchend', onEarlyEnd)
    e.target.removeEventListener('touchmove', onEarlyMove)
  }
  e.target.addEventListener('touchend', onEarlyEnd, { once: true })
}

const getItemAtY = (y) => {
  if (!listRef.value) return null
  const items = listRef.value.querySelectorAll('[data-index]')
  for (const item of items) {
    const rect = item.getBoundingClientRect()
    if (y >= rect.top && y <= rect.bottom) {
      return {
        index: parseInt(item.dataset.index),
        position: y < rect.top + rect.height / 2 ? 'before' : 'after'
      }
    }
  }
  return null
}

// -- Shared --

const commitReorder = () => {
  if (draggingIndex.value !== null && dropTargetIndex.value !== null && draggingIndex.value !== dropTargetIndex.value) {
    const ordered = [...filteredNotes.value]
    const [moved] = ordered.splice(draggingIndex.value, 1)
    let insertAt = dropTargetIndex.value
    if (draggingIndex.value < dropTargetIndex.value) insertAt--
    if (dropPosition.value === 'after') insertAt++
    ordered.splice(insertAt, 0, moved)
    emit('reorder', ordered.map(n => n.id))
  }
  draggingIndex.value = null
  dropTargetIndex.value = null
  dropPosition.value = null
}

// ── Multi-select ─────────────────────────────────────────

const selectMode = ref(false)
const selectedIds = ref(new Set())

const allSelected = computed(() => {
  return filteredNotes.value.length > 0 && filteredNotes.value.every(n => selectedIds.value.has(n.id))
})

const toggleSelectMode = () => {
  if (selectMode.value) exitSelectMode()
  else { selectMode.value = true; selectedIds.value = new Set(); emit('selection-change', []) }
}

const exitSelectMode = () => {
  selectMode.value = false
  selectedIds.value = new Set()
  emit('selection-change', [])
}

const toggleNoteSelection = (noteId) => {
  const next = new Set(selectedIds.value)
  if (next.has(noteId)) next.delete(noteId)
  else next.add(noteId)
  selectedIds.value = next
  emit('selection-change', [...next])
  if (next.size === 0) selectMode.value = false
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = new Set()
    emit('selection-change', [])
  } else {
    const ids = filteredNotes.value.map(n => n.id)
    selectedIds.value = new Set(ids)
    emit('selection-change', ids)
  }
}

const bulkDelete = () => {
  if (selectedIds.value.size === 0) return
  emit('bulk-delete', [...selectedIds.value])
  exitSelectMode()
}

// ── Filtering ────────────────────────────────────────────

const toggleTag = (tag) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(idx, 1)
}

const filteredNotes = computed(() => {
  let result = props.notes
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.description || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.includes(q))
    )
  }
  if (selectedTags.value.length) {
    result = result.filter(n =>
      selectedTags.value.every(t => (n.tags || []).includes(t))
    )
  }
  return result.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
})
</script>
