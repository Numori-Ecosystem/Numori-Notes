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
            class="bg-white dark:bg-gray-925 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Icon name="mdi:earth" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900 dark:text-gray-400">
                    Locale Settings
                  </h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400-muted">
                    Units, date formats, and number formats
                  </p>
                </div>
              </div>
              <button @click="closeModal"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors">
                <Icon name="mdi:close" class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto p-6 space-y-6">
              <!-- Preset Selector -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Regional Preset
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

              <!-- Granular Settings -->
              <div class="space-y-4">
                <!-- Volume -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Volume</label>
                  <select v-model="preferences.volume" @change="onSettingChange"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="litre">Litres</option>
                    <option value="us_gallon">US Gallons</option>
                    <option value="uk_gallon">UK Gallons (Imperial)</option>
                  </select>
                </div>

                <!-- Fuel Economy -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Fuel Economy</label>
                  <select v-model="preferences.fuelEconomy" @change="onSettingChange"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="mpg">Miles per gallon (US)</option>
                    <option value="mpg_uk">Miles per gallon (UK)</option>
                    <option value="kpl">Km per litre</option>
                    <option value="l/100km">Litres per 100 km</option>
                    <option value="mpl">Miles per litre</option>
                    <option value="kpg">Km per gallon (US)</option>
                  </select>
                </div>

                <!-- Distance -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Distance</label>
                  <select v-model="preferences.distance" @change="onSettingChange"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="km">Kilometres</option>
                    <option value="miles">Miles</option>
                  </select>
                </div>

                <!-- Temperature -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Temperature</label>
                  <select v-model="preferences.temperature" @change="onSettingChange"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="celsius">Celsius (°C)</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                    <option value="kelvin">Kelvin (K)</option>
                  </select>
                </div>

                <!-- Date Format -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Date Format</label>
                  <select v-model="preferences.dateFormat" @change="onSettingChange"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD (2025/12/31)</option>
                    <option value="DD.MM.YYYY">DD.MM.YYYY (31.12.2025)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                  </select>
                </div>

                <!-- Number Format -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Number Format</label>
                  <select v-model="preferences.numberFormat" @change="onSettingChange"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="comma_dot">1,000.00 (US/UK)</option>
                    <option value="dot_comma">1.000,00 (DE/ES)</option>
                    <option value="space_comma">1 000,00 (FR)</option>
                  </select>
                </div>
              </div>
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

const presets = LOCALE_PRESETS

const presetLabels = {
  UK: '🇬🇧 UK',
  US: '🇺🇸 US',
  ES: '🇪🇸 Spain',
  FR: '🇫🇷 France',
  DE: '🇩🇪 Germany',
  JP: '🇯🇵 Japan',
}

const activePreset = computed(() => props.getActivePreset())

const selectPreset = (name) => {
  props.applyPreset(name)
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
