<template>
  <UiModal :show="isOpen" max-width="lg" z="z-[60]" persistent>

            <!-- Progress dots -->
            <div class="pt-5 pb-2">
              <UiStepper v-model="step" :steps="totalSteps" />
            </div>

            <!-- Step content -->
            <div class="px-6 pb-2 pt-3 min-h-[320px] flex flex-col">

              <!-- Step 1: Welcome -->
              <div v-if="step === 1" class="flex-1 flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                  <Icon name="mdi:calculator-variant-outline" class="w-9 h-9 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to Numori</h2>
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
                  <UiButton @click="setTheme('light')"
                    variant="outline" color="gray"
                    class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150"
                    :class="currentTheme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <Icon name="mdi:weather-sunny" class="w-8 h-8 text-amber-500" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
                  </UiButton>
                  <UiButton @click="setTheme('dark')"
                    variant="outline" color="gray"
                    class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150"
                    :class="currentTheme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <Icon name="mdi:weather-night" class="w-8 h-8 text-indigo-500" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
                  </UiButton>
                </div>
              </div>

              <!-- Step 3: Precision -->
              <div v-if="step === 3" class="flex-1 flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                  <Icon name="mdi:decimal" class="w-9 h-9 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Precision</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">How should results be formatted?</p>

                <div class="w-full space-y-4 text-left">
                  <!-- Precision mode -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Precision Mode</label>
                    <div class="grid grid-cols-3 gap-2">
                      <UiButton v-for="(label, key) in precisionModeLabels" :key="key"
                        @click="setPrecisionMode(key)"
                        variant="outline" color="gray"
                        class="border-2 transition-all duration-150"
                        :class="preferences.precisionMode === key
                          ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                        {{ label }}
                      </UiButton>
                    </div>
                  </div>

                  <!-- Decimal places / sig figs slider -->
                  <div v-if="preferences.precisionMode === 'decimals'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Decimal Places: {{ preferences.decimalPlaces }}</label>
                    <UiSlider min="0" max="15" step="1" v-model="preferences.decimalPlaces" @input="onPrecisionChange" />
                    <div class="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>15</span></div>
                  </div>
                  <div v-if="preferences.precisionMode === 'significant'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Significant Figures: {{ preferences.significantFigures }}</label>
                    <UiSlider min="1" max="15" step="1" v-model="preferences.significantFigures" @input="onPrecisionChange" />
                    <div class="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>15</span></div>
                  </div>

                  <!-- Rounding mode -->
                  <div v-if="preferences.precisionMode !== 'auto'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Rounding</label>
                    <div class="grid grid-cols-2 gap-2">
                      <UiButton v-for="(label, key) in roundingModeLabels" :key="key"
                        @click="setRoundingMode(key)"
                        variant="outline" color="gray"
                        class="border-2 transition-all duration-150"
                        :class="preferences.roundingMode === key
                          ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                        {{ label }}
                      </UiButton>
                    </div>
                  </div>

                  <!-- Live preview -->
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm font-mono space-y-1.5">
                    <div class="text-xs font-sans font-medium text-gray-500 dark:text-gray-500 mb-2">Preview</div>
                    <div v-for="sample in precisionSamples" :key="sample.label" class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">{{ sample.label }}</span>
                      <span class="calc-result">{{ sample.formatted }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 4: Region & Language -->
              <div v-if="step === 4" class="flex-1 flex flex-col items-center text-center">
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
                      <UiButton v-for="(label, key) in presetLabels" :key="key"
                        @click="selectPreset(key)"
                        variant="outline" color="gray"
                        class="border-2 transition-all duration-150"
                        :class="selectedPreset === key
                          ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                        {{ label }}
                      </UiButton>
                    </div>
                  </div>

                  <!-- Language -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Language</label>
                    <UiSelect :model-value="currentLocaleCode" searchable
                      @update:model-value="changeLocale($event)"
                      :options="availableLocales.map(l => ({ value: l.code, label: getLanguageEmoji(l.code) + ' ' + l.name }))" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer navigation -->
            <div class="px-6 pb-5 flex items-center" :class="step === 1 ? 'justify-end' : 'justify-between'">
              <UiButton v-if="step > 1" @click="step--"
                variant="ghost" color="gray">
                Back
              </UiButton>
              <div class="flex items-center gap-3">
                <UiButton v-if="step < totalSteps" @click="skip"
                  variant="ghost" color="gray">
                  Skip
                </UiButton>
                <UiButton @click="next"
                  variant="solid" color="primary">
                  {{ step === totalSteps ? 'Get Started' : 'Next' }}
                </UiButton>
              </div>
            </div>
  </UiModal>
</template>

<script setup>
import { LOCALE_PRESETS } from '~/composables/useLocalePreferences'
import { formatDisplay } from '~/composables/useDisplayFormatter'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  preferences: { type: Object, required: true },
  applyPreset: { type: Function, required: true },
  savePreferences: { type: Function, required: true },
})

const emit = defineEmits(['complete'])

const step = ref(1)
const totalSteps = 4

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

// Precision
const precisionModeLabels = { auto: 'Auto', decimals: 'Decimals', significant: 'Sig. Figs' }
const roundingModeLabels = { round: 'Round', truncate: 'Truncate' }

const setPrecisionMode = (mode) => {
  props.preferences.precisionMode = mode
  props.savePreferences()
}

const setRoundingMode = (mode) => {
  props.preferences.roundingMode = mode
  props.savePreferences()
}

const onPrecisionChange = () => {
  props.savePreferences()
}

const SAMPLE_VALUES = [
  { raw: '3.14159265', label: 'pi ≈' },
  { raw: '1234.5678', label: '1234.5678 →' },
  { raw: '0.00456789', label: '0.00456789 →' },
]

const precisionSamples = computed(() => {
  return SAMPLE_VALUES.map(s => ({
    label: s.label,
    formatted: formatDisplay(s.raw, null, props.preferences),
  }))
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
/* Numori syntax colours — light theme */
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
