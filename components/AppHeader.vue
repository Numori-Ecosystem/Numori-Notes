<template>
  <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 sticky top-0 z-10">
    <div class="flex items-center justify-between px-3 py-2">
      <!-- Left: Menu toggle & Title -->
      <div class="flex items-center gap-2">
        <button @click="$emit('toggle-sidebar')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none lg:hidden"
          title="Toggle notes list">
          <Icon name="mdi:menu" class="w-5 h-5 block" />
        </button>
        <button @click="$emit('show-meta')" class="text-left">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-400 truncate max-w-[200px] sm:max-w-none">
            {{ currentNote?.title || 'Notes' }}
          </h1>
        </button>
      </div>

      <!-- Center: Markdown formatting (desktop only) -->
      <FormattingToolbar class="hidden lg:flex flex-1" @apply-format="(before, after) => $emit('apply-format', before, after)" />

      <!-- Spacer on mobile to push right actions to the end -->
      <div class="flex-1 lg:hidden"></div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1">
        <!-- Alpha ribbon -->
        <span class="alpha-ribbon relative px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 mr-2">
          alpha
        </span>

        <!-- Toggle Mobile Formatting Toolbar -->
        <button @click="$emit('toggle-mobile-toolbar')"
          class="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
          :title="showMobileToolbar ? 'Hide formatting toolbar' : 'Show formatting toolbar'">
          <Icon name="mdi:format-text" class="w-5 h-5 block" :class="showMobileToolbar ? 'text-primary-500' : ''" />
        </button>

        <!-- Toggle inline results -->
        <button @click="$emit('toggle-inline')"
          class="p-2 rounded-lg transition-colors leading-none"
          :class="showInline
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850'"
          title="Toggle inline results">
          <Icon name="mdi:code-tags" class="w-5 h-5 block" />
        </button>

        <!-- Toggle sidebar results -->
        <button @click="$emit('toggle-sidebar-results')"
          class="p-2 rounded-lg transition-colors leading-none"
          :class="showSidebarResults
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850'"
          title="Toggle sidebar results">
          <Icon name="mdi:page-layout-sidebar-right" class="w-5 h-5 block" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentNote: {
    type: Object,
    default: null
  },
  showInline: {
    type: Boolean,
    default: false
  },
  showSidebarResults: {
    type: Boolean,
    default: true
  },
  showMobileToolbar: {
    type: Boolean,
    default: true
  }
})

defineEmits([
  'toggle-sidebar',
  'show-meta',
  'apply-format',
  'toggle-inline',
  'toggle-sidebar-results',
  'toggle-mobile-toolbar',
])
</script>

<style scoped>
.alpha-ribbon {
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%);
}
</style>
