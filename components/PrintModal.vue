<template>
  <UiPrompt
    :show="isOpen"
    title="Print Note"
    icon="mdi:printer"
    confirm-label="Print"
    @close="$emit('close')"
    @confirm="handleConfirm"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">Configure print options:</p>
      <div class="flex flex-col gap-2.5">
        <label class="flex items-center gap-2 cursor-pointer">
          <UiCheckbox v-model="includeResults" size="sm" />
          <span class="text-xs text-gray-700 dark:text-gray-300">Include results</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <UiCheckbox v-model="blackAndWhite" size="sm" />
          <span class="text-xs text-gray-700 dark:text-gray-300">Black &amp; white</span>
        </label>
      </div>
    </div>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const includeResults = ref(false)
const blackAndWhite = ref(false)

const handleConfirm = () => {
  emit('confirm', {
    withResults: includeResults.value,
    blackAndWhite: blackAndWhite.value,
  })
}
</script>
