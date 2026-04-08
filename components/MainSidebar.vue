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
    <div class="flex-1 overflow-y-auto" ref="listRef"
      @dragover.prevent
      @drop.prevent="onDrop">
      <div v-if="sidebarItems.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ showArchive ? 'No archived notes' : 'No notes found' }}
      </div>

      <template v-for="(item, idx) in displayItems" :key="item.id">
        <!-- ── Drop gap indicator ── -->
        <div class="drag-gap-el overflow-hidden rounded-lg border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20"
          :style="gapStyle(idx)" />

        <!-- ── Group header ── -->
        <div v-if="item.kind === 'group'"
          :data-item-id="item.id"
          :data-kind="'group'"
          :draggable="canReorder"
          @dragstart="onDragStart($event, item.id, 'group')"
          @dragover.prevent="onDragOverItem($event, item.id, 'group')"
          @dragend="onDragEnd"
          @touchstart="onTouchStart($event, item.id, 'group')"
          class="relative"
          :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
          v-show="!isDraggedItem(item.id)">
          <GroupListItem
            :group="item.data"
            :note-count="getGroupNotes(item.id).length"
            :drop-indicator="dropTarget?.id === item.id ? dropTarget?.position : null"
            @toggle-collapse="id => $emit('toggle-group-collapse', id)"
            @edit="id => $emit('edit-group', id)"
            @delete="id => $emit('delete-group', id)" />
        </div>

        <!-- ── Grouped note (child of a group) ── -->
        <div v-else-if="item.kind === 'grouped-note'"
          :data-item-id="item.id"
          :data-kind="'note'"
          :data-group="item.parentGroupId"
          :draggable="canReorder"
          @dragstart="onDragStart($event, item.id, 'note')"
          @dragover.prevent="onDragOverItem($event, item.id, 'note')"
          @dragend="onDragEnd"
          @touchstart="onTouchStart($event, item.id, 'note')"
          class="relative pl-4 border-l-2 border-l-primary-200 dark:border-l-primary-800/50"
          :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
          v-show="!isDraggedItem(item.id)">
          <NoteListItem
            :note="item.data" :active="item.data.id === currentNoteId"
            :select-mode="selectMode"
            :selected="selectedIds.has(item.data.id)"
            :shared="sharedNoteIds.includes(item.data.id)"
            :share-hash="sharedNotesMap.get(item.data.id) || null"
            :analytics-hash="analyticsNotesMap.get(item.data.id) || null"
            :pending="pendingNoteIds.has(item.data.id)"
            :is-logged-in="isLoggedIn"
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
            @toggle-select="toggleNoteSelection"
            @add-to-group="id => $emit('add-to-group', id)" />
        </div>

        <!-- ── Empty group placeholder ── -->
        <div v-else-if="item.kind === 'group-empty'"
          class="pl-4 border-l-2 border-l-primary-200 dark:border-l-primary-800/50 px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">
          No notes in this group
        </div>

        <!-- ── Ungrouped note ── -->
        <div v-else
          :data-item-id="item.id"
          :data-kind="'note'"
          :draggable="canReorder"
          @dragstart="onDragStart($event, item.id, 'note')"
          @dragover.prevent="onDragOverItem($event, item.id, 'note')"
          @dragend="onDragEnd"
          @touchstart="onTouchStart($event, item.id, 'note')"
          class="relative"
          :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
          v-show="!isDraggedItem(item.id)">
          <NoteListItem
            :note="item.data" :active="item.data.id === currentNoteId"
            :select-mode="selectMode"
            :selected="selectedIds.has(item.data.id)"
            :shared="sharedNoteIds.includes(item.data.id)"
            :share-hash="sharedNotesMap.get(item.data.id) || null"
            :analytics-hash="analyticsNotesMap.get(item.data.id) || null"
            :pending="pendingNoteIds.has(item.data.id)"
            :is-logged-in="isLoggedIn"
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
            @toggle-select="toggleNoteSelection"
            @add-to-group="id => $emit('add-to-group', id)" />
        </div>
      </template>

      <!-- ── Bottom gap + drop zone ── -->
      <div class="drag-gap-el overflow-hidden rounded-lg border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20 mx-1.5"
        :style="gapStyle(displayItems.length)" />
      <div v-if="draggingId"
        class="min-h-[60px]"
        @dragover.prevent="onDragOverBottom"
        @drop.prevent="onDrop" />
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
  groups: { type: Array, default: () => [] },
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
  'archive-note', 'unarchive-note', 'bulk-archive', 'bulk-unarchive',
  'add-to-group', 'toggle-group-collapse', 'edit-group', 'delete-group',
  'move-note-to-group', 'reorder-groups', 'reorder-all', 'reorder-within-group'
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

// ── Drag-to-reorder (unified list) ───────────────────────────────────

const draggingId = ref(null)
const draggingType = ref(null) // 'note' | 'group'
const dropTarget = ref(null)   // { id, type, position: 'before'|'after'|'inside' }
const hasDragMoved = ref(false) // true once cursor moves to a different item

const GROUP_DROP_THRESHOLD = 0.3

const isFiltering = computed(() => searchQuery.value.trim() !== '' || selectedTags.value.length > 0 || hasActiveFilters.value)
const canReorder = computed(() => !selectMode.value && !isFiltering.value)

// ── Auto-expand collapsed groups on hover ────────────────
let hoverExpandTimer = null
const HOVER_EXPAND_MS = 500
const dragExpandedGroupIds = ref(new Set()) // groups we auto-expanded during this drag

const startHoverExpand = (groupId) => {
  clearHoverExpand()
  const group = props.groups.find(g => g.id === groupId)
  if (!group || !group.collapsed) return
  hoverExpandTimer = setTimeout(() => {
    emit('toggle-group-collapse', groupId)
    dragExpandedGroupIds.value = new Set([...dragExpandedGroupIds.value, groupId])
  }, HOVER_EXPAND_MS)
}

const clearHoverExpand = () => {
  clearTimeout(hoverExpandTimer)
  hoverExpandTimer = null
}

// ── Unified sidebar items ────────────────────────────────

const filteredGroups = computed(() => {
  if (showArchive.value) return []
  if (isFiltering.value) return []
  return props.groups
})

const getGroupNotes = (groupId) => {
  return filteredNotes.value.filter(n => n.groupId === groupId)
}

const sidebarItems = computed(() => {
  const items = []
  for (const n of filteredNotes.value) {
    if (!n.groupId) {
      items.push({ id: n.id, kind: 'note', sortOrder: n.sortOrder ?? 0, data: n })
    }
  }
  for (const g of filteredGroups.value) {
    items.push({ id: g.id, kind: 'group', sortOrder: g.sortOrder ?? 0, data: g })
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder)
  return items
})

const displayItems = computed(() => {
  const list = []
  for (const item of sidebarItems.value) {
    list.push(item)
    if (item.kind === 'group') {
      const children = getGroupNotes(item.id)
      if (!item.data.collapsed) {
        if (children.length > 0) {
          for (const n of children) {
            list.push({ id: n.id, kind: 'grouped-note', sortOrder: n.sortOrder ?? 0, data: n, parentGroupId: item.id })
          }
        } else {
          list.push({ id: `${item.id}__empty`, kind: 'group-empty', sortOrder: 0, data: null, parentGroupId: item.id })
        }
      }
    }
  }
  return list
})

const dropInsertIndex = computed(() => {
  if (!dropTarget.value || !draggingId.value || !hasDragMoved.value) return -1
  const dt = dropTarget.value
  if (dt.position === 'inside') return -1
  const targetIdx = displayItems.value.findIndex(i => i.id === dt.id)
  if (targetIdx === -1) return -1
  return dt.position === 'before' ? targetIdx : targetIdx + 1
})

const GAP_PX = 52

const isDraggedItem = (id) => draggingId.value !== null && draggingId.value === id && !touchDragActive && hasDragMoved.value
const isTouchDraggedItem = (id) => draggingId.value !== null && draggingId.value === id && touchDragActive && hasDragMoved.value

/**
 * Returns inline style for the gap indicator's height.
 * The CSS transition on the indicator handles the animation.
 */
/**
 * Whether the current drop gap is inside a group (for indentation).
 */
const isGapInsideGroup = computed(() => {
  const idx = dropInsertIndex.value
  if (idx === -1) return false
  // Check the item AT the insert index — if it's a grouped-note, we're inserting before it (inside its group)
  const itemAt = displayItems.value[idx]
  if (itemAt?.kind === 'grouped-note') return true
  // Check the item BEFORE — if it's a grouped-note or group-empty, we're inserting after it (still inside)
  const itemBefore = idx > 0 ? displayItems.value[idx - 1] : null
  if (itemBefore?.kind === 'grouped-note' || itemBefore?.kind === 'group-empty') return true
  return false
})

const gapStyle = (idx) => {
  if (dropInsertIndex.value === idx) {
    const ml = isGapInsideGroup.value ? 'margin-left: 22px;' : 'margin-left: 6px;'
    return `height: 48px; margin-top: 2px; margin-bottom: 2px; border-width: 2px; ${ml}`
  }
  return 'height: 0px; margin-top: 0px; margin-bottom: 0px; border-width: 0px;'
}

// -- Custom drag image --

const createDragImage = (el) => {
  const clone = el.cloneNode(true)
  clone.style.position = 'absolute'
  clone.style.top = '-9999px'
  clone.style.left = '-9999px'
  clone.style.width = el.offsetWidth + 'px'
  clone.style.opacity = '0.85'
  clone.style.borderRadius = '8px'
  clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'
  clone.style.pointerEvents = 'none'
  clone.style.zIndex = '9999'
  clone.style.transform = 'rotate(1.5deg) scale(1.02)'
  document.body.appendChild(clone)
  return clone
}

let dragImageEl = null

// -- Mouse (HTML5 drag) --

const onDragStart = (e, id, type) => {
  if (!canReorder.value) return
  draggingId.value = id
  draggingType.value = type
  dragExpandedGroupIds.value = new Set()
  e.dataTransfer.effectAllowed = 'move'

  // Custom drag image: clone the actual DOM element
  const el = e.currentTarget
  dragImageEl = createDragImage(el)
  e.dataTransfer.setDragImage(dragImageEl, el.offsetWidth / 2, 20)
  // Clean up clone after a frame (browser captures it synchronously)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (dragImageEl) { dragImageEl.remove(); dragImageEl = null }
    })
  })
}

const onDragOverItem = (e, targetId, targetType) => {
  if (draggingId.value === null || draggingId.value === targetId) {
    dropTarget.value = null
    clearHoverExpand()
    return
  }

  hasDragMoved.value = true

  const rect = e.currentTarget.getBoundingClientRect()
  const y = e.clientY - rect.top
  const h = rect.height

  if (draggingType.value === 'note' && targetType === 'group') {
    if (y < h * GROUP_DROP_THRESHOLD) {
      dropTarget.value = { id: targetId, type: targetType, position: 'before' }
      clearHoverExpand()
    } else if (y > h * (1 - GROUP_DROP_THRESHOLD)) {
      dropTarget.value = { id: targetId, type: targetType, position: 'after' }
      clearHoverExpand()
    } else {
      dropTarget.value = { id: targetId, type: targetType, position: 'inside' }
      // Auto-expand collapsed group on hover
      startHoverExpand(targetId)
    }
  } else {
    dropTarget.value = {
      id: targetId,
      type: targetType,
      position: y < h / 2 ? 'before' : 'after'
    }
    clearHoverExpand()
  }
}

const onDragEnd = () => {
  clearHoverExpand()
  if (draggingId.value !== null) {
    for (const gid of dragExpandedGroupIds.value) {
      emit('toggle-group-collapse', gid)
    }
    draggingId.value = null
    draggingType.value = null
    dropTarget.value = null
    dragExpandedGroupIds.value = new Set()
    hasDragMoved.value = false
  }
}

const onDrop = () => {
  clearHoverExpand()
  commitReorder()
}

const onDragOverBottom = (e) => {
  if (draggingId.value === null) return
  // Treat as "after" the last item
  const last = displayItems.value.filter(i => i.kind !== 'group-empty').at(-1)
  if (last && last.id !== draggingId.value) {
    dropTarget.value = { id: last.id, type: last.kind === 'group' ? 'group' : 'note', position: 'after' }
  }
}

// -- Touch --

let touchDragActive = false
let touchHoldTimer = null
let touchCloneEl = null
const TOUCH_HOLD_MS = 300

const createTouchClone = (el) => {
  const clone = el.cloneNode(true)
  const rect = el.getBoundingClientRect()
  clone.style.position = 'fixed'
  clone.style.left = '8px'
  clone.style.width = (rect.width - 16) + 'px'
  clone.style.opacity = '0.9'
  clone.style.borderRadius = '8px'
  clone.style.boxShadow = '0 12px 32px rgba(0,0,0,0.22)'
  clone.style.pointerEvents = 'none'
  clone.style.zIndex = '9999'
  clone.style.transform = 'scale(1.02)'
  clone.style.transition = 'top 0.03s linear'
  document.body.appendChild(clone)
  return clone
}

const onTouchStart = (e, id, type) => {
  if (!canReorder.value) return

  const el = e.currentTarget

  touchHoldTimer = setTimeout(() => {
    touchDragActive = true
    draggingId.value = id
    draggingType.value = type
    dragExpandedGroupIds.value = new Set()

    // Create floating clone
    touchCloneEl = createTouchClone(el)
    const touch = e.touches[0]
    touchCloneEl.style.top = (touch.clientY - 26) + 'px'

    const onTouchMove = (ev) => {
      if (!touchDragActive) return
      ev.preventDefault()
      const touch = ev.touches[0]

      // Move the floating clone
      if (touchCloneEl) {
        touchCloneEl.style.top = (touch.clientY - 26) + 'px'
      }

      const hit = getItemAtY(touch.clientY)
      if (hit && hit.id !== draggingId.value) {
        hasDragMoved.value = true
        if (draggingType.value === 'note' && hit.type === 'group') {
          const hy = touch.clientY - hit.rect.top
          const hh = hit.rect.height
          if (hy < hh * GROUP_DROP_THRESHOLD) {
            dropTarget.value = { id: hit.id, type: hit.type, position: 'before' }
            clearHoverExpand()
          } else if (hy > hh * (1 - GROUP_DROP_THRESHOLD)) {
            dropTarget.value = { id: hit.id, type: hit.type, position: 'after' }
            clearHoverExpand()
          } else {
            dropTarget.value = { id: hit.id, type: hit.type, position: 'inside' }
            startHoverExpand(hit.id)
          }
        } else {
          dropTarget.value = { id: hit.id, type: hit.type, position: hit.position }
          clearHoverExpand()
        }
      } else if (!hit && listRef.value) {
        hasDragMoved.value = true
        // Below all items → treat as after last
        const last = displayItems.value.filter(i => i.kind !== 'group-empty').at(-1)
        if (last && last.id !== draggingId.value) {
          dropTarget.value = { id: last.id, type: last.kind === 'group' ? 'group' : 'note', position: 'after' }
        }
        clearHoverExpand()
      } else {
        dropTarget.value = null
        clearHoverExpand()
      }
    }

    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
      touchDragActive = false
      clearHoverExpand()
      if (touchCloneEl) { touchCloneEl.remove(); touchCloneEl = null }
      commitReorder()
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onTouchEnd)
  }, TOUCH_HOLD_MS)

  const onEarlyMove = () => {
    clearTimeout(touchHoldTimer)
    e.target.removeEventListener('touchmove', onEarlyMove)
  }
  e.target.addEventListener('touchmove', onEarlyMove, { once: true, passive: true })

  const onEarlyEnd = () => {
    clearTimeout(touchHoldTimer)
    e.target.removeEventListener('touchend', onEarlyEnd)
    e.target.removeEventListener('touchmove', onEarlyMove)
  }
  e.target.addEventListener('touchend', onEarlyEnd, { once: true })
}

const getItemAtY = (y) => {
  if (!listRef.value) return null
  const items = listRef.value.querySelectorAll('[data-item-id]')
  for (const item of items) {
    const rect = item.getBoundingClientRect()
    if (y >= rect.top && y <= rect.bottom) {
      const kind = item.dataset.kind
      return {
        id: item.dataset.itemId,
        type: kind === 'group' ? 'group' : 'note',
        position: y < rect.top + rect.height / 2 ? 'before' : 'after',
        rect
      }
    }
  }
  return null
}

// -- Commit --

const commitReorder = () => {
  if (draggingId.value === null || dropTarget.value === null) {
    for (const gid of dragExpandedGroupIds.value) {
      emit('toggle-group-collapse', gid)
    }
    draggingId.value = null
    draggingType.value = null
    dropTarget.value = null
    dragExpandedGroupIds.value = new Set()
    return
  }

  const dt = dropTarget.value
  const draggedNote = draggingType.value === 'note'
    ? filteredNotes.value.find(n => n.id === draggingId.value)
    : null
  const targetDisplayItem = displayItems.value.find(i => i.id === dt.id)

  if (draggingType.value === 'note') {
    // ── Note → group header (inside zone) → move into group
    if (dt.type === 'group' && dt.position === 'inside') {
      emit('move-note-to-group', { noteId: draggingId.value, groupId: dt.id })
    } else {
      // Figure out what group the note ends up in
      let newGroupId = null
      if (targetDisplayItem?.kind === 'grouped-note') {
        newGroupId = targetDisplayItem.parentGroupId
      } else if (targetDisplayItem?.kind === 'group') {
        newGroupId = null // before/after group header → ungrouped
      }
      // else 'note' (ungrouped) → null

      const oldGroupId = draggedNote?.groupId || null

      // ── Intra-group reorder (same group, both grouped)
      if (oldGroupId && newGroupId === oldGroupId && targetDisplayItem?.kind === 'grouped-note') {
        const siblings = getGroupNotes(oldGroupId)
        const ordered = [...siblings]
        const fromIdx = ordered.findIndex(n => n.id === draggingId.value)
        const toIdx = ordered.findIndex(n => n.id === dt.id)
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          const [moved] = ordered.splice(fromIdx, 1)
          let insertAt = ordered.findIndex(n => n.id === dt.id)
          if (insertAt === -1) insertAt = ordered.length
          if (dt.position === 'after') insertAt++
          ordered.splice(insertAt, 0, moved)
          emit('reorder-within-group', { groupId: oldGroupId, orderedNoteIds: ordered.map(n => n.id) })
        }
      }
      // ── Cross-group or ungrouped reorder
      else {
        // Change group if needed
        if (newGroupId !== oldGroupId) {
          emit('move-note-to-group', { noteId: draggingId.value, groupId: newGroupId })
        }

        // If moving into a group, reorder within that group
        if (newGroupId && targetDisplayItem?.kind === 'grouped-note') {
          const siblings = getGroupNotes(newGroupId).filter(n => n.id !== draggingId.value)
          const targetIdx = siblings.findIndex(n => n.id === dt.id)
          let insertAt = targetIdx === -1 ? siblings.length : targetIdx
          if (dt.position === 'after') insertAt++
          siblings.splice(insertAt, 0, draggedNote)
          emit('reorder-within-group', { groupId: newGroupId, orderedNoteIds: siblings.map(n => n.id) })
        }
        // If moving to top-level, reorder top-level
        else if (!newGroupId) {
          const topLevel = [...sidebarItems.value]
          const fromIdx = topLevel.findIndex(i => i.id === draggingId.value)
          let movedItem
          if (fromIdx !== -1) {
            [movedItem] = topLevel.splice(fromIdx, 1)
          } else {
            movedItem = { id: draggingId.value, kind: 'note', sortOrder: 0, data: draggedNote }
          }

          let targetTopId = dt.id
          if (targetDisplayItem?.kind === 'grouped-note') {
            targetTopId = targetDisplayItem.parentGroupId
          }
          let insertAt = topLevel.findIndex(i => i.id === targetTopId)
          if (insertAt === -1) insertAt = topLevel.length
          if (dt.position === 'after') insertAt++
          topLevel.splice(insertAt, 0, movedItem)

          emitUnifiedOrder(topLevel)
        }
      }
    }
  }
  // ── Group reorder
  else if (draggingType.value === 'group') {
    const topLevel = [...sidebarItems.value]
    const fromIdx = topLevel.findIndex(i => i.id === draggingId.value)
    let targetTopId = dt.id
    if (targetDisplayItem?.kind === 'grouped-note') {
      targetTopId = targetDisplayItem.parentGroupId
    }
    if (fromIdx !== -1) {
      const [moved] = topLevel.splice(fromIdx, 1)
      let insertAt = topLevel.findIndex(i => i.id === targetTopId)
      if (insertAt === -1) insertAt = topLevel.length
      if (dt.position === 'after') insertAt++
      topLevel.splice(insertAt, 0, moved)
      emitUnifiedOrder(topLevel)
    }
  }

  // Clear drag state after Vue has processed the reorder emits
  // so the item reappears at its new position, not the old one
  nextTick(() => {
    draggingId.value = null
    draggingType.value = null
    dropTarget.value = null
    dragExpandedGroupIds.value = new Set()
    hasDragMoved.value = false
  })
}

const emitUnifiedOrder = (topLevel) => {
  const orders = topLevel.map((item, idx) => ({
    id: item.id,
    kind: item.kind,
    sortOrder: idx
  }))
  emit('reorder-all', orders)
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
      const matchInternalName = (n.internalName || '').toLowerCase().includes(q)
      return matchTitle || matchDesc || matchTags || matchContent || matchInternalName
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

<style scoped>
.drag-gap-el {
  transition: height 0.15s ease-out, margin 0.15s ease-out, border-width 0.15s ease-out;
  margin-right: 6px;
}
</style>
