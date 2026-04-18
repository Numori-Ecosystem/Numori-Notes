<template>
  <UiModal :show="isOpen" max-width="sm" @close="$emit('close')">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
          Delete Note
        </h2>
        <UiButton variant="ghost" color="gray" icon-only @click="$emit('close')">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete this note?
      </p>

      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" color="gray" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton color="red" @click="$emit('confirm')">
          Delete
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'confirm'])
</script>
