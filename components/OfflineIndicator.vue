<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-full">
    <div v-if="offline"
      class="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white text-xs font-medium"
      :style="{ paddingTop: 'env(safe-area-inset-top, 0px)' }"
      role="status">
      <div class="flex items-center justify-center gap-2 px-4 py-1.5">
        <Icon name="mdi:wifi-off" class="w-3.5 h-3.5" />
        <span>You're offline — changes will sync when you reconnect</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  offline: { type: Boolean, default: false }
})
</script>
