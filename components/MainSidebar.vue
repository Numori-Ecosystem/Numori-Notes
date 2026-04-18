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
        <div
v-if="selectMode"
          class="absolute inset-0 z-10 p-4 bg-primary-50 dark:bg-primary-900/20 flex flex-col justify-center space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
              {{ selectedIds.size }} selected
            </span>
            <UiButton
variant="ghost" color="gray" icon-only size="sm" title="Cancel selection"
              @click="exitSelectMode">
              <Icon name="mdi:close" class="w-5 h-5" />
            </UiButton>
          </div>
          <div class="flex items-center gap-2">
            <UiButton
variant="outline" color="gray" size="sm" icon-only class="flex-shrink-0"
              :title="allSelected ? 'Deselect All' : 'Select All'"
              @click="toggleSelectAll">
              <Icon :name="allSelected ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'" class="w-4 h-4" />
            </UiButton>
            <UiButton
variant="solid" color="primary" size="sm" :disabled="selectedIds.size === 0" class="flex-1"
              @click="bulkGroup">
              <Icon name="mdi:folder-outline" class="w-4 h-4" />
              Group
            </UiButton>
            <UiButton
v-if="showArchive" variant="solid" color="primary" size="sm" :disabled="selectedIds.size === 0" class="flex-1"
              @click="bulkUnarchive">
              <Icon name="mdi:package-up" class="w-4 h-4" />
              Unarchive
            </UiButton>
            <UiButton
v-else variant="solid" color="gray" size="sm" :disabled="selectedIds.size === 0" class="flex-1"
              @click="bulkArchive">
              <Icon name="mdi:archive-outline" class="w-4 h-4" />
              Archive
            </UiButton>
            <UiButton
variant="solid" color="red" size="sm" icon-only :disabled="selectedIds.size === 0" class="flex-shrink-0"
              title="Delete"
              @click="bulkDelete">
              <Icon name="mdi:trash-can-outline" class="w-4 h-4" />
            </UiButton>
          </div>
        </div>
      </Transition>

      <!-- Normal header (always in flow to maintain height) -->
      <div class="p-4 space-y-3" :class="{ 'invisible': selectMode }">
      <UiButton variant="solid" color="primary" block @click="$emit('new-note')">
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span>New Note</span>
      </UiButton>

      <!-- Search + select toggle + filters -->
      <div class="flex items-center gap-2">
        <UiButton
variant="ghost" icon-only size="sm" class="flex-shrink-0"
          :class="selectMode
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
          title="Select notes"
          @click="toggleSelectMode">
          <Icon name="mdi:checkbox-multiple-marked-outline" class="w-4 h-4 block" />
        </UiButton>
        <div class="relative flex-1">
          <Icon name="mdi:magnify" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <UiInput v-model="searchQuery" type="text" placeholder="Search notes..." :validate="false" />
        </div>
        <UiButton
variant="ghost" icon-only size="sm" class="flex-shrink-0"
          :class="showFilters || hasActiveFilters
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
          title="Filters"
          @click="showFilters = !showFilters">
          <Icon
:name="showFilters ? 'mdi:filter-variant-remove' : 'mdi:filter-variant'"
            class="w-4 h-4 block transition-transform duration-200"
            :class="{ 'rotate-180': showFilters }" />
        </UiButton>
        <UiButton
v-if="hasArchivedNotes" variant="ghost" icon-only size="sm" class="flex-shrink-0"
          :class="showArchive
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
          title="Archive"
          @click="showArchive = !showArchive">
          <Icon
:name="showArchive ? 'mdi:archive' : 'mdi:archive-outline'"
            class="w-4 h-4 block" />
        </UiButton>
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
          <UiSelect
v-model="filters.dateRange" size="xs"
            :options="[
              { value: '', label: 'Modified: Any time' },
              { value: 'today', label: 'Modified: Today' },
              { value: 'week', label: 'Modified: Past 7 days' },
              { value: 'month', label: 'Modified: Past 30 days' },
              { value: 'older', label: 'Modified: Older than 30 days' },
            ]" />

          <!-- Toggle chips -->
          <div class="flex flex-wrap gap-1.5">
            <UiButton
variant="ghost" shape="pill" size="xs" :class="filters.searchContent
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              @click="filters.searchContent = !filters.searchContent">
              Content
            </UiButton>
            <UiButton
variant="ghost" shape="pill" size="xs" :class="filters.hasDescription
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              @click="filters.hasDescription = !filters.hasDescription">
              Has desc
            </UiButton>
            <UiButton
variant="ghost" shape="pill" size="xs" :class="filters.hasTags
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              @click="filters.hasTags = !filters.hasTags">
              Has tags
            </UiButton>
            <UiButton
variant="ghost" shape="pill" size="xs" :class="filters.emptyOnly
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              @click="filters.emptyOnly = !filters.emptyOnly">
              Empty
            </UiButton>
            <UiButton
v-if="hasActiveFilters" variant="ghost" color="red" shape="pill" size="xs" class="ml-auto"
              @click="clearFilters">
              Clear
            </UiButton>
          </div>
        </div>
      </Transition>

      <!-- Tag filter -->
      <div v-if="allTags.length" class="flex flex-wrap gap-1.5">
        <UiButton
v-for="tag in allTags" :key="tag"
          variant="ghost" shape="pill" size="xs"
          :class="selectedTags.includes(tag)
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="toggleTag(tag)">
          {{ tag }}
        </UiButton>
      </div>
      </div>
    </div>

    <!-- Notes List -->
    <div
ref="listRef" class="flex-1 overflow-y-auto"
      @dragover.prevent="onDragOverList"
      @drop.prevent="onDrop">
      <div v-if="sidebarItems.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ showArchive ? 'No archived notes' : 'No notes found' }}
      </div>

      <template v-for="(item, idx) in displayItems" :key="item.id">
        <!-- ── Drop gap indicator ── -->
        <div
class="drag-gap-el overflow-hidden rounded-lg border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20"
          :style="gapStyle(idx)" />

        <!-- ── Group header ── -->
        <div
v-if="item.kind === 'group'"
          v-show="!isDraggedItem(item.id)"
          :data-item-id="item.id"
          :data-kind="'group'"
          :draggable="canReorder && !isTouchDevice"
          class="relative"
          :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
          @dragstart="onDragStart($event, item.id, 'group')"
          @dragend="onDragEnd"
          @touchstart.passive="onTouchStart($event, item.id, 'group')">
          <GroupListItem
            :group="item.data"
            :note-count="getGroupNotes(item.id).length"
            :drop-indicator="dropTarget?.id === item.id ? dropTarget?.position : null"
            @toggle-collapse="id => $emit('toggle-group-collapse', id)"
            @edit="id => $emit('edit-group', id)"
            @delete="id => $emit('delete-group', id)" />
        </div>

        <!-- ── Grouped note (child of a group) ── -->
        <div
v-else-if="item.kind === 'grouped-note'"
          v-show="!isDraggedItem(item.id)"
          :data-item-id="item.id"
          :data-kind="'note'"
          :data-group="item.parentGroupId"
          :draggable="canReorder && !isTouchDevice"
          class="relative pl-4 border-l-2 border-l-primary-200 dark:border-l-primary-800/50"
          :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
          @dragstart="onDragStart($event, item.id, 'note')"
          @dragend="onDragEnd"
          @touchstart.passive="onTouchStart($event, item.id, 'note')">
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
        <div
v-else-if="item.kind === 'group-empty'"
          class="pl-4 border-l-2 border-l-primary-200 dark:border-l-primary-800/50 px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">
          No notes in this group
        </div>

        <!-- ── Ungrouped note ── -->
        <div
v-else
          v-show="!isDraggedItem(item.id)"
          :data-item-id="item.id"
          :data-kind="'note'"
          :draggable="canReorder && !isTouchDevice"
          class="relative"
          :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
          @dragstart="onDragStart($event, item.id, 'note')"
          @dragend="onDragEnd"
          @touchstart.passive="onTouchStart($event, item.id, 'note')">
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
      <div
class="drag-gap-el overflow-hidden rounded-lg border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20 mx-1.5"
        :style="gapStyle(displayItems.length)" />
      <div v-if="draggingId" class="min-h-[60px]" />
    </div>

    <!-- User Account Section -->
    <div class="flex-shrink-0 bg-gray-100/80 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700">
      <UiDropdown
ref="accountDropdownRef" drop="up"
        panel-class="absolute bottom-full left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <template #trigger="{ toggle }">
          <!-- Logged-in state -->
          <UiButton v-if="isLoggedIn" variant="list-item" class="text-left" @click="toggle">
            <UiAvatar :src="user?.avatarUrl" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ user?.name || 'No name' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
            </div>
            <Icon
name="mdi:chevron-down"
              class="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': accountDropdownRef?.isOpen }" />
          </UiButton>

          <!-- Logged-out state -->
          <UiButton v-else variant="list-item" class="text-left" @click="toggle">
            <UiAvatar color="gray" fallback-icon="mdi:account-circle-outline" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-200">Guest</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Not signed in</p>
            </div>
            <Icon
name="mdi:chevron-down"
              class="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': accountDropdownRef?.isOpen }" />
          </UiButton>
        </template>

        <div class="py-1">
          <template v-if="isLoggedIn">
            <UiButton variant="menu-item" class="px-4" @click="accountAction('edit-profile')">
              <Icon name="mdi:account-edit-outline" class="w-4 h-4" />
              Edit Profile
            </UiButton>
          </template>
          <template v-else>
            <UiButton variant="menu-item" class="px-4" @click="accountAction('show-auth')">
              <Icon name="mdi:login" class="w-4 h-4" />
              Sign In / Sign Up
            </UiButton>
          </template>
          <UiButton variant="menu-item" class="px-4" @click="accountAction('show-locale-settings')">
            <Icon name="mdi:cog-outline" class="w-4 h-4" />
            Settings
          </UiButton>
          <UiButton variant="menu-item" class="px-4" @click="accountAction('show-language')">
            <Icon name="mdi:translate" class="w-4 h-4" />
            Change Language
          </UiButton>
          <template v-if="isLoggedIn">
            <UiDivider color="dark" />
            <UiButton variant="menu-item" color="red" class="px-4" @click="accountAction('logout')">
              <Icon name="mdi:logout" class="w-4 h-4" />
              Sign Out
            </UiButton>
          </template>
        </div>
      </UiDropdown>
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
  'archive-note', 'unarchive-note', 'bulk-archive', 'bulk-unarchive', 'bulk-group',
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
const accountDropdownRef = ref(null)

const accountAction = (action) => {
  accountDropdownRef.value?.close()
  emit(action)
}

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
    if (!n.groupId || showArchive.value) {
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
  if (dt.id === '__bottom__') return displayItems.value.length
  const targetIdx = displayItems.value.findIndex(i => i.id === dt.id)
  if (targetIdx === -1) return -1
  return dt.position === 'before' ? targetIdx : targetIdx + 1
})

const isDraggedItem = (id) => draggingId.value !== null && draggingId.value === id && !touchDragActive.value && hasDragMoved.value
const isTouchDraggedItem = (id) => draggingId.value !== null && draggingId.value === id && touchDragActive.value && hasDragMoved.value

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
  // Bottom drop zone is always top-level
  if (dropTarget.value?.id === '__bottom__') return false
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

const onDragOverList = (e) => {
  if (draggingId.value === null) return
  hasDragMoved.value = true
  updateDropTarget(e.clientY)
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



// -- Touch --

const touchDragActive = ref(false)
let touchHoldTimer = null
let touchCloneEl = null
const TOUCH_HOLD_MS = 400
const TOUCH_MOVE_THRESHOLD = 8

// Detect touch device — used to disable draggable attr which breaks touch
const isTouchDevice = ref(false)
if (typeof window !== 'undefined') {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

const createTouchClone = (el) => {
  const clone = el.cloneNode(true)
  const rect = el.getBoundingClientRect()
  clone.style.cssText = `
    position: fixed; left: 8px; width: ${rect.width - 16}px;
    opacity: 0.9; border-radius: 8px; pointer-events: none; z-index: 9999;
    box-shadow: 0 12px 32px rgba(0,0,0,0.22); transform: scale(1.02);
  `
  document.body.appendChild(clone)
  return clone
}

const cleanupTouchDrag = () => {
  clearTimeout(touchHoldTimer)
  touchHoldTimer = null
  if (touchCloneEl) { touchCloneEl.remove(); touchCloneEl = null }
  touchDragActive.value = false
}

const onTouchStart = (e, id, type) => {
  if (!canReorder.value) return

  const el = e.currentTarget
  const t0 = e.touches[0]
  const startX = t0.clientX
  const startY = t0.clientY
  let phase = 'waiting' // 'waiting' → 'dragging' | 'cancelled'

  // Prevent context menu during long press
  const onContextMenu = (ev) => ev.preventDefault()
  el.addEventListener('contextmenu', onContextMenu)

  const cancelHold = () => {
    if (phase === 'cancelled') return
    phase = 'cancelled'
    clearTimeout(touchHoldTimer)
    cleanup()
  }

  const cleanup = () => {
    el.removeEventListener('contextmenu', onContextMenu)
    document.removeEventListener('touchmove', onWaitingMove)
    document.removeEventListener('touchend', onWaitingEnd)
    document.removeEventListener('touchcancel', onWaitingEnd)
  }

  // Phase 1: waiting for hold timer. If finger moves too much, cancel.
  const onWaitingMove = (ev) => {
    const t = ev.touches[0]
    if (Math.abs(t.clientX - startX) > TOUCH_MOVE_THRESHOLD ||
        Math.abs(t.clientY - startY) > TOUCH_MOVE_THRESHOLD) {
      cancelHold()
    }
  }

  const onWaitingEnd = () => { cancelHold() }

  document.addEventListener('touchmove', onWaitingMove, { passive: true })
  document.addEventListener('touchend', onWaitingEnd)
  document.addEventListener('touchcancel', onWaitingEnd)

  // Phase 2: hold timer fires → enter drag mode
  touchHoldTimer = setTimeout(() => {
    if (phase !== 'waiting') return
    phase = 'dragging'

    // Remove waiting-phase listeners
    document.removeEventListener('touchmove', onWaitingMove)
    document.removeEventListener('touchend', onWaitingEnd)
    document.removeEventListener('touchcancel', onWaitingEnd)

    // Activate drag state
    touchDragActive.value = true
    draggingId.value = id
    draggingType.value = type
    dragExpandedGroupIds.value = new Set()

    // Haptic feedback
    try { window.navigator?.vibrate?.(30) } catch (_) { /* ignore */ }

    // Create floating clone
    touchCloneEl = createTouchClone(el)
    touchCloneEl.style.top = (startY - 26) + 'px'

    // Phase 2 listeners: drag move + end
    const onDragMove = (ev) => {
      ev.preventDefault() // prevent scroll while dragging
      const touch = ev.touches[0]

      if (touchCloneEl) {
        touchCloneEl.style.top = (touch.clientY - 26) + 'px'
      }

      // Auto-scroll near edges (scrollTop works even with overflow:hidden via JS)
      if (listRef.value) {
        const listRect = listRef.value.getBoundingClientRect()
        const SCROLL_ZONE = 50
        const SCROLL_SPEED = 6
        if (touch.clientY < listRect.top + SCROLL_ZONE) {
          listRef.value.scrollTop = Math.max(0, listRef.value.scrollTop - SCROLL_SPEED)
        } else if (touch.clientY > listRect.bottom - SCROLL_ZONE) {
          listRef.value.scrollTop += SCROLL_SPEED
        }
      }

      hasDragMoved.value = true
      updateDropTarget(touch.clientY)
    }

    const onDragEnd = () => {
      document.removeEventListener('touchmove', onDragMove)
      document.removeEventListener('touchend', onDragEnd)
      document.removeEventListener('touchcancel', onDragEnd)
      el.removeEventListener('contextmenu', onContextMenu)
      clearHoverExpand()
      cleanupTouchDrag()
      commitReorder()
    }

    document.addEventListener('touchmove', onDragMove, { passive: false })
    document.addEventListener('touchend', onDragEnd)
    document.addEventListener('touchcancel', onDragEnd)
  }, TOUCH_HOLD_MS)
}

const getItemAtY = (y) => {
  if (!listRef.value) return null
  const items = listRef.value.querySelectorAll('[data-item-id]')
  let closest = null
  let closestDist = Infinity
  for (const item of items) {
    // Skip hidden items (the dragged item is v-show=false or opacity-30)
    if (item.style.display === 'none') continue
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
    // Track closest item for when cursor is in the gap
    const distTop = Math.abs(y - rect.top)
    const distBottom = Math.abs(y - rect.bottom)
    const dist = Math.min(distTop, distBottom)
    if (dist < closestDist) {
      closestDist = dist
      closest = { item, rect, distTop, distBottom }
    }
  }
  // Cursor is in a gap between items — snap to the nearest edge
  if (closest && closestDist < 60) {
    const kind = closest.item.dataset.kind
    return {
      id: closest.item.dataset.itemId,
      type: kind === 'group' ? 'group' : 'note',
      position: closest.distTop < closest.distBottom ? 'before' : 'after',
      rect: closest.rect
    }
  }
  return null
}

/**
 * Shared drop-target update used by both mouse drag and touch drag.
 * Uses coordinate-based hit testing so the animated gap doesn't cause feedback loops.
 */
const updateDropTarget = (clientY) => {
  const hit = getItemAtY(clientY)

  if (hit && hit.id !== draggingId.value) {
    if (draggingType.value === 'note' && hit.type === 'group') {
      const hy = clientY - hit.rect.top
      const hh = hit.rect.height
      if (hy < hh * GROUP_DROP_THRESHOLD) {
        dropTarget.value = { id: hit.id, type: hit.type, position: 'before' }
        clearHoverExpand()
      } else if (hy > hh * (1 - GROUP_DROP_THRESHOLD)) {
        // Below the group header — if the group is expanded, treat as "inside"
        // (first position in the group), not "after" (which means ungrouped)
        const group = props.groups.find(g => g.id === hit.id)
        if (group && !group.collapsed) {
          dropTarget.value = { id: hit.id, type: hit.type, position: 'inside' }
        } else {
          dropTarget.value = { id: hit.id, type: hit.type, position: 'after' }
        }
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
    dropTarget.value = { id: '__bottom__', type: 'bottom', position: 'after' }
    clearHoverExpand()
  } else if (hit && hit.id === draggingId.value) {
    // Over the dragged item itself — keep current target, don't clear
  } else {
    dropTarget.value = null
    clearHoverExpand()
  }
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
    // ── Note → bottom drop zone → ungroup and place at end
    if (dt.id === '__bottom__') {
      if (draggedNote?.groupId) {
        emit('move-note-to-group', { noteId: draggingId.value, groupId: null })
      }
      const topLevel = [...sidebarItems.value]
      const fromIdx = topLevel.findIndex(i => i.id === draggingId.value)
      let movedItem
      if (fromIdx !== -1) {
        [movedItem] = topLevel.splice(fromIdx, 1)
      } else {
        movedItem = { id: draggingId.value, kind: 'note', sortOrder: 0, data: draggedNote }
      }
      topLevel.push(movedItem)
      emitUnifiedOrder(topLevel)
    }
    // ── Note → group header (inside zone) → move into group
    else if (dt.type === 'group' && dt.position === 'inside') {
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
    if (fromIdx !== -1) {
      const [moved] = topLevel.splice(fromIdx, 1)
      if (dt.id === '__bottom__') {
        topLevel.push(moved)
      } else {
        let targetTopId = dt.id
        if (targetDisplayItem?.kind === 'grouped-note') {
          targetTopId = targetDisplayItem.parentGroupId
        }
        let insertAt = topLevel.findIndex(i => i.id === targetTopId)
        if (insertAt === -1) insertAt = topLevel.length
        if (dt.position === 'after') insertAt++
        topLevel.splice(insertAt, 0, moved)
      }
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

const bulkGroup = () => {
  if (selectedIds.value.size === 0) return
  emit('bulk-group', [...selectedIds.value])
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
