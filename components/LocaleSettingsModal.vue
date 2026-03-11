<template>
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
            class="bg-white dark:bg-gray-925 rounded-lg max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
              <div class="flex items-center gap-2">
                <Icon name="mdi:cog-outline" class="block w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">Settings</h2>
              </div>
              <button @click="closeModal"
                class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-200 dark:border-gray-800 px-4">
              <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                class="px-4 py-3 text-sm font-medium transition-colors relative"
                :class="activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400-muted hover:text-gray-700 dark:hover:text-gray-300'">
                {{ tab.label }}
                <div v-if="activeTab === tab.id"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full" />
              </button>
            </div>

            <!-- Tab Content -->
            <div class="overflow-y-auto p-6 space-y-6">

              <!-- ===== Locales Tab ===== -->
              <template v-if="activeTab === 'locales'">
                <!-- Preset Selector -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    Preset
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <button v-for="(preset, name) in presets" :key="name"
                      @click="selectPreset(name)"
                      class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border-2"
                      :class="activePreset === name
                        ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                        : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                      {{ presetLabels[name] || name }}
                    </button>
                  </div>
                  <p v-if="activePreset === 'Custom'" class="mt-1 text-xs text-gray-500 dark:text-gray-400-muted">
                    Custom settings — doesn't match any preset
                  </p>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-800"></div>

                <!-- Language -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Language</label>
                  <select :value="currentLocaleCode" @change="changeLocale($event.target.value)" :class="selectClass">
                    <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
                      {{ getLanguageEmoji(locale.code) }} {{ locale.name }}
                    </option>
                  </select>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-800"></div>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Volume</label>
                    <select v-model="preferences.volume" @change="onSettingChange" :class="selectClass">
                      <option value="litre">Litres</option>
                      <option value="us_gallon">US Gallons</option>
                      <option value="uk_gallon">UK Gallons (Imperial)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Fuel Economy</label>
                    <select v-model="preferences.fuelEconomy" @change="onSettingChange" :class="selectClass">
                      <option value="mpg">Miles per gallon (US)</option>
                      <option value="mpg_uk">Miles per gallon (UK)</option>
                      <option value="kpl">Km per litre</option>
                      <option value="l/100km">Litres per 100 km</option>
                      <option value="mpl">Miles per litre</option>
                      <option value="kpg">Km per gallon (US)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Distance</label>
                    <select v-model="preferences.distance" @change="onSettingChange" :class="selectClass">
                      <option value="km">Kilometres</option>
                      <option value="miles">Miles</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Temperature</label>
                    <select v-model="preferences.temperature" @change="onSettingChange" :class="selectClass">
                      <option value="celsius">Celsius (°C)</option>
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                      <option value="kelvin">Kelvin (K)</option>
                    </select>
                  </div>

                  <div class="border-t border-gray-200 dark:border-gray-800"></div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Date Format</label>
                    <select v-model="preferences.dateFormat" @change="onSettingChange" :class="selectClass">
                      <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                      <option value="YYYY/MM/DD">YYYY/MM/DD (2025/12/31)</option>
                      <option value="DD.MM.YYYY">DD.MM.YYYY (31.12.2025)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Time Format</label>
                    <select v-model="preferences.timeFormat" @change="onSettingChange" :class="selectClass">
                      <option value="12h">12-hour (3:30 PM)</option>
                      <option value="24h">24-hour (15:30)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Number Format</label>
                    <select v-model="preferences.numberFormat" @change="onSettingChange" :class="selectClass">
                      <option value="comma_dot">1,000.00 (US/UK)</option>
                      <option value="dot_comma">1.000,00 (DE/ES)</option>
                      <option value="space_comma">1 000,00 (FR)</option>
                    </select>
                  </div>
                </div>
              </template>

              <!-- ===== Formatting Tab ===== -->
              <template v-if="activeTab === 'formatting'">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Precision Mode</label>
                    <select v-model="preferences.precisionMode" @change="onSettingChange" :class="selectClass">
                      <option value="auto">Auto (smart formatting)</option>
                      <option value="decimals">Fixed decimal places</option>
                      <option value="significant">Significant figures</option>
                    </select>
                  </div>
                  <div v-if="preferences.precisionMode === 'decimals'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Decimal Places: {{ preferences.decimalPlaces }}
                    </label>
                    <input type="range" min="0" max="15" step="1" v-model.number="preferences.decimalPlaces"
                      @input="onSettingChange" class="w-full accent-primary-500" />
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>15</span>
                    </div>
                  </div>
                  <div v-if="preferences.precisionMode === 'significant'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Significant Figures: {{ preferences.significantFigures }}
                    </label>
                    <input type="range" min="1" max="15" step="1" v-model.number="preferences.significantFigures"
                      @input="onSettingChange" class="w-full accent-primary-500" />
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>15</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="p-4 bg-gray-50 dark:bg-gray-925 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <button @click="resetDefaults"
                class="text-sm text-gray-500 dark:text-gray-400-muted hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Reset to defaults
              </button>
              <p class="text-xs text-gray-500 dark:text-gray-400-muted">
                Saved automatically
              </p>
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
  setPreference: { type: Function, required: true },
  getActivePreset: { type: Function, required: true },
  save: { type: Function, required: true },
  reset: { type: Function, required: true },
})

const emit = defineEmits(['close'])

const tabs = [
  { id: 'locales', label: 'Locales' },
  { id: 'formatting', label: 'Formatting' },
]
const activeTab = ref('locales')

const selectClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'

const presets = LOCALE_PRESETS

const presetLabels = {
  UK: '🇬🇧 UK',
  US: '🇺🇸 US',
  ES: '🇪🇸 Spain',
  FR: '🇫🇷 France',
  DE: '🇩🇪 Germany',
  JP: '🇯🇵 Japan',
}

const presetLocaleMap = {
  UK: 'en-GB',
  US: 'en-GB',  // no en-US locale available, fall back to en-GB
  ES: 'es-ES',
  FR: 'en-GB',  // no fr-FR locale yet
  DE: 'en-GB',  // no de-DE locale yet
  JP: 'en-GB',  // no ja-JP locale yet
}

const activePreset = computed(() => props.getActivePreset())

// Language
const { $getLocale, $getLocales, $switchLocale } = useI18n()
const availableLocales = computed(() => $getLocales())
const currentLocaleCode = computed(() => $getLocale())

const changeLocale = (code) => {
  $switchLocale(code)
}

const getLanguageEmoji = (code) => {
  const map = { 'en-GB': '🇬🇧', 'en-US': '🇺🇸', 'es-ES': '🇪🇸', 'fr-FR': '🇫🇷', 'de-DE': '🇩🇪', 'ja-JP': '🇯🇵', 'it-IT': '🇮🇹', 'pt-PT': '🇵🇹', 'pt-BR': '🇧🇷', 'zh-CN': '🇨🇳', 'ko-KR': '🇰🇷', 'ru-RU': '🇷🇺' }
  return map[code] || '🌐'
}

const selectPreset = (name) => {
  props.applyPreset(name)
  // Switch language if a matching locale is available
  const targetLocale = presetLocaleMap[name]
  if (targetLocale && availableLocales.value.some(l => l.code === targetLocale)) {
    $switchLocale(targetLocale)
  }
  props.save()
}

const onSettingChange = () => {
  props.save()
}

const resetDefaults = () => {
  props.reset()
}

const closeModal = () => {
  emit('close')
}

onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) closeModal()
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})
</script>
