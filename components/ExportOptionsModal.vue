<template>
  <UiModal :show="isOpen" max-width="sm" @close="$emit('close')">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
          Export Options
        </h2>
        <UiButton variant="ghost" color="gray" icon-only @click="$emit('close')">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Include calculation results in the export?
      </p>

      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" color="gray" @click="$emit('confirm', false)">
          Without Results
        </UiButton>
        <UiButton @click="$emit('confirm', true)">
          With Results
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
