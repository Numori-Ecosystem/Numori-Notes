<template>
  <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">
    <slot />
  </kbd>
</template>

<script setup>
/**
 * UiKbd — Keyboard shortcut badge for displaying key combinations.
 *
 * Renders a styled `<kbd>` element with monospace font and subtle background,
 * matching the app's light/dark theme. Used in help screens and shortcut hints.
 *
 * @example Single key
 * <UiKbd>Enter</UiKbd>
 *
 * @example Key combination
 * <UiKbd>Ctrl+S</UiKbd>
 *
 * @example In a shortcut row
 * <div class="flex justify-between">
 *   <span>Save</span>
 *   <UiKbd>{{ modLabel }}+S</UiKbd>
 * </div>
 *
 * @slot default — Key text or combination to display
 */
</script>
