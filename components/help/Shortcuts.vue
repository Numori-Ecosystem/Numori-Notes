<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:keyboard-outline" :title="$t('shortcuts.title')" description="Keyboard shortcuts and quick references" />

      <div class="space-y-8">
        <!-- File Operations -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">File Operations</h4>
          <div class="rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="item in fileOps" :key="item.label" class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800/30">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</span>
              <UiKbd>{{ item.key }}</UiKbd>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Navigation</h4>
          <div class="rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800/30">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ $t('shortcuts.newLine') }}</span>
              <UiKbd>Enter</UiKbd>
            </div>
            <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800/30">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ $t('shortcuts.moveUp') }}</span>
              <UiKbd>↑</UiKbd>
            </div>
            <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800/30">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ $t('shortcuts.moveDown') }}</span>
              <UiKbd>↓</UiKbd>
            </div>
          </div>
        </div>

        <!-- Quick Functions -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Quick Functions</h4>
          <div class="rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="item in quickFns" :key="item.label" class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800/30">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">Type:</span>
                <UiKbd>{{ item.key }}</UiKbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Conversions -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Quick Conversions</h4>
          <div class="rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="item in quickConversions" :key="item.label" class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800/30">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">Type:</span>
                <UiKbd>{{ item.key }}</UiKbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modLabel: { type: String, default: 'Ctrl' },
})

const fileOps = computed(() => [
  { label: 'New Note', key: `${props.modLabel}+⇧+N` },
  { label: 'Open File', key: `${props.modLabel}+O` },
  { label: 'Save (auto-saved)', key: `${props.modLabel}+S` },
  { label: 'Duplicate Note', key: `${props.modLabel}+D` },
  { label: 'Export as Text', key: `${props.modLabel}+E` },
  { label: 'Print', key: `${props.modLabel}+P` },
  { label: 'Show Help', key: `${props.modLabel}+H` },
  { label: 'Export All Notes', key: `${props.modLabel}+⇧+S` },
])

const quickFns = [
  { label: 'Square root', key: 'sqrt(16)' },
  { label: 'Power/Exponent', key: '2^8' },
  { label: 'Percentage', key: '20% of 100' },
  { label: 'Previous result', key: 'prev' },
  { label: 'Sum all above', key: 'sum' },
  { label: 'Subtract from first', key: 'sub' },
]

const quickConversions = [
  { label: 'Currency conversion', key: '$100 in EUR' },
  { label: 'Unit conversion', key: '100 kg in lbs' },
  { label: 'Date arithmetic', key: 'today + 2 weeks' },
  { label: 'Number format', key: '255 in hex' },
]
</script>
