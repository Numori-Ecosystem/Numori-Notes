<template>
  <UiPrompt
    :show="isOpen"
    title="Duplicates Found"
    icon="mdi:content-duplicate"
    :confirm-on-enter="false"
    @close="handleClose"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ duplicateCount }} note{{ duplicateCount === 1 ? '' : 's' }} already
        exist{{ duplicateCount === 1 ? 's' : '' }} in your library.
        What would you like to do?
      </p>
    </div>
    <template #actions>
      <UiButton variant="ghost" color="gray" @click="handleClose">Cancel</UiButton>
      <UiButton variant="ghost" color="gray" @click="handleSkip">Skip Duplicates</UiButton>
      <UiButton @click="handleOverwrite">Overwrite</UiButton>
    </template>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  duplicateCount: { type: Number, default: 0 },
})

const emit = defineEmits(['close', 'skip', 'overwrite'])

const handleClose = () => emit('close')
const handleSkip = () => emit('skip')
const handleOverwrite = () => emit('overwrite')
</script>
