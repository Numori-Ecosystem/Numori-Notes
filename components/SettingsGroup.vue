<template>
  <div class="rounded-xl bg-white dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/50">
    <div v-if="title" class="px-4 pt-3.5 pb-1">
      <h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {{ title }}
      </h4>
    </div>
    <div :class="title ? 'px-4 pb-3 pt-1' : 'p-4'">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
})
</script>
