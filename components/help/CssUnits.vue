<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:language-css3" title="CSS Units" description="Convert between px, em, rem, pt, and more" />

      <div class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">Convert between CSS units. Default: 1em = 16px, 1pt = 1.333px.</p>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Standard Conversions</h4>
          <HelpCodeBlock :lines="['12 pt in px', '1 em in px', '1 rem in px', '1 inch in px']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Custom Base Size</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Set a custom em/rem size with a variable.</p>
          <HelpCodeBlock :lines="['em = 20', '1.2 em in px']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Custom PPI</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Set pixels-per-inch for physical unit conversions (e.g., Retina display).</p>
          <HelpCodeBlock :lines="['ppi = 326', '1 cm in px']" />
        </div>
      </div>
    </div>
  </div>
</template>
