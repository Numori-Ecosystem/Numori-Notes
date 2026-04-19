<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:function-variant" :title="$t('help.functions.title')" description="Math, trig, and utility functions" />

      <div class="space-y-8">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('help.functions.desc') }}</p>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Basic Functions</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="fn in basicFns" :key="fn" class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 font-mono text-xs text-gray-700 dark:text-gray-300">
              {{ fn }}
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Roots &amp; Logarithms</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Use a number after root/log to specify the degree/base.</p>
          <HelpCodeBlock :lines="['root 2 (8)', 'root 3 (27)', 'log 2 (10)', 'log 10 (1000)']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Trigonometry</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Use ° for degrees. Without it, radians are assumed.</p>
          <HelpCodeBlock :lines="['sin(45°)', 'cos(60°)', 'tan(45°)']" />
          <HelpCodeBlock :lines="['arcsin(1)', 'arccos(0)', 'arctan(1)']" />
          <HelpCodeBlock :lines="['sinh(1)', 'cosh(1)', 'tanh(1)']" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const basicFns = [
  'sqrt(16) = 4',
  'cbrt(8) = 2',
  'abs(-4) = 4',
  'fact(5) = 120',
  'round(3.55) = 4',
  'ceil(3.76) = 4',
  'floor(2.56) = 2',
  'log(100) = 2',
  'ln(e) = 1',
  'fromunix(0)',
]
</script>
