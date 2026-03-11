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
      <NoteListItem v-for="note in notes" :key="note.id"
        :note="note" :active="note.id === currentNoteId"
        @select="id => $emit('select-note', id)"
        @edit="id => $emit('edit-note', id)"
        @delete="id => $emit('delete-note', id)" />
    </div>

    <!-- Bottom toolbar -->
    <SidebarFooter
      @show-templates="$emit('show-templates')"
      @show-help="$emit('show-help')"
      @show-locale-settings="$emit('show-locale-settings')"
      @show-language="$emit('show-language')" />
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

defineEmits(['new-note', 'select-note', 'delete-note', 'edit-note', 'show-templates', 'show-help', 'show-locale-settings', 'show-language'])
</script>
