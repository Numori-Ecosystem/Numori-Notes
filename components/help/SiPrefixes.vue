<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:alpha-k-box-outline" :title="$t('help.si.title')" description="kilo, mega, giga, milli, micro prefixes" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('help.si.desc') }}</p>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="p in prefixes" :key="p.symbol" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 text-center">
            <p class="font-mono text-sm font-bold text-gray-900 dark:text-gray-200">{{ p.symbol }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ p.name }} = {{ p.value }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Examples</h4>
          <HelpCodeBlock :lines="['1 km in m', '1 mg in g', '1 MB in bytes', '1 kilogram in grams', '1 millimeter in meters']" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const prefixes = [
  { symbol: 'k', name: 'kilo', value: '10³' },
  { symbol: 'M', name: 'mega', value: '10⁶' },
  { symbol: 'G', name: 'giga', value: '10⁹' },
  { symbol: 'T', name: 'tera', value: '10¹²' },
  { symbol: 'm', name: 'milli', value: '10⁻³' },
  { symbol: 'μ', name: 'micro', value: '10⁻⁶' },
]
</script>
