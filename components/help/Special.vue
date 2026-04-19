<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:star-outline" :title="$t('help.special.title')" description="prev, sum, sub, and average keywords" />

      <div class="space-y-8">
        <!-- prev -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">prev</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Reference the previous line's result</span>
          </div>
          <HelpCodeBlock :lines="['20 + 56', 'prev - 5', 'prev - 5%']" />
        </div>

        <!-- sum -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">sum</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Sum all numeric lines above</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Sums until an empty line or header is reached. Works with operations too.</p>
          <HelpCodeBlock :lines="['10', '15', '25', 'sum']" />
          <HelpCodeBlock :lines="['Salary: €1457', 'Food: -€200', 'Fuel: -€100', 'sum']" />
        </div>

        <!-- sub -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">sub</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Subtract lines from the first value</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Takes the first line as starting value and subtracts all subsequent lines. No minus signs needed.</p>
          <HelpCodeBlock :lines="['Salary: €1457', 'Food: €200', 'Fuel: €100', 'Remaining: sub']" />
        </div>

        <!-- average -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">average</span>
            <span class="text-xs font-mono text-gray-400 dark:text-gray-500">/ avg</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Average lines above</span>
          </div>
          <HelpCodeBlock :lines="['10', '20', '30', 'average']" />
        </div>
      </div>
    </div>
  </div>
</template>
