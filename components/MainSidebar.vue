<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
      <button @click="$emit('new-note')"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md">
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span>New Note</span>
      </button>

      <!-- Search -->
      <div class="relative">
        <Icon name="mdi:magnify" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input v-model="searchQuery" type="text" placeholder="Search notes..."
          class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
      </div>

      <!-- Tag filter -->
      <div v-if="allTags.length" class="flex flex-wrap gap-1.5">
        <button v-for="tag in allTags" :key="tag"
          @click="toggleTag(tag)"
          class="px-2 py-0.5 rounded-f
ull text-xs font-medium transition-colors"
          :class="selectedTags.includes(tag)
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'">
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filteredNotes.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No notes found
      </div>
      <NoteListItem v-for="note in filteredNotes" :key="note.id"
        :note="note" :active="note.id === currentNoteId"
        @select="id => $emit('select-note', id)"
        @edit="id => $emit('edit-note', id)"
        @delete="id => $emit('delete-note', id)" />
    </div>

    <!-- Bottom toolbar -->
    <SidebarFooter
      @show-help="$emit('show-help')"
      @show-locale-settings="$emit('show-locale-settings')"
      @show-language="$emit('show-language')" />
  </div>
</template>

<script setup>
const props = defineProps({
  notes: { type: Array, required: true },
  currentNoteId: { type: String, default: null },
  allTags: { type: Array, default: () => [] }
})

defineEmits(['new-note', 'select-note', 'delete-note', 'edit-note', 'show-help', 'show-locale-settings', 'show-language'])

const searchQuery = ref('')
const selectedTags = ref([])

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
  return result
})
</script>
