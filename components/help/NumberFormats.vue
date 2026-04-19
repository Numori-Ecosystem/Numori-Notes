<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:numeric" title="Number Formats" description="Binary, hex, octal, and scientific notation" />

      <div class="space-y-8">
        <p class="text-sm text-gray-600 dark:text-gray-400">Work with different number bases and scientific notation.</p>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Binary</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono">0b prefix</span>
          </div>
          <HelpCodeBlock :lines="['0b1010', '0b1010 + 0b0101', '10 in bin']" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Hexadecimal</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono">0x prefix</span>
          </div>
          <HelpCodeBlock :lines="['0xFF', '0xFF + 1', '255 in hex']" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Octal</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono">0o prefix</span>
          </div>
          <HelpCodeBlock :lines="['0o1435343', '8 in oct']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Scientific Notation</h4>
          <HelpCodeBlock :lines="['5300 in sci']" />
        </div>
      </div>
    </div>
  </div>
</template>
