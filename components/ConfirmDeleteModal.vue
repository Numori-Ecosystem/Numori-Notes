<template>
  <UiPrompt
    :show="isOpen"
    title="Delete Note"
    body="Are you sure you want to delete this note?"
    confirm-label="Delete"
    confirm-color="red"
    @close="$emit('close')"
    @confirm="$emit('confirm')"
  />
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>
