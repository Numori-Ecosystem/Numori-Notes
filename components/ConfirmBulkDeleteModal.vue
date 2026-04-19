<template>
  <UiPrompt
    :show="isOpen"
    :title="`Delete ${count} ${count === 1 ? 'Note' : 'Notes'}`"
    :body="`Are you sure you want to delete ${count} ${count === 1 ? 'note' : 'notes'}? This cannot be undone.`"
    :confirm-label="`Delete ${count} ${count === 1 ? 'Note' : 'Notes'}`"
    confirm-color="red"
    @close="$emit('close')"
    @confirm="$emit('confirm')"
  />
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
})

defineEmits(['close', 'confirm'])
</script>
