<template>
  <UiPrompt
    :show="isOpen"
    title="Save Note"
    icon="mdi:content-save-outline"
    :confirm-on-enter="false"
    fullscreen-mobile
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <div>
        <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Format</p>
        <div class="grid grid-cols-2 gap-1.5">
          <label
            v-for="fmt in formats"
            :key="fmt.value"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-200 dark:ring-primary-700': selectedFormat === fmt.value }"
          >
            <UiRadio v-model="selectedFormat" :value="fmt.value" name="save-format" size="sm" />
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ fmt.label }}</span>
          </label>
        </div>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <UiCheckbox v-model="includeResults" size="sm" />
          <span class="text-xs text-gray-700 dark:text-gray-300">Include calculation results</span>
        </label>
      </div>
    </div>

    <template #actions>
      <UiButton variant="ghost" color="gray" @click="$emit('close')">Cancel</UiButton>
      <UiButton @click="handleSave">
        <Icon name="mdi:content-save-outline" class="w-4 h-4" />
        Save
      </UiButton>
    </template>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const selectedFormat = ref('num')
const includeResults = ref(false)

const formats = [
  { value: 'num', label: '.num' },
  { value: 'txt', label: '.txt' },
  { value: 'md', label: '.md (Markdown)' },
  { value: 'pdf', label: '.pdf' },
  { value: 'rtf', label: '.rtf' },
  { value: 'odt', label: '.odt' },
  { value: 'docx', label: '.docx' },
]

const handleSave = () => {
  emit('confirm', { format: selectedFormat.value, withResults: includeResults.value })
}
</script>
