<template>
  <div class="relative" ref="submenuRef"
    @mouseenter="!isMobile && (showSub = true)"
    @mouseleave="!isMobile && (showSub = false)">
    <button @click="showSub = !showSub"
      class="w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors"
      :class="disabled
        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850'"
      :disabled="disabled">
      <Icon :name="icon" class="w-4 h-4 block flex-shrink-0" />
      <span class="flex-1 text-left">{{ label }}</span>
      <Icon :name="isMobile ? (showSub ? 'mdi:chevron-up' : 'mdi:chevron-down') : 'mdi:chevron-right'"
        class="w-3.5 h-3.5 block flex-shrink-0 text-gray-400" />
    </button>

    <!-- Mobile: inline accordion -->
    <Transition
      enter-active-class="transition-all duration-100 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-60 opacity-100"
      leave-active-class="transition-all duration-75 ease-in"
      leave-from-class="max-h-60 opacity-100"
      leave-to-class="max-h-0 opacity-0">
      <div v-if="showSub && !disabled && isMobile"
        class="overflow-hidden bg-gray-50 dark:bg-gray-850 border-l-2 border-primary-400 ml-5">
        <slot />
      </div>
    </Transition>

    <!-- Desktop: flyout -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="showSub && !disabled && !isMobile"
        class="absolute top-0 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50"
        :class="alignLeft ? 'right-full mr-1' : 'left-full ml-1'">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  alignLeft: { type: Boolean, default: false },
})

const showSub = ref(false)
const submenuRef = ref(null)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>
