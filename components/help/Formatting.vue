<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:format-header-pound" :title="$t('help.formatting.title')" description="Headers, comments, and labels" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">Use formatting to organize your notes visually.</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="font-mono text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1"># Header</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Large bold text, no result</p>
          </div>
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="font-mono text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1">// Comment</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Italic gray text, no result</p>
          </div>
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
            <p class="font-mono text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1">Label:</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Bold label, no result</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Labels with Calculations</h4>
          <HelpCodeBlock :lines="['# Monthly Budget', '// Income and expenses', 'Price: $100 * 2', '$275 for the &quot;Model 227&quot;']" />
          <p class="text-xs text-gray-400 dark:text-gray-500 italic">Empty lines separate sum/average calculations into groups.</p>
        </div>
      </div>
    </div>
  </div>
</template>
