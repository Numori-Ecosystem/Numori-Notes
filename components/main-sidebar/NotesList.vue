<template>
  <div
    ref="listRef"
    class="flex-1 overflow-y-auto"
    @dragover.prevent="$emit('drag-over-list', $event)"
    @drop.prevent="$emit('drop')"
  >
    <div
      v-if="sidebarItems.length === 0"
      class="p-4 text-center text-sm text-gray-500 dark:text-gray-400 mt-8"
    >
      <template v-if="showBin">
        <Icon name="mdi:delete-empty-outline" class="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Bin is empty</p>
        <p class="text-xs mt-1 text-gray-400 dark:text-gray-500">Deleted notes will appear here</p>
      </template>
      <template v-else-if="showArchive">
        <Icon name="mdi:archive-off-outline" class="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No archived notes</p>
        <p class="text-xs mt-1 text-gray-400 dark:text-gray-500">Archived notes will appear here</p>
      </template>
      <template v-else>
        No notes found
      </template>
    </div>

    <template v-for="(item, idx) in displayItems" :key="item.id">
      <!-- ── Drop gap indicator ── -->
      <div
        class="drag-gap-el overflow-hidden rounded-lg border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20"
        :style="gapStyle(idx)"
      />

      <!-- ── Group header ── -->
      <div
        v-if="item.kind === 'group'"
        v-show="!isDraggedItem(item.id)"
        :data-item-id="item.id"
        :data-kind="'group'"
        :draggable="canReorder && !isTouchDevice"
        class="relative"
        :class="{ 'opacity-30': isTouchDraggedItem(item.id) }"
        @dragstart="$emit('drag-start', $event, item.id, 'group')"
        @dragend="$emit('drag-end')"
        @touchstart.passive="$emit('touch-start', $event, item.id, 'group')"
      >
        <GroupListItem
          :group="item.data"
          :note-count="getGroupNotes(item.id).length"
          :drop-indicator="dropTarget?.id === item.id ? dropTarget?.position : null"
          @toggle-collapse="(id) => $emit('toggle-group-collapse', id)"
          @edit="(id) => $emit('edit-group', id)"
          @delete="(id) => $emit('delete-group', id)"
        />
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
        @dragstart="$emit('drag-start', $event, item.id, 'note')"
        @dragend="$emit('drag-end')"
        @touchstart.passive="$emit('touch-start', $event, item.id, 'note')"
      >
        <NoteListItem
          :note="item.data"
          :active="item.data.id === currentNoteId"
          :select-mode="selectMode"
          :selected="selectedIds.has(item.data.id)"
          :shared="sharedNoteIds.includes(item.data.id)"
          :share-hash="sharedNotesMap.get(item.data.id) || null"
          :analytics-hash="analyticsNotesMap.get(item.data.id) || null"
          :pending="pendingNoteIds.has(item.data.id)"
          :is-logged-in="isLoggedIn"
          :bin-mode="showBin"
          @select="(id) => $emit('select-note', id)"
          @delete="(id) => $emit('delete-note', id)"
          @share="(id) => $emit('share-note', id)"
          @unshare="(id) => $emit('unshare-note', id)"
          @properties="(id) => $emit('show-properties', id)"
          @open-analytics="(hash) => $emit('open-analytics', hash)"
          @duplicate="(id) => $emit('duplicate-note', id)"
          @export="(id) => $emit('export-note', id)"
          @copy-to-clipboard="(id) => $emit('copy-to-clipboard', id)"
          @print="(id) => $emit('print-note', id)"
          @archive="(id) => $emit('archive-note', id)"
          @unarchive="(id) => $emit('unarchive-note', id)"
          @toggle-select="(id) => $emit('toggle-note-selection', id)"
          @add-to-group="(id) => $emit('add-to-group', id)"
          @restore="(id) => $emit('restore-note', id)"
          @permanent-delete="(id) => $emit('permanent-delete-note', id)"
        />
      </div>

      <!-- ── Empty group placeholder ── -->
      <div
        v-else-if="item.kind === 'group-empty'"
        class="pl-4 border-l-2 border-l-primary-200 dark:border-l-primary-800/50 px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic"
      >
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
        @dragstart="$emit('drag-start', $event, item.id, 'note')"
        @dragend="$emit('drag-end')"
        @touchstart.passive="$emit('touch-start', $event, item.id, 'note')"
      >
        <NoteListItem
          :note="item.data"
          :active="item.data.id === currentNoteId"
          :select-mode="selectMode"
          :selected="selectedIds.has(item.data.id)"
          :shared="sharedNoteIds.includes(item.data.id)"
          :share-hash="sharedNotesMap.get(item.data.id) || null"
          :analytics-hash="analyticsNotesMap.get(item.data.id) || null"
          :pending="pendingNoteIds.has(item.data.id)"
          :is-logged-in="isLoggedIn"
          :bin-mode="showBin"
          @select="(id) => $emit('select-note', id)"
          @delete="(id) => $emit('delete-note', id)"
          @share="(id) => $emit('share-note', id)"
          @unshare="(id) => $emit('unshare-note', id)"
          @properties="(id) => $emit('show-properties', id)"
          @open-analytics="(hash) => $emit('open-analytics', hash)"
          @duplicate="(id) => $emit('duplicate-note', id)"
          @export="(id) => $emit('export-note', id)"
          @copy-to-clipboard="(id) => $emit('copy-to-clipboard', id)"
          @print="(id) => $emit('print-note', id)"
          @archive="(id) => $emit('archive-note', id)"
          @unarchive="(id) => $emit('unarchive-note', id)"
          @toggle-select="(id) => $emit('toggle-note-selection', id)"
          @add-to-group="(id) => $emit('add-to-group', id)"
          @restore="(id) => $emit('restore-note', id)"
          @permanent-delete="(id) => $emit('permanent-delete-note', id)"
        />
      </div>
    </template>

    <!-- ── Bottom gap + drop zone ── -->
    <div
      class="drag-gap-el overflow-hidden rounded-lg border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20 mx-1.5"
      :style="gapStyle(displayItems.length)"
    />
    <div v-if="draggingId" class="min-h-[60px]" />
  </div>
</template>

<script setup>
defineProps({
  sidebarItems: { type: Array, required: true },
  displayItems: { type: Array, required: true },
  showBin: { type: Boolean, required: true },
  showArchive: { type: Boolean, required: true },
  currentNoteId: { type: String, default: null },
  selectMode: { type: Boolean, required: true },
  selectedIds: { type: Set, required: true },
  sharedNoteIds: { type: Array, required: true },
  sharedNotesMap: { type: Map, required: true },
  analyticsNotesMap: { type: Map, required: true },
  pendingNoteIds: { type: Set, required: true },
  isLoggedIn: { type: Boolean, required: true },
  canReorder: { type: Boolean, required: true },
  isTouchDevice: { type: Boolean, required: true },
  draggingId: { type: [String, null], default: null },
  dropTarget: { type: Object, default: null },
  getGroupNotes: { type: Function, required: true },
  gapStyle: { type: Function, required: true },
  isDraggedItem: { type: Function, required: true },
  isTouchDraggedItem: { type: Function, required: true },
})

defineEmits([
  'drag-over-list',
  'drop',
  'drag-start',
  'drag-end',
  'touch-start',
  'toggle-group-collapse',
  'edit-group',
  'delete-group',
  'select-note',
  'delete-note',
  'share-note',
  'unshare-note',
  'show-properties',
  'open-analytics',
  'duplicate-note',
  'export-note',
  'copy-to-clipboard',
  'print-note',
  'archive-note',
  'unarchive-note',
  'toggle-note-selection',
  'add-to-group',
  'restore-note',
  'permanent-delete-note',
])

const listRef = ref(null)

defineExpose({ listRef })
</script>

<style scoped>
.drag-gap-el {
  transition:
    height 0.15s ease-out,
    margin 0.15s ease-out,
    border-width 0.15s ease-out;
  margin-right: 6px;
}
</style>
