<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:plus-minus-variant" title="Operators" description="Symbols and natural language operators" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">Use symbols or natural language — both work the same way.</p>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="op in operators" :key="op.name" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1">{{ op.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ op.symbols }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Examples</h4>
          <HelpCodeBlock :lines="exampleLines" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const operators = [
  { name: 'Addition', symbols: '+, plus, and, with' },
  { name: 'Subtraction', symbols: '-, minus, without' },
  { name: 'Multiplication', symbols: '*, times, mul' },
  { name: 'Division', symbols: '/, divide, divide by' },
  { name: 'Exponent', symbols: '^' },
  { name: 'Modulo', symbols: 'mod' },
]

const exampleLines = [
  '5 plus 3',
  '10 minus 3',
  '8 times 9',
  '20 divide by 4',
  '10 without 3',
  '8 multiplied by 9',
]
</script>
