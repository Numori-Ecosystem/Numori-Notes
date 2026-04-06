<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-4">
    <div v-if="visible"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      :class="isNative ? 'flex flex-col items-center gap-2 px-5 py-4 max-w-[15rem]' : 'flex items-center gap-3 pl-4 pr-10 py-3 max-w-sm'"
      :style="{ marginTop: 'env(safe-area-inset-top, 0px)' }"
      role="alert">

      <!-- Dismiss (top-right corner) -->
      <button @click="$emit('dismiss')"
        class="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Dismiss">
        <Icon name="mdi:close" class="w-4 h-4" />
      </button>

      <!-- Web: horizontal row -->
      <template v-if="!isNative">
        <Icon name="mdi:update" class="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
        <p class="text-sm text-gray-700 dark:text-gray-300 flex-1">A new version is available.</p>
        <button @click="$emit('apply')"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors flex-shrink-0">
          Reload
        </button>
      </template>

      <!-- Native: vertical stack -->
      <template v-else>
        <Icon name="mdi:update" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <p class="text-sm text-gray-700 dark:text-gray-300 text-center">A new version is available in the store.</p>
        <button @click="$emit('apply')"
          class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors">
          Update
        </button>
      </template>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  isNative: { type: Boolean, default: false }
})

defineEmits(['apply', 'dismiss'])
</script>
