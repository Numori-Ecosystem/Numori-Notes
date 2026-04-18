<template>
  <UiModal
    :show="isOpen"
    max-width="md"
    padding="p-2 sm:p-4"
    panel-class="max-h-[80vh]"
    @close="$emit('close')"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
    >
      <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
        About Numori
      </h2>
      <UiButton variant="ghost" color="gray" icon-only size="sm" @click="$emit('close')">
        <Icon name="mdi:close" class="block w-5 h-5" />
      </UiButton>
    </div>

    <!-- Body -->
    <div
      class="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 space-y-5 text-sm text-gray-700 dark:text-gray-400 break-words"
    >
      <!-- App info -->
      <div class="text-center space-y-2">
        <p class="text-lg font-semibold text-gray-900 dark:text-gray-200">Numori</p>
        <p class="text-xs text-gray-500 dark:text-gray-500">v{{ appVersion }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-500">
          Made with ❤️ and code from Manchester, England
        </p>
        <a
          href="https://github.com/Erik-Bjerke/Numori"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          <Icon name="mdi:github" class="w-3.5 h-3.5 block" />
          GitHub
        </a>
        <div class="pt-1">
          <UiButton
            variant="outline"
            color="gray"
            size="sm"
            :disabled="checking"
            :loading="checking"
            @click="handleCheckUpdate"
          >
            <Icon v-if="!checking" name="mdi:update" class="w-3.5 h-3.5 block" />
            {{ checking ? 'Checking...' : 'Check for updates' }}
          </UiButton>
          <p v-if="checkResult" class="mt-1.5 text-xs" :class="checkResultClass">
            {{ checkResult }}
          </p>
        </div>
      </div>

      <!-- Author -->
      <div class="space-y-1">
        <p class="font-semibold text-gray-900 dark:text-gray-300">Author</p>
        <p>Erik Bjerke — TheProcedural Software Ltd</p>
        <a
          href="https://erikbjerke.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-600 dark:text-primary-400 hover:underline text-xs"
          >erikbjerke.com</a
        >
        <span class="text-xs text-gray-400 dark:text-gray-600 mx-1">·</span>
        <a
          href="https://theprocedural.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-600 dark:text-primary-400 hover:underline text-xs"
          >theprocedural.com</a
        >
        <br >
        <a
          href="mailto:contact@erikbjerke.com"
          class="text-primary-600 dark:text-primary-400 hover:underline text-xs"
          >contact@erikbjerke.com</a
        >
        <span class="text-xs text-gray-400 dark:text-gray-600 mx-1">·</span>
        <a
          href="mailto:contact@theprocedural.com"
          class="text-primary-600 dark:text-primary-400 hover:underline text-xs"
          >contact@theprocedural.com</a
        >
      </div>

      <!-- License -->
      <div class="space-y-1">
        <p class="font-semibold text-gray-900 dark:text-gray-300">License</p>
        <p>GNU Affero General Public License v3.0 (AGPL-3.0)</p>
      </div>

      <!-- Third-party licenses -->
      <div class="space-y-2">
        <p class="font-semibold text-gray-900 dark:text-gray-300">Third-Party Licenses</p>
        <p class="text-xs text-gray-500 dark:text-gray-500">
          This application uses the following open-source packages:
        </p>
        <ul class="text-xs space-y-0.5 list-disc list-inside text-gray-600 dark:text-gray-400">
          <li>
            <a
              href="https://nuxt.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >Nuxt</a
            >
          </li>
          <li>
            <a
              href="https://vuejs.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >Vue</a
            >
          </li>
          <li>
            <a
              href="https://router.vuejs.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >Vue Router</a
            >
          </li>
          <li>
            <a
              href="https://fonts.nuxt.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >@nuxt/fonts</a
            >
          </li>
          <li>
            <a
              href="https://nuxt.com/modules/icon"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >@nuxt/icon</a
            >
          </li>
          <li>
            <a
              href="https://color-mode.nuxtjs.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >@nuxtjs/color-mode</a
            >
          </li>
          <li>
            <a
              href="https://tailwindcss.nuxtjs.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >@nuxtjs/tailwindcss</a
            >
          </li>
          <li>
            <a
              href="https://tailwindcss.com/docs/typography-plugin"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >@tailwindcss/typography</a
            >
          </li>
          <li>
            <a
              href="https://vueuse.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >@vueuse/core &amp; @vueuse/nuxt</a
            >
          </li>
          <li>
            <a
              href="https://s00d.github.io/nuxt-i18n-micro"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >nuxt-i18n-micro</a
            >
          </li>
          <li>
            <a
              href="https://nuxt.com/modules/nuxt-codemirror"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >nuxt-codemirror</a
            >
          </li>
          <li>
            <a
              href="https://codemirror.net"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >CodeMirror</a
            >
            (commands, language, state, view)
          </li>
          <li>
            <a
              href="https://capacitorjs.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >Capacitor</a
            >
            (core, app, android, ios, filesystem, share, status-bar)
          </li>
          <li>
            <a
              href="https://dexie.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >Dexie.js</a
            >
          </li>
          <li>
            <a
              href="https://highlightjs.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >highlight.js</a
            >
          </li>
          <li>
            <a
              href="https://github.com/dcodeIO/bcrypt.js"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >bcryptjs</a
            >
          </li>
          <li>
            <a
              href="https://node-postgres.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >pg (node-postgres)</a
            >
          </li>
          <li>
            <a
              href="https://vitest.dev"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
              >Vitest</a
            >
          </li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 text-center"
    >
      <UiButton variant="solid" color="gray" size="sm" @click="$emit('close')"> Close </UiButton>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  checkForUpdate: { type: Function, default: null },
})

defineEmits(['close'])

const appVersion = __APP_VERSION__
const checking = ref(false)
const checkResult = ref('')

const checkResultClass = computed(() => {
  if (checkResult.value.startsWith('You')) return 'text-green-600 dark:text-green-400'
  if (checkResult.value.startsWith('Could')) return 'text-red-500 dark:text-red-400'
  return 'text-primary-600 dark:text-primary-400'
})

const handleCheckUpdate = async () => {
  if (!props.checkForUpdate || checking.value) return
  checking.value = true
  checkResult.value = ''
  const result = await props.checkForUpdate(true)
  checking.value = false
  if (result === 'available') checkResult.value = 'A new version is available.'
  else if (result === 'up-to-date') checkResult.value = "You're up to date."
  else checkResult.value = 'Could not check for updates.'
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) checkResult.value = ''
  },
)
</script>
