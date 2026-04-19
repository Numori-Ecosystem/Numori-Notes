<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:variable" :title="$t('help.variables.title')" description="Store and reuse values across lines" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('help.variables.desc') }}</p>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Assign & Use</h4>
          <HelpCodeBlock :lines="['x = 10', 'x + 5']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Multiple Variables</h4>
          <HelpCodeBlock :lines="['a = 10', 'b = 20', 'a + b']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Naming Rules</h4>
          <HelpCodeBlock :lines="['my_var = 42', 'v2 = 100']" />
          <p class="text-xs text-gray-400 dark:text-gray-500 italic">Variable names support letters, numbers, and underscores.</p>
        </div>
      </div>
    </div>
  </div>
</template>
