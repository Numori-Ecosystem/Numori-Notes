<template>
  <UiPrompt
    :show="isOpen"
    title="Delete Note"
    confirm-label="Delete"
    confirm-color="red"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <p class="mb-3">Are you sure you want to delete this note?</p>
    <label v-if="binEnabled" class="flex items-center gap-2 cursor-pointer select-none">
      <UiCheckbox v-model="skipBin" />
      <span class="text-sm text-gray-600 dark:text-gray-400">Delete permanently (skip bin)</span>
    </label>
  </UiPrompt>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  binEnabled: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'confirm'])

const skipBin = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) skipBin.value = false
})

const handleClose = () => emit('close')
const handleConfirm = () => emit('confirm', { skipBin: skipBin.value })
</script>
