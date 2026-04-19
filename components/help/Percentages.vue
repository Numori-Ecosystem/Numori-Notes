<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:percent-outline" :title="$t('help.percentages.title')" description="Contextual, literal, and reverse percentage calculations" />

      <div class="space-y-8">
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Contextual</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">+ and -</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Percentage is applied to the base value, then added or subtracted.</p>
          <HelpCodeBlock :lines="['100 + 20%', '100 - 15%']" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Literal</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">* and /</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Percentage is treated as a decimal (5% → 0.05).</p>
          <HelpCodeBlock :lines="['100 * 5%', '100 / 5%']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Explicit Keywords</h4>
          <HelpCodeBlock :lines="['20% of 100', '5% on 30', '6% off 40']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Reverse Percentages</h4>
          <HelpCodeBlock :lines="['50 as a % of 100', '70 as a % on 20', '5% of what is 6', '5% on what is 6']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Compound Interest</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Use percentage exponentiation for compound growth calculations.</p>
          <HelpCodeBlock :lines="['interest = 110%', 'starting = 1000', 'years = 3', 'starting * interest ^ years']" />
        </div>
      </div>
    </div>
  </div>
</template>
