<template>
  <div
    class="flex items-center justify-between gap-4 py-3 -mx-0.5 px-0.5"
    :class="border ? 'border-b border-gray-100 dark:border-gray-700/40 last:border-b-0' : ''"
  >
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <Icon v-if="icon" :name="icon" class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <label class="text-sm text-gray-800 dark:text-gray-300">{{ label }}</label>
      </div>
      <p v-if="hint" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5" :class="icon ? 'ml-6' : ''">
        {{ hint }}
      </p>
    </div>
    <div class="flex-shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: { type: String, default: '' },
  border: { type: Boolean, default: true },
})
</script>
