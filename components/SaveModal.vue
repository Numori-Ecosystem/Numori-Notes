<template>
  <UiPrompt
    :show="isOpen"
    title="Save Note"
    icon="mdi:content-save-outline"
    :confirm-on-enter="false"
    panel-class="!overflow-visible"
    @close="$emit('close')"
  >
    <div class="space-y-5 overflow-visible">
      <!-- Filename -->
      <div class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Filename
        </p>
        <UiInput
          v-model="filename"
          placeholder="Untitled"
          icon-left="mdi:note-outline"
        />
      </div>

      <!-- Format -->
      <div class="space-y-2.5 overflow-visible">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Format
        </p>
        <UiSelect
          v-model="selectedFormat"
          :options="formats"
          placeholder="Choose format…"
          size="md"
          searchable
        />
      </div>

      <!-- Options -->
      <div class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Options
        </p>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
          <label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <UiCheckbox v-model="includeResults" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Include results</span>
            </div>
            <Icon name="mdi:calculator-variant-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
          <label v-if="supportsColour" class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <UiCheckbox v-model="blackAndWhite" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Black &amp; white</span>
            </div>
            <Icon name="mdi:invert-colors-off" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
        </div>
      </div>

      <!-- Destination (native only) -->
      <div v-if="isNative" class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Destination
        </p>
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
import { Capacitor } from '@capacitor/core'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  noteTitle: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const isNative = Capacitor.isNativePlatform()

const filename = ref('')
const selectedFormat = ref('num')
const includeResults = ref(false)
const blackAndWhite = ref(false)
const destination = ref('device')

watch(() => props.isOpen, (open) => {
  if (open) {
    filename.value = props.noteTitle || ''
  }
})

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
    filename: filename.value.trim() || undefined,
  })
}
</script>
