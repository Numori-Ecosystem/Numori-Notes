<template>
  <Teleport to="body">
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50" @click="$emit('close')">
        <Transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          <div v-if="isOpen" @click.stop
            class="bg-white dark:bg-gray-925 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">

            <!-- Header -->
            <div class="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">About Numori</h2>
              <button @click="$emit('close')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 space-y-5 text-sm text-gray-700 dark:text-gray-400 break-words">

              <!-- App info -->
              <div class="text-center space-y-1">
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-200">Numori</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">v{{ appVersion }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">Made with ❤️ and code from Manchester, England</p>
                <a href="https://github.com/Erik-Bjerke/Numori" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  <Icon name="mdi:github" class="w-3.5 h-3.5 block" />
                  GitHub
                </a>
              </div>

              <!-- Author -->
              <div class="space-y-1">
                <p class="font-semibold text-gray-900 dark:text-gray-300">Author</p>
                <p>Erik Bjerke — TheProcedural Software Ltd</p>
                <a href="https://erikbjerke.com" target="_blank" rel="noopener noreferrer"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-xs">erikbjerke.com</a>
                <span class="text-xs text-gray-400 dark:text-gray-600 mx-1">·</span>
                <a href="https://theprocedural.com" target="_blank" rel="noopener noreferrer"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-xs">theprocedural.com</a>
                <br>
                <a href="mailto:contact@erikbjerke.com"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-xs">contact@erikbjerke.com</a>
                <span class="text-xs text-gray-400 dark:text-gray-600 mx-1">·</span>
                <a href="mailto:contact@theprocedural.com"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-xs">contact@theprocedural.com</a>
              </div>

              <!-- License -->
              <div class="space-y-1">
                <p class="font-semibold text-gray-900 dark:text-gray-300">License</p>
                <p>GNU Affero General Public License v3.0 (AGPL-3.0)</p>
              </div>

              <!-- Third-party licenses -->
              <div class="space-y-2">
                <p class="font-semibold text-gray-900 dark:text-gray-300">Third-Party Licenses</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">This application uses the following open-source packages:</p>
                <ul class="text-xs space-y-0.5 list-disc list-inside text-gray-600 dark:text-gray-400">
                  <li><a href="https://nuxt.com" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">Nuxt</a></li>
                  <li><a href="https://vuejs.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">Vue</a></li>
                  <li><a href="https://router.vuejs.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">Vue Router</a></li>
                  <li><a href="https://fonts.nuxt.com" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">@nuxt/fonts</a></li>
                  <li><a href="https://nuxt.com/modules/icon" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">@nuxt/icon</a></li>
                  <li><a href="https://color-mode.nuxtjs.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">@nuxtjs/color-mode</a></li>
                  <li><a href="https://tailwindcss.nuxtjs.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">@nuxtjs/tailwindcss</a></li>
                  <li><a href="https://tailwindcss.com/docs/typography-plugin" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">@tailwindcss/typography</a></li>
                  <li><a href="https://vueuse.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">@vueuse/core &amp; @vueuse/nuxt</a></li>
                  <li><a href="https://s00d.github.io/nuxt-i18n-micro" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">nuxt-i18n-micro</a></li>
                  <li><a href="https://nuxt.com/modules/nuxt-codemirror" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">nuxt-codemirror</a></li>
                  <li><a href="https://codemirror.net" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">CodeMirror</a> (commands, language, state, view)</li>
                  <li><a href="https://capacitorjs.com" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">Capacitor</a> (core, app, android, ios, filesystem, share, status-bar)</li>
                  <li><a href="https://dexie.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">Dexie.js</a></li>
                  <li><a href="https://highlightjs.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">highlight.js</a></li>
                  <li><a href="https://github.com/dcodeIO/bcrypt.js" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">bcryptjs</a></li>
                  <li><a href="https://node-postgres.com" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">pg (node-postgres)</a></li>
                  <li><a href="https://vitest.dev" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline">Vitest</a></li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 text-center">
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

const appVersion = __APP_VERSION__
</script>
