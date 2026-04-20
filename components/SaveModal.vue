<template>
  <UiModal :show="isOpen" max-width="sm" panel-class="!overflow-visible" :fullscreen-mobile="false" @close="$emit('close')">
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

        <!-- Destination (native only) -->
        <div v-if="isNative" class="space-y-1.5">
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300">Destination</p>
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
            <label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <UiRadio v-model="destination" value="device" name="save-dest" />
              <div class="flex-1 min-w-0">
                <span class="text-sm text-gray-800 dark:text-gray-200">Save to device</span>
              </div>
              <Icon name="mdi:cellphone" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            </label>
            <label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <UiRadio v-model="destination" value="share" name="save-dest" />
              <div class="flex-1 min-w-0">
                <span class="text-sm text-gray-800 dark:text-gray-200">Share</span>
              </div>
              <Icon name="mdi:share-variant-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            </label>
          </div>
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
import { Capacitor } from '@capacitor/core'

defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const isNative = Capacitor.isNativePlatform()

const selectedFormat = ref('num')
const includeResults = ref(false)
const blackAndWhite = ref(false)
const destination = ref('device')

const formats = [
  { value: 'num', label: 'Numori (.num)', subtitle: 'Native format, plain text' },
  { value: 'txt', label: 'Plain Text (.txt)', subtitle: 'Simple text, no formatting' },
  { value: 'md', label: 'Markdown (.md)', subtitle: 'Lightweight markup format' },
  { value: 'html', label: 'HTML (.html)', subtitle: 'Web page, opens in any browser' },
  { value: 'pdf', label: 'PDF (.pdf)', subtitle: 'Portable document, print-ready' },
  { value: 'rtf', label: 'Rich Text (.rtf)', subtitle: 'Formatted text, widely compatible' },
  { value: 'odt', label: 'OpenDocument (.odt)', subtitle: 'LibreOffice / open standard' },
  { value: 'docx', label: 'Word (.docx)', subtitle: 'Microsoft Word document' },
  { value: 'tex', label: 'LaTeX (.tex)', subtitle: 'Academic typesetting format' },
  { value: 'csv', label: 'CSV (.csv)', subtitle: 'Spreadsheet, expression & result columns' },
]

const colourFormats = new Set(['html', 'pdf', 'rtf', 'odt', 'docx'])
const supportsColour = computed(() => colourFormats.has(selectedFormat.value))

const handleSave = () => {
  emit('confirm', {
    format: selectedFormat.value,
    withResults: includeResults.value,
    blackAndWhite: blackAndWhite.value,
    destination: isNative ? destination.value : 'download',
  })
}
</script>
