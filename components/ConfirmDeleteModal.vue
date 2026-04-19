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
    <p v-if="binEnabled && !skipBin" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      The note will be moved to the bin and can be restored later.
    </p>
    <label v-if="binEnabled" class="flex items-center gap-2 cursor-pointer select-none">
      <input
        v-model="skipBin"
        type="checkbox"
        class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 dark:bg-gray-700"
      >
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
