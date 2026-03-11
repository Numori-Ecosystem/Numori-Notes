<template>
  <div>
    <!-- Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          @click="closeModal">
          <Transition enter-active-class="transition ease-out duration-200"
            enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150" leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95">
            <div v-if="isOpen" @click.stop
              class="bg-white dark:bg-gray-925 rounded-lg max-w-md w-full overflow-hidden">
              <!-- Header -->
              <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <Icon name="mdi:translate" class="block w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
                    Select Language
                  </h2>
                </div>
                <button @click="closeModal"
                  class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <Icon name="mdi:close" class="block w-5 h-5" />
                </button>
              </div>

              <!-- Language Options -->
              <div class="p-4 space-y-2">
                <button v-for="locale in availableLocales" :key="locale.code" @click="changeLocale(locale.code)"
                  class="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200" :class="[
                    currentLocale.code === locale.code
                      ? 'bg-primary-50 dark:bg-gray-800 border-2 border-primary-500 dark:border-primary-400 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-925 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'
                  ]">
                  <div class="flex items-center gap-4">
                    <!-- Flag/Icon -->
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold" :class="[
                      currentLocale.code === locale.code
                        ? 'bg-primary-100 dark:bg-gray-850 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-200 dark:bg-gray-850 text-gray-600 dark:text-gray-400-muted'
                    ]">
                      {{ getLanguageEmoji(locale.code) }}
                    </div>

                    <!-- Language Info -->
                    <div class="text-left">
                      <div class="font-semibold text-lg" :class="[
                        currentLocale.code === locale.code
                          ? 'text-primary-700 dark:text-primary-400'
                          : 'text-gray-900 dark:text-gray-400'
                      ]">
                        {{ locale.name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400-muted">
                        {{ locale.code }}
                      </div>
                    </div>
                  </div>

                  <!-- Check Icon -->
                  <div v-if="currentLocale.code === locale.code" class="flex-shrink-0">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-400 flex items-center justify-center">
                      <Icon name="mdi:check" class="w-5 h-5 text-white dark:text-vscode-bg-dark" />
                    </div>
                  </div>
                </button>
              </div>

              <!-- Footer -->
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <p class="text-xs text-center text-gray-500 dark:text-gray-400-muted">
                  Your preference will be saved automatically
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { $getLocale, $getLocales, $switchLocale } = useI18n()

const availableLocales = computed(() => $getLocales())
const currentLocale = computed(() => {
  const currentCode = $getLocale()
  return availableLocales.value.find(l => l.code === currentCode) || availableLocales.value[0]
})

const changeLocale = (code) => {
  $switchLocale(code)
  closeModal()
}

const closeModal = () => {
  emit('close')
}

const getLanguageEmoji = (code) => {
  const emojiMap = {
    'en-GB': '🇬🇧',
    'en-US': '🇺🇸',
    'es-ES': '🇪🇸',
    'fr-FR': '🇫🇷',
    'de-DE': '🇩🇪',
    'it-IT': '🇮🇹',
    'pt-PT': '🇵🇹',
    'pt-BR': '🇧🇷',
    'ja-JP': '🇯🇵',
    'zh-CN': '🇨🇳',
    'ko-KR': '🇰🇷',
    'ru-RU': '🇷🇺',
    'ar-SA': '🇸🇦',
    'hi-IN': '🇮🇳',
  }
  return emojiMap[code] || '🌐'
}

// Close modal on Escape key
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>
