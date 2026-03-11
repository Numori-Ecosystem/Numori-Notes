<template>
  <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 sticky top-0 z-10">
    <div class="flex items-center justify-between px-3 py-2">
      <!-- Left: Menu toggle & Title -->
      <div class="flex items-center gap-2">
        <button @click="$emit('toggle-sidebar')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors lg:hidden"
          title="Toggle notes list">
          <Icon name="mdi:menu" class="w-5 h-5" />
        </button>
        <button @click="$emit('show-meta')" class="text-left">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-400 truncate max-w-[200px] sm:max-w-none">
            {{ currentNote?.title || 'Notes' }}
          </h1>
        </button>
      </div>

      <!-- Center: Markdown formatting -->
      <div class="flex-1 flex items-center justify-center gap-1 overflow-x-auto">
        <button @click="$emit('apply-format', '**', '**')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Bold">
          <Icon name="mdi:format-bold" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '*', '*')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Italic">
          <Icon name="mdi:format-italic" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '~~', '~~')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Strikethrough">
          <Icon name="mdi:format-strikethrough" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '# ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Heading">
          <Icon name="mdi:format-header-1" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '- ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="List">
          <Icon name="mdi:format-list-bulleted" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '- [ ] ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Checklist">
          <Icon name="mdi:checkbox-marked-outline" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '> ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Quote">
          <Icon name="mdi:format-quote-close" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '`', '`')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Code">
          <Icon name="mdi:code-tags" class="w-5 h-5" />
        </button>
        <button @click="$emit('apply-format', '[', '](url)')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Link">
          <Icon name="mdi:link-variant" class="w-5 h-5" />
        </button>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1">
        <!-- Alpha ribbon -->
        <span class="alpha-ribbon relative px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 mr-2">
          alpha
        </span>

        <!-- Toggle Results -->
        <button @click="$emit('toggle-results')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          :title="showResults ? 'Hide results' : 'Show results'">
          <Icon v-if="showResults" name="mdi:eye-off-outline" class="w-5 h-5" />
          <Icon v-else name="mdi:eye-outline" class="w-5 h-5" />
        </button>

        <!-- Language -->
        <button @click="$emit('show-language')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors"
          title="Language">
          <Icon name="mdi:translate" class="w-5 h-5" />
        </button>

        <!-- Theme Toggle -->
        <ThemeSwitcher />

        <div class="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        <!-- Settings Dropdown -->
        <SettingsDropdown @templates="$emit('show-templates')"
          @help="$emit('show-help')" @locale-settings="$emit('show-locale-settings')" />
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
  showResults: {
    type: Boolean,
    default: true
  }
})

defineEmits([
  'toggle-sidebar',
  'show-meta',
  'apply-format',
  'toggle-results',
  'show-templates',
  'show-help',
  'show-language',
  'show-locale-settings',
])
</script>

<style scoped>
.alpha-ribbon {
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%);
}
</style>
