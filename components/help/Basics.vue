<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:calculator" :title="$t('help.basics.title')" description="Arithmetic operations and implicit multiplication" />

      <div class="space-y-6">
        <div class="prose-sm text-gray-600 dark:text-gray-400">
          <p>{{ $t('help.basics.desc') }}</p>
        </div>

        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Standard Arithmetic</h4>
          <HelpCodeBlock :lines="arithmeticLines" />
        </div>

        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Implicit Multiplication</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">Numbers next to parentheses are automatically multiplied.</p>
          <HelpCodeBlock :lines="implicitLines" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const arithmeticLines = [
  '2 + 3',
  '10 - 4',
  '6 * 7',
  '20 / 4',
  '2 ^ 10',
  '17 mod 5',
  '(2 + 3) * 4',
]

const implicitLines = [
  '6 (3)',
  '(2)(3)',
]
</script>
