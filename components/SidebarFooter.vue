<template>
  <div class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-800">
    <div class="flex items-center gap-1">
      <button @click="$emit('show-templates')"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
        title="Templates">
        <Icon name="mdi:file-document-outline" class="w-5 h-5 block" />
      </button>
      <button @click="$emit('show-help')"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
        title="Help">
        <Icon name="mdi:help-circle-outline" class="w-5 h-5 block" />
      </button>
      <button @click="$emit('show-locale-settings')"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
        title="Settings">
        <Icon name="mdi:cog-outline" class="w-5 h-5 block" />
      </button>
    </div>
    <div class="flex items-center gap-1">
      <button @click="$emit('show-language')"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors leading-none"
        title="Language">
        <Icon name="mdi:translate" class="w-5 h-5 block" />
      </button>
      <ThemeSwitcher />
    </div>
  </div>
</template>

<script setup>
defineEmits(['show-templates', 'show-help', 'show-locale-settings', 'show-language'])
</script>
