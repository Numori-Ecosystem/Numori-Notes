<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:ruler" :title="$t('help.units.title')" description="Length, weight, volume, temperature, and more" />

      <div class="space-y-8">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('help.units.desc') }} Units work with or without spaces (e.g., 100km or 100 km).</p>

        <div v-for="cat in categories" :key="cat.title" class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ cat.title }}</h4>
          <HelpCodeBlock :lines="cat.lines" />
          <p v-if="cat.note" class="text-xs text-gray-400 dark:text-gray-500 italic">{{ cat.note }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const categories = [
  {
    title: 'Length',
    lines: ['1 km in m', '1 mile in km', '1 foot in cm', '1 inch in cm', '1 yard in m', '1 km + 500 m in m'],
  },
  {
    title: 'Weight',
    lines: ['1 kg in lb', '1 oz in g', '1 tonne in kg', '1 stone in lb'],
  },
  {
    title: 'Volume',
    lines: ['1 gallon in liters', '1 cup in ml', '1 tablespoon in ml', '1 teaspoon in ml', '1 pint in ml', '1 cbm in liters'],
  },
  {
    title: 'Temperature',
    lines: ['0 celsius in fahrenheit', '100 celsius in fahrenheit', '32 fahrenheit in celsius', '0 celsius in kelvin'],
  },
  {
    title: 'Area',
    lines: ['1 acre in sqm', '1 hectare in acres', '1 sqft in sqm'],
  },
  {
    title: 'Speed',
    lines: ['100 kph in mph', '60 mph in kph', '1 knot in kph'],
  },
  {
    title: 'Time',
    lines: ['1 hour in minutes', '1 day in hours', '1 week in days', '1 year in days'],
  },
  {
    title: 'Data',
    lines: ['1 GB in MB', '1 TB in GB', '1 GiB in MiB', '1 byte in bits', '1 KiB in bytes'],
    note: 'KB/MB/GB use 1000 (SI). KiB/MiB/GiB use 1024 (binary).',
  },
  {
    title: 'Angular',
    lines: ['180 degrees in radians', '90° in radians'],
  },
]
</script>
