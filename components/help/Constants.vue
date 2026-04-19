<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:pi" :title="$t('help.constants.title')" description="pi, e, tau, and phi" />

      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-3">
          <div v-for="c in constants" :key="c.name" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">{{ c.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ c.value }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ c.desc }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Usage</h4>
          <HelpCodeBlock :lines="['pi * 2', 'e ^ 2']" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const constants = [
  { name: 'pi', value: '3.14159...', desc: 'Circle ratio' },
  { name: 'e', value: '2.71828...', desc: "Euler's number" },
  { name: 'tau', value: '6.28318...', desc: '2π (full turn)' },
  { name: 'phi', value: '1.61803...', desc: 'Golden ratio' },
]
</script>
