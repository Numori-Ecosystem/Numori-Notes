<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:gate-and" title="Bitwise Operations" description="AND, OR, XOR, and shift operations" />

      <div class="space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="op in ops" :key="op.name" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-0.5">{{ op.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ op.symbol }}</p>
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
const ops = [
  { name: 'AND', symbol: '&' },
  { name: 'OR', symbol: '|' },
  { name: 'XOR', symbol: 'xor' },
  { name: 'Left Shift', symbol: '<<' },
  { name: 'Right Shift', symbol: '>>' },
]

const exampleLines = [
  '12 & 10',
  '12 | 10',
  '12 xor 10',
  '1 << 4',
  '16 >> 2',
]
</script>
