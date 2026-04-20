<template>
  <UiPrompt
    :show="isOpen"
    :title="count > 1 ? `Permanently Delete ${count} Notes` : 'Permanently Delete Note'"
    :confirm-label="count > 1 ? `Delete ${count} Notes Forever` : 'Delete Forever'"
    confirm-color="red"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <p>
      <template v-if="count > 1">
        Are you sure you want to permanently delete {{ count }} notes? This action cannot be undone.
      </template>
      <template v-else>
        Are you sure you want to permanently delete this note? This action cannot be undone.
      </template>
    </p>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  count: { type: Number, default: 1 },
})

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => emit('close')
const handleConfirm = () => emit('confirm')
</script>
