<template>
  <Teleport to="body">
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
        <Transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">

            <!-- Progress dots -->
            <div class="flex justify-center gap-2 pt-5 pb-2">
              <button v-for="i in totalSteps" :key="i"
                @click="step = i"
                class="w-2 h-2 rounded-full transition-all duration-200"
                :class="i === step ? 'bg-primary-500 w-6' : i < step ? 'bg-primary-300 dark:bg-primary-700' : 'bg-gray-300 dark:bg-gray-700'" />
            </div>

            <!-- Step content -->
            <div class="px-6 pb-2 pt-3 min-h-[320px] flex flex-col">

              <!-- Step 1: Welcome -->
              <div v-if="step === 1" class="flex-1 flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                  <Icon name="mdi:calculator-variant-outline" class="w-9 h-9 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to CalcNotes</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
                  A notepad where every line can do math. Write naturally, and results appear instantly.
                </p>
                <div class="mt-5 w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-left text-sm font-mono space-y-1.5">
                  <div class="flex justify-between">
                    <span><span class="calc-variable">price</span> <span class="calc-operator">=</span> <span class="calc-currency">$</span><span class="calc-number">120</span></span>
                    <span class="calc-result">$120</span>
                  </div>
                  <div class="flex justify-between">
                    <span><span class="calc-variable">tax</span> <span class="calc-operator">=</span> <span class="calc-number">8%</span> <span class="calc-conversion">of</span> <span class="calc-variable">price</span></span>
                    <span class="calc-result">$9.60</span>
                  </div>
                  <div class="flex justify-between">
                    <span><span class="calc-variable">total</span> <span class="calc-operator">=</span> <span class="calc-variable">price</span> <span class="calc-operator">+</span> <span class="calc-variable">tax</span></span>
                    <span class="calc-result">$129.60</span>
                  </div>
                </div>
                <p class="mt-3 text-xs text-gray-500 dark:text-gray-500">
                  Supports unit conversions, currencies, dates, percentages, and more.
                </p>
              </div>

              <!-- Step 2: Appearance -->
              <div v-if="step === 2" class="flex-1 flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                  <Icon name="mdi:palette-outline" class="w-9 h-9 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Choose your look</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">Pick a theme that suits you.</p>

                <div class="grid grid-cols-2 gap-3 w-full max-w-xs">
                  <button @click="setTheme('light')"
                    class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150"
                    :class="currentTheme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <Icon name="mdi:weather-sunny" class="w-8 h-8 text-amber-500" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
                  </button>
                  <button @click="setTheme('dark')"
                    class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150"
                    :class="currentTheme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <Icon name="mdi:weather-night" class="w-8 h-8 text-indigo-500" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
                  </button>
                </div>
              </div>

              <!-- Step 3: Region & Language -->
              <div v-if="step === 3" class="flex-1 flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                  <Icon name="mdi:earth" class="w-9 h-9 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Region &amp; Language</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">Sets units, date formats, and number styles.</p>

                <div class="w-full space-y-4 text-left">
                  <!-- Region preset -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Region Preset</label>
                    <div class="grid grid-cols-3 gap-2">
                      <button v-for="(label, key) in presetLabels" :key="key"
                        @click="selectPreset(key)"
                        class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border-2"
                        :class="selectedPreset === key
                          ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                        {{ label }}
                      </button>
                    </div>
                  </div>

                  <!-- Language -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Language</label>
                    <select :value="currentLocaleCode" @change="changeLocale($event.target.value)"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
                        {{ getLanguageEmoji(locale.code) }} {{ locale.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer navigation -->
            <div class="px-6 pb-5 flex items-center" :class="step === 1 ? 'justify-end' : 'justify-between'">
              <button v-if="step > 1" @click="step--"
                class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Back
              </button>
              <div class="flex items-center gap-3">
                <button v-if="step < totalSteps" @click="skip"
                  class="px-4 py-2 text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Skip
                </button>
                <button @click="next"
                  class="px-5 py-2 text-sm font-medium rounded-lg transition-colors bg-primary-600 hover:bg-primary-700 text-white">
                  {{ step === totalSteps ? 'Get Started' : 'Next' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { LOCALE_PRESETS } from '~/composables/useLocalePreferences'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  preferences: { type: Object, required: true },
  applyPreset: { type: Function, required: true },
  savePreferences: { type: Function, required: true },
})

const emit = defineEmits(['complete'])

const step = ref(1)
const totalSteps = 3

// Theme
const colorMode = useColorMode()
const currentTheme = computed(() => colorMode.value)
const setTheme = (theme) => { colorMode.preference = theme }

// Region
const presetLabels = { UK: '🇬🇧 UK', US: '🇺🇸 US', ES: '🇪🇸 Spain', FR: '🇫🇷 France', DE: '🇩🇪 Germany', JP: '🇯🇵 Japan' }
const presetLocaleMap = { UK: 'en-GB', US: 'en-GB', ES: 'es-ES', FR: 'en-GB', DE: 'en-GB', JP: 'en-GB' }
const selectedPreset = ref('UK')

const selectPreset = (key) => {
  selectedPreset.value = key
  props.applyPreset(key)
  const targetLocale = presetLocaleMap[key]
  if (targetLocale && availableLocales.value.some(l => l.code === targetLocale)) {
    $switchLocale(targetLocale)
  }
  props.savePreferences()
}

// Language
const { $getLocale, $getLocales, $switchLocale } = useI18n()
const availableLocales = computed(() => $getLocales())
const currentLocaleCode = computed(() => $getLocale())
const changeLocale = (code) => $switchLocale(code)
const getLanguageEmoji = (code) => {
  const map = { 'en-GB': '🇬🇧', 'en-US': '🇺🇸', 'es-ES': '🇪🇸', 'fr-FR': '🇫🇷', 'de-DE': '🇩🇪', 'ja-JP': '🇯🇵' }
  return map[code] || '🌐'
}

// Detect active preset on mount
onMounted(() => {
  for (const [name, preset] of Object.entries(LOCALE_PRESETS)) {
    const matches = Object.keys(preset).every(key => props.preferences[key] === preset[key])
    if (matches) { selectedPreset.value = name; break }
  }
})

// Navigation
const next = () => {
  if (step.value < totalSteps) {
    step.value++
  } else {
    finish()
  }
}

const skip = () => finish()

const finish = () => {
  step.value = 1
  emit('complete')
}
</script>

<style scoped>
/* CalcNotes syntax colours — light theme */
.calc-variable   { color: #2D2A2E; }
.calc-operator   { color: #C1C0C0; }
.calc-currency   { color: #C4621A; }
.calc-number     { color: #A68A1B; }
.calc-conversion { color: #939293; }
.calc-result     { color: #CC2D56; font-weight: 500; opacity: 0.75; }

/* Dark theme overrides */
:root.dark .calc-variable   { color: #FCFCFA; }
:root.dark .calc-operator   { color: #5B595C; }
:root.dark .calc-currency   { color: #FC9867; }
:root.dark .calc-number     { color: #FFD866; }
:root.dark .calc-conversion { color: #727072; }
:root.dark .calc-result     { color: #FF6188; opacity: 0.7; }
</style>
