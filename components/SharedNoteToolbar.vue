<template>
  <div class="flex flex-wrap items-center gap-1 sm:flex-nowrap">
    <!-- View toggles -->
    <div class="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
      <UiButtonsGroup
        :model-value="renderMarkdown"
        @update:model-value="$emit('update:renderMarkdown', $event)"
        size="sm" icon-class="w-4.5 h-4.5"
        :options="[
          { value: true, icon: 'mdi:language-markdown', title: 'Render Markdown' },
          { value: false, icon: 'mdi:format-text', title: 'Raw text' },
        ]"
      />

      <UiButtonsGroup
        :model-value="resultsPosition"
        @update:model-value="$emit('update:resultsPosition', $event)"
        size="sm" icon-class="w-4.5 h-4.5"
        :options="[
          { value: 'left', icon: 'mdi:dock-left', title: 'Results on left' },
          { value: 'off', icon: 'mdi:eye-off-outline', title: 'Results off' },
          { value: 'right', icon: 'mdi:dock-right', title: 'Results on right' },
        ]"
      />
    </div>

    <!-- Spacer / line break on mobile -->
    <div class="flex-1 basis-full sm:basis-0"></div>

    <!-- Actions: Copy · Export · Print · Import -->
    <div class="flex items-center justify-between sm:justify-end gap-0.5 w-full sm:w-auto">
      <UiButton @click="handleCopy" variant="ghost" color="gray" size="sm"
        :title="copied ? 'Copied!' : 'Copy to clipboard'">
        <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-3.5 h-3.5 sm:w-4 sm:h-4 block" :class="copied ? 'text-green-500' : ''" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </UiButton>

      <UiDivider direction="vertical" class="h-4 mx-0" />

      <UiDropdown ref="exportDropdownRef" width="w-52" align="right" :drop="dropUp ? 'up' : 'down'">
        <template #trigger="{ toggle }">
          <UiButton @click="toggle" variant="ghost" color="gray" size="sm" title="Export note">
            <Icon name="mdi:export" class="w-3.5 h-3.5 sm:w-4 sm:h-4 block" />
            <span>Export</span>
            <Icon name="mdi:chevron-down" class="w-3 h-3 block transition-transform" :class="{ 'rotate-180': exportDropdownRef?.isOpen }" />
          </UiButton>
        </template>

        <UiButton @click="emitExport('text')" variant="menu-item">
          <Icon name="mdi:file-document-outline" class="w-4 h-4 block flex-shrink-0" />
          <span>Text (.txt)</span>
        </UiButton>
        <UiButton @click="emitExport('markdown')" variant="menu-item">
          <Icon name="mdi:language-markdown-outline" class="w-4 h-4 block flex-shrink-0" />
          <span>Markdown (.md)</span>
        </UiButton>
        <UiButton @click="emitExport('pdf')" variant="menu-item">
          <Icon name="mdi:file-pdf-box" class="w-4 h-4 block flex-shrink-0" />
          <span>PDF</span>
        </UiButton>
        <UiDivider />
        <UiButton @click="emitExport('json')" variant="menu-item">
          <Icon name="mdi:code-json" class="w-4 h-4 block flex-shrink-0" />
          <span>Export as JSON</span>
        </UiButton>
      </UiDropdown>

      <UiButton @click="$emit('print')" variant="ghost" color="gray" size="sm"
        title="Print">
        <Icon name="mdi:printer" class="w-3.5 h-3.5 sm:w-4 sm:h-4 block" />
        <span>Print</span>
      </UiButton>

      <UiDivider direction="vertical" class="h-4 mx-0" />

      <UiButton @click="$emit('import')" variant="ghost" color="primary" size="sm"
        title="Import to my notes">
        <Icon name="mdi:note-plus-outline" class="w-3.5 h-3.5 sm:w-4 sm:h-4 block" />
        <span>Import</span>
      </UiButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  renderMarkdown: { type: Boolean, default: true },
  resultsPosition: { type: String, default: 'left' },
  copied: { type: Boolean, default: false },
  dropUp: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:renderMarkdown',
  'update:resultsPosition',
  'copy',
  'export',
  'print',
  'import',
])

const showExportMenu = ref(false)
const exportDropdownRef = ref(null)

const handleCopy = () => emit('copy')

const emitExport = (format) => {
  exportDropdownRef.value?.close()
  emit('export', format)
}
</script>
