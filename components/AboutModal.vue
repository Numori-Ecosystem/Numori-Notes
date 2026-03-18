<template>
  <Teleport to="body">
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" @click="$emit('close')">
        <Transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          <div v-if="isOpen" @click.stop
            class="bg-white dark:bg-gray-925 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">About CalcNotes</h2>
              <button @click="$emit('close')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm text-gray-700 dark:text-gray-400">

              <!-- App info -->
              <div class="text-center space-y-1">
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-200">CalcNotes</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">Made with ❤️ and code from Manchester, England</p>
                <a href="https://github.com/Erik-Bjerke/Calc-Notes" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  <Icon name="mdi:github" class="w-3.5 h-3.5 block" />
                  GitHub
                </a>
              </div>

              <!-- Author -->
              <div class="space-y-1">
                <p class="font-semibold text-gray-900 dark:text-gray-300">Author</p>
                <p>Erik Bjerke — TheProcedural Software Ltd</p>
                <a href="mailto:contact@erikbjerke.com"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-xs">contact@erikbjerke.com</a>
                <span class="text-xs text-gray-400 dark:text-gray-600 mx-1">·</span>
                <a href="mailto:contact@theprocedural.com"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-xs">contact@theprocedural.com</a>
              </div>

              <!-- License -->
              <div class="space-y-1">
                <p class="font-semibold text-gray-900 dark:text-gray-300">License</p>
                <p>GNU General Public License v3.0 (GPL-3.0)</p>
              </div>

              <!-- Third-party licenses -->
              <div class="space-y-2">
                <p class="font-semibold text-gray-900 dark:text-gray-300">Third-Party Licenses</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">This application uses the following open-source packages, all licensed under the MIT License:</p>
                <ul class="text-xs space-y-0.5 list-disc list-inside text-gray-600 dark:text-gray-400">
                  <li>Nuxt</li>
                  <li>Vue</li>
                  <li>Vue Router</li>
                  <li>@nuxt/fonts</li>
                  <li>@nuxt/icon</li>
                  <li>@nuxtjs/color-mode</li>
                  <li>@nuxtjs/tailwindcss</li>
                  <li>@tailwindcss/typography</li>
                  <li>nuxt-i18n-micro</li>
                  <li>nuxt-monaco-editor</li>
                  <li>Vitest</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 text-center">
              <button @click="$emit('close')"
                class="px-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])
</script>
