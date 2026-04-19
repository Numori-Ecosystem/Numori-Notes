<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:gas-station-outline" title="Fuel Economy" description="Convert between fuel economy units" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">Convert between fuel economy units and calculate fuel consumption.</p>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="unit in units" :key="unit.code" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="font-mono text-xs font-bold text-gray-900 dark:text-gray-200">{{ unit.code }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ unit.desc }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Conversions</h4>
          <HelpCodeBlock :lines="['30 mpg in kpl', '30 mpg in l/100km', '8 l/100km in mpg', '12 kpl in mpg', '30 mpg in mpg_uk']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Fuel Cost Calculation</h4>
          <HelpCodeBlock :lines="['distance = 100 miles', 'mileage = 30 mpg', 'fuel = distance / mileage']" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const units = [
  { code: 'mpg', desc: 'Miles/gallon (US)' },
  { code: 'kpl', desc: 'Km/litre' },
  { code: 'mpl', desc: 'Miles/litre' },
  { code: 'kpg', desc: 'Km/gallon' },
  { code: 'l/100km', desc: 'Litres/100km' },
  { code: 'mpg_uk', desc: 'Miles/UK gallon' },
]
</script>
