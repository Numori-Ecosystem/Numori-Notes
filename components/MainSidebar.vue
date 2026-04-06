<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Selection Toolbar / Header — crossfade in a fixed container -->
    <div class="relative border-b border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden">
      <!-- Select toolbar -->
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="selectMode"
          class="absolute inset-0 z-10 p-4 bg-primary-50 dark:bg-primary-900/20 flex flex-col justify-center space-y-3">
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
              class="flex-shrink-0 flex items-center justify-center px-3 py-2 rounded-lg transition-colors bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              :title="allSelected ? 'Deselect All' : 'Select All'">
              <Icon :name="allSelected ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'" class="w-5 h-5" />
            </button>
            <button v-if="showArchive" @click="bulkUnarchive" :disabled="selectedIds.size === 0"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <Icon name="mdi:package-up" class="w-5 h-5" />
              Unarchive
            </button>
            <button v-else @click="bulkArchive" :disabled="selectedIds.size === 0"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <Icon name="mdi:archive-outline" class="w-5 h-5" />
              Archive
            </button>
            <button @click="bulkDelete" :disabled="selectedIds.size === 0"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <Icon name="mdi:trash-can-outline" class="w-5 h-5" />
              Delete
            </button>
          </div>
        </div>
      </Transition>

      <!-- Normal header (always in flow to maintain height) -->
      <div class="p-4 space-y-3" :class="{ 'invisible': selectMode }">
      <button @click="$emit('new-note')"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md">
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span>New Note</span>
      </button>

      <!-- Search + select toggle + filters -->
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
        <button @click="showFilters = !showFilters"
          class="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 leading-none"
          :class="showFilters || hasActiveFilters
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
          title="Filters">
          <Icon :name="showFilters ? 'mdi:filter-variant-remove' : 'mdi:filter-variant'"
            class="w-4 h-4 block transition-transform duration-200"
            :class="{ 'rotate-180': showFilters }" />
        </button>
        <button v-if="hasArchivedNotes" @click="showArchive = !showArchive"
          class="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 leading-none"
          :class="showArchive
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
          title="Archive">
          <Icon :name="showArchive ? 'mdi:archive' : 'mdi:archive-outline'"
            class="w-4 h-4 block" />
        </button>
      </div>

      <!-- Advanced filters panel -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1 max-h-0"
        enter-to-class="opacity-100 translate-y-0 max-h-40"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 max-h-40"
        leave-to-class="opacity-0 -translate-y-1 max-h-0">
        <div v-if="showFilters" class="overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-2.5 space-y-2 shadow-sm">
          <!-- Date range -->
          <select v-model="filters.dateRange"
            class="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-400 outline-none focus:ring-1 focus:ring-primary-500">
            <option value="">Modified: Any time</option>
            <option value="today">Modified: Today</option>
            <option value="week">Modified: Past 7 days</option>
            <option value="month">Modified: Past 30 days</option>
            <option value="older">Modified: Older than 30 days</option>
          </select>

          <!-- Toggle chips -->
          <div class="flex flex-wrap gap-1.5">
            <button @click="filters.searchContent = !filters.searchContent"
              class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
              :class="filters.searchContent
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              Content
            </button>
            <button @click="filters.hasDescription = !filters.hasDescription"
              class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
              :class="filters.hasDescription
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              Has desc
            </button>
            <button @click="filters.hasTags = !filters.hasTags"
              class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
              :class="filters.hasTags
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              Has tags
            </button>
            <button @click="filters.emptyOnly = !filters.emptyOnly"
              class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
              :class="filters.emptyOnly
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              Empty
            </button>
            <button v-if="hasActiveFilters" @click="clearFilters"
              class="px-2 py-0.5 rounded-full text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ml-auto">
              Clear
            </button>
          </div>
        </div>
      </Transition>

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
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto" ref="listRef">
      <div v-if="filteredNotes.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ showArchive ? 'No archived notes' : 'No notes found' }}
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
          :shared="sharedNoteIds.includes(note.id)"
          :share-hash="sharedNotesMap.get(note.id) || null"
          :analytics-hash="analyticsNotesMap.get(note.id) || null"
          :pending="pendingNoteIds.has(note.id)"
          @select="id => $emit('select-note', id)"
          @delete="id => $emit('delete-note', id)"
          @share="id => $emit('share-note', id)"
          @unshare="id => $emit('unshare-note', id)"
          @properties="id => $emit('show-properties', id)"
          @open-analytics="hash => $emit('open-analytics', hash)"
          @duplicate="id => $emit('duplicate-note', id)"
          @export="id => $emit('export-note', id)"
          @copy-to-clipboard="id => $emit('copy-to-clipboard', id)"
          @print="id => $emit('print-note', id)"
          @archive="id => $emit('archive-note', id)"
          @unarchive="id => $emit('unarchive-note', id)"
          @toggle-select="toggleNoteSelection" />
      </div>
    </div>

    <!-- User Account Section -->
    <div class="relative flex-shrink-0 bg-gray-100/80 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700" ref="accountMenuRef">
      <!-- Dropdown (opens upward) -->
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1">
        <div v-show="accountMenuOpen"
          class="absolute bottom-full left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div class="py-1">
            <template v-if="isLoggedIn">
              <button @click="accountAction('edit-profile')"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Icon name="mdi:account-edit-outline" class="w-4 h-4" />
                Edit Profile
              </button>
            </template>
            <template v-else>
              <button @click="accountAction('show-auth')"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Icon name="mdi:login" class="w-4 h-4" />
                Sign In / Sign Up
              </button>
            </template>
            <button @click="accountAction('show-locale-settings')"
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Icon name="mdi:cog-outline" class="w-4 h-4" />
              Settings
            </button>
            <button @click="accountAction('show-language')"
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Icon name="mdi:translate" class="w-4 h-4" />
              Change Language
            </button>
            <template v-if="isLoggedIn">
              <div class="border-t border-gray-300 dark:border-gray-600 my-1" />
              <button @click="accountAction('logout')"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <Icon name="mdi:logout" class="w-4 h-4" />
                Sign Out
              </button>
            </template>
          </div>
        </div>
      </Transition>

      <!-- Logged-in state -->
      <button v-if="isLoggedIn" @click="accountMenuOpen = !accountMenuOpen"
        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors text-left">
        <img v-if="user?.avatarUrl" :src="user.avatarUrl"
          class="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="Avatar" />
        <div v-else
          class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <Icon name="mdi:account" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ user?.name || 'No name' }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
        </div>
        <Icon name="mdi:chevron-down"
          class="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200"
          :class="{ 'rotate-180': accountMenuOpen }" />
      </button>

      <!-- Logged-out state -->
      <button v-else @click="accountMenuOpen = !accountMenuOpen"
        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors text-left">
        <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <Icon name="mdi:account-circle-outline" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200">Guest</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Not signed in</p>
        </div>
        <Icon name="mdi:chevron-down"
          class="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200"
          :class="{ 'rotate-180': accountMenuOpen }" />
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  notes: { type: Array, required: true },
  currentNoteId: { type: String, default: null },
  allTags: { type: Array, default: () => [] },
  isLoggedIn: { type: Boolean, default: false },
  user: { type: Object, default: null },
  sharedNoteIds: { type: Array, default: () => [] },
  sharedNotesMap: { type: Map, default: () => new Map() },
  analyticsNotesMap: { type: Map, default: () => new Map() },
  pendingNoteIds: { type: Set, default: () => new Set() }
})

const emit = defineEmits([
  'new-note', 'select-note', 'delete-note', 'edit-note',
  'show-help', 'show-locale-settings', 'show-language',
  'show-auth', 'logout', 'edit-profile',
  'bulk-delete', 'selection-change', 'reorder',
  'share-note', 'unshare-note', 'show-properties', 'open-analytics',
  'duplicate-note', 'export-note', 'copy-to-clipboard', 'print-note',
  'archive-note', 'unarchive-note', 'bulk-archive', 'bulk-unarchive'
])

const searchQuery = ref('')
const selectedTags = ref([])
const listRef = ref(null)
const showFilters = ref(false)
const showArchive = ref(false)

const hasArchivedNotes = computed(() => props.notes.some(n => n.archived))

// Auto-exit archive view when no archived notes remain
watch(hasArchivedNotes, (has) => {
  if (!has) showArchive.value = false
})

// ── Account dropdown ─────────────────────────────────────
const accountMenuOpen = ref(false)
const accountMenuRef = ref(null)

const accountAction = (action) => {
  accountMenuOpen.value = false
  emit(action)
}

const onClickOutsideAccount = (e) => {
  if (accountMenuRef.value && !accountMenuRef.value.contains(e.target)) {
    accountMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutsideAccount)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutsideAccount)
})

const filters = reactive({
  searchContent: true,
  dateRange: '',
  hasDescription: false,
  hasTags: false,
  emptyOnly: false
})

const hasActiveFilters = computed(() => {
  return !filters.searchContent || filters.dateRange !== '' || filters.hasDescription || filters.hasTags || filters.emptyOnly
})

const clearFilters = () => {
  filters.searchContent = true
  filters.dateRange = ''
  filters.hasDescription = false
  filters.hasTags = false
  filters.emptyOnly = false
  selectedTags.value = []
}

// ── Drag-to-reorder ─────────────────────────────────────

const draggingIndex = ref(null)
const dropTargetIndex = ref(null)
const dropPosition = ref(null)

const isFiltering = computed(() => searchQuery.value.trim() !== '' || selectedTags.value.length > 0 || hasActiveFilters.value)
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

const bulkArchive = () => {
  if (selectedIds.value.size === 0) return
  emit('bulk-archive', [...selectedIds.value])
  exitSelectMode()
}

const bulkUnarchive = () => {
  if (selectedIds.value.size === 0) return
  emit('bulk-unarchive', [...selectedIds.value])
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

  // Filter by archive state
  result = result.filter(n => showArchive.value ? !!n.archived : !n.archived)

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(n => {
      const matchTitle = (n.title || '').toLowerCase().includes(q)
      const matchDesc = (n.description || '').toLowerCase().includes(q)
      const matchTags = (n.tags || []).some(t => t.toLowerCase().includes(q))
      const matchContent = filters.searchContent && (n.content || '').toLowerCase().includes(q)
      return matchTitle || matchDesc || matchTags || matchContent
    })
  }
  if (selectedTags.value.length) {
    result = result.filter(n =>
      selectedTags.value.every(t => (n.tags || []).includes(t))
    )
  }
  if (filters.dateRange) {
    const now = Date.now()
    const day = 86400000
    result = result.filter(n => {
      const updated = new Date(n.updatedAt).getTime()
      const age = now - updated
      switch (filters.dateRange) {
        case 'today': return age < day
        case 'week': return age < 7 * day
        case 'month': return age < 30 * day
        case 'older': return age >= 30 * day
        default: return true
      }
    })
  }
  if (filters.hasDescription) {
    result = result.filter(n => (n.description || '').trim().length > 0)
  }
  if (filters.hasTags) {
    result = result.filter(n => (n.tags || []).length > 0)
  }
  if (filters.emptyOnly) {
    result = result.filter(n => !(n.content || '').trim())
  }
  return result.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
})
</script>
