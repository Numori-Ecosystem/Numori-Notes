<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:calendar-clock" title="Date & Time" description="Date keywords, arithmetic, and timezone conversion" />

      <div class="space-y-8">
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Date Keywords</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">These resolve to actual dates when evaluated.</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="kw in keywords" :key="kw.word" class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
              <span class="font-mono text-xs font-semibold text-gray-900 dark:text-gray-200">{{ kw.word }}</span>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ kw.desc }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Date Arithmetic</h4>
          <HelpCodeBlock :lines="['today + 3 days', 'today - 1 week', 'today + 2 months', '2 hours + 30 minutes']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Timezone Conversion</h4>
          <HelpCodeBlock :lines="['PST time', 'time in Madrid', 'time in Tokyo', '2:30 pm HKT in Berlin']" />
          <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
            <p class="text-xs text-gray-500 dark:text-gray-400">Supported zones: PST, EST, GMT, UTC, CET, IST, JST, HKT, AEST, and more.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Cities: New York, London, Paris, Tokyo, Sydney, etc.</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Unix Timestamps</h4>
          <HelpCodeBlock :lines="['fromunix(1446587186)', 'fromunix(0)']" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const keywords = [
  { word: 'now', desc: 'Current date & time' },
  { word: 'today', desc: 'Today at midnight' },
  { word: 'yesterday', desc: 'Yesterday' },
  { word: 'tomorrow', desc: 'Tomorrow' },
  { word: 'next week', desc: '7 days from now' },
  { word: 'last week', desc: '7 days ago' },
  { word: 'next month', desc: 'Next month' },
  { word: 'last month', desc: 'Last month' },
  { word: 'next year', desc: 'Next year' },
]
</script>
