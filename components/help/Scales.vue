<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:arrow-expand-vertical" title="Scales" description="Shorthand for large numbers" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">Use shorthand for large numbers in any context.</p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div v-for="s in scales" :key="s.label" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 text-center">
            <p class="text-sm font-mono font-bold text-gray-900 dark:text-gray-200">{{ s.label }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ s.value }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Basic Usage</h4>
          <HelpCodeBlock :lines="['5k', '2M', '1 billion', '1.5M - 500k', '2k + 500']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">With Units & Currency</h4>
          <HelpCodeBlock :lines="['2k meters in km', '500k bytes in MB', '$2k', '€3M', '£1 million', '$2k in EUR']" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const scales = [
  { label: 'k', value: '× 1,000' },
  { label: 'M', value: '× 1,000,000' },
  { label: 'billion', value: '× 10⁹' },
  { label: 'trillion', value: '× 10¹²' },
]
</script>
