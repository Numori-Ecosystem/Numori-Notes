<template>
  <UiModal :show="isOpen" max-width="sm" panel-class="!overflow-visible" @close="$emit('close')">
    <div class="p-4 sm:p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Icon name="mdi:content-save-outline" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-200">Save Note</h2>
        </div>
        <UiButton variant="ghost" color="gray" icon-only @click="$emit('close')">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <div class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Format</label>
          <UiSelect
            v-model="selectedFormat"
            :options="formats"
            placeholder="Choose format…"
            size="md"
            searchable
          />
        </div>

        <div class="flex items-center gap-5">
          <label class="flex items-center gap-2 cursor-pointer">
            <UiCheckbox v-model="includeResults" size="sm" />
            <span class="text-xs text-gray-700 dark:text-gray-300">Include results</span>
          </label>
          <label v-if="supportsColour" class="flex items-center gap-2 cursor-pointer">
            <UiCheckbox v-model="blackAndWhite" size="sm" />
            <span class="text-xs text-gray-700 dark:text-gray-300">Black &amp; white</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <UiButton variant="ghost" color="gray" @click="$emit('close')">Cancel</UiButton>
        <UiButton @click="handleSave">
          <Icon name="mdi:content-save-outline" class="w-4 h-4" />
          Save
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const selectedFormat = ref('num')
const includeResults = ref(false)
const blackAndWhite = ref(false)

const formats = [
  { value: 'num', label: 'Numori (.num)', subtitle: 'Native format, plain text' },
  { value: 'txt', label: 'Plain Text (.txt)', subtitle: 'Simple text, no formatting' },
  { value: 'md', label: 'Markdown (.md)', subtitle: 'Lightweight markup format' },
  { value: 'pdf', label: 'PDF (.pdf)', subtitle: 'Portable document, print-ready' },
  { value: 'rtf', label: 'Rich Text (.rtf)', subtitle: 'Formatted text, widely compatible' },
  { value: 'odt', label: 'OpenDocument (.odt)', subtitle: 'LibreOffice / open standard' },
  { value: 'docx', label: 'Word (.docx)', subtitle: 'Microsoft Word document' },
]

const colourFormats = new Set(['pdf', 'rtf', 'odt', 'docx'])
const supportsColour = computed(() => colourFormats.has(selectedFormat.value))

const handleSave = () => {
  emit('confirm', {
    format: selectedFormat.value,
    withResults: includeResults.value,
    blackAndWhite: blackAndWhite.value,
  })
}
</script>
