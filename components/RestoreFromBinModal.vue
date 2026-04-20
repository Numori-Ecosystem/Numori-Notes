<template>
  <UiPrompt
    :show="isOpen"
    title="Restore from Bin"
    icon="mdi:delete-restore"
    @close="$emit('close')"
  >
    <p class="text-sm text-gray-600 dark:text-gray-300">
      <span class="font-medium text-gray-800 dark:text-gray-100">"{{ noteTitle }}"</span>
      is in the Bin. Would you like to restore it?
    </p>

    <template #actions>
      <UiButton variant="ghost" color="gray" @click="$emit('close')">Cancel</UiButton>
      <UiButton @click="$emit('confirm')">
        <Icon name="mdi:delete-restore" class="w-4 h-4" />
        Restore
      </UiButton>
    </template>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  noteTitle: { type: String, default: '' },
})

defineEmits(['close', 'confirm'])
</script>
