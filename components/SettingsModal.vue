<template>
  <UiModal :show="isOpen" max-width="5xl" @close="closeModal" padding="md:p-4" panel-class="h-screen md:h-[90vh] safe-area-modal rounded-none md:rounded-lg">

            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div class="flex items-center gap-2">
                <UiButton variant="ghost" color="gray" icon-only @click="showIndex = !showIndex" :title="showIndex ? 'Hide index' : 'Show index'">
                  <Icon name="mdi:table-of-contents" class="block w-5 h-5" />
                </UiButton>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">Settings</h2>
              </div>
              <div class="flex items-center gap-2">
                <div class="relative">
                  <Icon name="mdi:magnify" class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <UiInput v-model="searchQuery" type="text" placeholder="Search settings..." :validate="false"
                    @keydown.escape="searchQuery = ''" />
                  <UiButton v-if="searchQuery" variant="ghost" color="gray" icon-only size="xs" @click="searchQuery = ''" class="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <Icon name="mdi:close" class="block w-4 h-4" />
                  </UiButton>
                </div>
                <UiButton variant="ghost" color="gray" icon-only @click="closeModal">
                  <Icon name="mdi:close" class="block w-5 h-5" />
                </UiButton>
              </div>
            </div>

            <!-- Body -->
            <div class="flex flex-1 overflow-hidden relative">
              <div v-if="showIndex" class="fixed inset-0 bg-black bg-opacity-25 z-10 md:hidden" @click="showIndex = false"></div>
              <Transition enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="max-md:-translate-x-full max-md:opacity-0 md:w-0 md:opacity-0"
                enter-to-class="max-md:translate-x-0 max-md:opacity-100 md:w-56 md:opacity-100"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="max-md:translate-x-0 max-md:opacity-100 md:w-56 md:opacity-100"
                leave-to-class="max-md:-translate-x-full max-md:opacity-0 md:w-0 md:opacity-0">
                <nav v-if="showIndex" class="absolute md:relative z-20 w-64 md:w-56 flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
                  <ul class="py-3 px-3 space-y-0.5">
                    <li v-for="section in filteredSections" :key="section.id">
                      <UiButton @click="scrollTo(section.id)" variant="ghost" color="gray" block
                        class="justify-start text-left text-sm"
                        :class="activeSection === section.id ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'">
                        {{ section.label }}
                      </UiButton>
                    </li>
                  </ul>
                </nav>
              </Transition>

              <!-- Content -->
              <div ref="contentRef" class="flex-1 overflow-y-auto p-6 scroll-smooth" @scroll="onScroll">
                <div class="max-w-3xl mx-auto space-y-10" :style="{ paddingBottom: scrollPadding + 'px' }">

                  <!-- No results -->
                  <div v-if="searchQuery && filteredSectionIds.size === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">
                    <Icon name="mdi:magnify" class="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p class="text-sm">No results for "{{ searchQuery }}"</p>
                  </div>

                  <!-- ===== Locales ===== -->
                  <section v-show="isSectionVisible('locales')" id="settings-locales" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:earth" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">Locales</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Region, language, and format preferences</p>
                    <div class="space-y-5 pl-1">
                      <div>
                        <label :class="labelClass">Preset</label>
                        <div class="grid grid-cols-3 gap-2">
                          <UiButton v-for="(_preset, name) in presets" :key="name" @click="selectPreset(name)"
                            variant="ghost" color="gray"
                            class="rounded-lg text-sm font-medium border-2"
                            :class="activePreset === name
                              ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                              : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                            {{ presetLabels[name] || name }}
                          </UiButton>
                        </div>
                        <p v-if="activePreset === 'Custom'" class="mt-1 text-xs text-gray-500 dark:text-gray-400-muted">Custom settings — doesn't match any preset</p>
                      </div>
                      <!-- Language -->
                      <UiFormField label="Language">
                        <UiSelect :model-value="currentLocaleCode" searchable
                          @update:model-value="changeLocale($event)"
                          :options="availableLocales.map(l => ({ value: l.code, label: getLanguageEmoji(l.code) + ' ' + l.name }))" />
                      </UiFormField>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Volume">
                          <UiSelect :model-value="preferences.volume"
                            @update:model-value="preferences.volume = $event; onSettingChange()"
                            :options="[
                              { value: 'litre', label: 'Litres' },
                              { value: 'us_gallon', label: 'US Gallons' },
                              { value: 'uk_gallon', label: 'UK Gallons (Imperial)' },
                            ]" />
                        </UiFormField>
                        <UiFormField label="Fuel Economy">
                          <UiSelect :model-value="preferences.fuelEconomy"
                            @update:model-value="preferences.fuelEconomy = $event; onSettingChange()"
                            :options="[
                              { value: 'mpg', label: 'Miles per gallon (US)' },
                              { value: 'mpg_uk', label: 'Miles per gallon (UK)' },
                              { value: 'kpl', label: 'Km per litre' },
                              { value: 'l/100km', label: 'Litres per 100 km' },
                              { value: 'mpl', label: 'Miles per litre' },
                              { value: 'kpg', label: 'Km per gallon (US)' },
                            ]" />
                        </UiFormField>
                        <UiFormField label="Distance">
                          <UiSelect :model-value="preferences.distance"
                            @update:model-value="preferences.distance = $event; onSettingChange()"
                            :options="[
                              { value: 'km', label: 'Kilometres' },
                              { value: 'miles', label: 'Miles' },
                            ]" />
                        </UiFormField>
                        <UiFormField label="Temperature">
                          <UiSelect :model-value="preferences.temperature"
                            @update:model-value="preferences.temperature = $event; onSettingChange()"
                            :options="[
                              { value: 'celsius', label: 'Celsius (°C)' },
                              { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
                              { value: 'kelvin', label: 'Kelvin (K)' },
                            ]" />
                        </UiFormField>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Date Format">
                          <UiSelect :model-value="preferences.dateFormat"
                            @update:model-value="preferences.dateFormat = $event; onSettingChange()"
                            :options="[
                              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
                              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
                              { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2025/12/31)' },
                              { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2025)' },
                              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
                            ]" />
                        </UiFormField>
                        <UiFormField label="Time Format">
                          <UiSelect :model-value="preferences.timeFormat"
                            @update:model-value="preferences.timeFormat = $event; onSettingChange()"
                            :options="[
                              { value: '12h', label: '12-hour (3:30 PM)' },
                              { value: '24h', label: '24-hour (15:30)' },
                            ]" />
                        </UiFormField>
                        <UiFormField label="Number Format">
                          <UiSelect :model-value="preferences.numberFormat"
                            @update:model-value="preferences.numberFormat = $event; onSettingChange()"
                            :options="[
                              { value: 'comma_dot', label: '1,000.00 (US/UK)' },
                              { value: 'dot_comma', label: '1.000,00 (DE/ES)' },
                              { value: 'space_comma', label: '1 000,00 (FR)' },
                            ]" />
                        </UiFormField>
                      </div>
                    </div>
                  </section>

                  <!-- ===== Editor — Typography ===== -->
                  <section v-show="isSectionVisible('typography')" id="settings-typography" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:format-font" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">Typography</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Font, size, and text rendering</p>
                    <div class="space-y-5 pl-1">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Font Family" hint="Custom fonts must be installed on your system">
                          <UiSelect :model-value="preferences.editorFontFamily"
                            @update:model-value="preferences.editorFontFamily = $event; onSettingChange()"
                            :options="[
                              { value: 'system', label: 'System Default' },
                              { value: 'fira-code', label: 'Fira Code' },
                              { value: 'jetbrains-mono', label: 'JetBrains Mono' },
                              { value: 'source-code-pro', label: 'Source Code Pro' },
                              { value: 'cascadia-code', label: 'Cascadia Code' },
                              { value: 'ibm-plex-mono', label: 'IBM Plex Mono' },
                            ]" />
                        </UiFormField>
                        <UiFormField :label="`Font Size: ${preferences.editorFontSize}px`">
                          <UiSlider min="10" max="28" step="1" v-model="preferences.editorFontSize" @input="onSettingChange" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>10px</span><span>28px</span></div>
                        </UiFormField>
                        <UiFormField :label="`Line Height: ${preferences.editorLineHeight}px`">
                          <UiSlider min="14" max="36" step="1" v-model="preferences.editorLineHeight" @input="onSettingChange" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>14px</span><span>36px</span></div>
                        </UiFormField>
                      </div>
                      <div class="flex items-center justify-between">
                        <div>
                          <label :class="labelInlineClass">Font Ligatures</label>
                          <p :class="hintClass">Enable ligatures for supported fonts (e.g. Fira Code)</p>
                        </div>
                        <UiToggle v-model="preferences.editorLigatures" @update:model-value="onSettingChange()" />
                      </div>
                    </div>
                  </section>

                  <!-- ===== Editor — Layout ===== -->
                  <section v-show="isSectionVisible('layout')" id="settings-layout" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:page-layout-body" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">Layout</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Editor chrome, gutters, and visual aids</p>
                    <div class="space-y-5 pl-1">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Line Numbers">
                          <UiSelect :model-value="preferences.editorLineNumbers"
                            @update:model-value="preferences.editorLineNumbers = $event; onSettingChange()"
                            :options="[
                              { value: 'on', label: 'Absolute' },
                              { value: 'relative', label: 'Relative' },
                              { value: 'interval', label: 'Interval (every 10)' },
                              { value: 'off', label: 'Off' },
                            ]" />
                        </UiFormField>
                        <UiFormField label="Line Highlight">
                          <UiSelect :model-value="preferences.editorRenderLineHighlight"
                            @update:model-value="preferences.editorRenderLineHighlight = $event; onSettingChange()"
                            :options="[
                              { value: 'none', label: 'None' },
                              { value: 'line', label: 'Line' },
                              { value: 'all', label: 'Gutter + Line' },
                            ]" />
                        </UiFormField>
                      </div>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Word Wrap</label>
                            <p :class="hintClass">Wrap long lines to fit the editor width</p>
                          </div>
                          <UiToggle v-model="preferences.editorWordWrap" @update:model-value="onSettingChange()" />
                        </div>
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Code Folding</label>
                            <p :class="hintClass">Allow collapsing code regions</p>
                          </div>
                          <UiToggle v-model="preferences.editorFolding" @update:model-value="onSettingChange()" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ===== Editor — Cursor ===== -->
                  <section v-show="isSectionVisible('cursor')" id="settings-cursor" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:cursor-text" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">Cursor &amp; Scrolling</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Cursor appearance and scroll behaviour</p>
                    <div class="space-y-5 pl-1">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Cursor Style">
                          <UiSelect :model-value="preferences.editorCursorStyle"
                            @update:model-value="preferences.editorCursorStyle = $event; onSettingChange()"
                            :options="[
                              { value: 'line', label: 'Line' },
                              { value: 'line-thin', label: 'Line (thin)' },
                            ]" />
                        </UiFormField>
                      </div>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Scroll Past End</label>
                            <p :class="hintClass">Allow scrolling beyond the last line of the document</p>
                          </div>
                          <UiToggle v-model="preferences.editorScrollPastEnd" @update:model-value="onSettingChange()" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ===== Editor — Behaviour ===== -->
                  <section v-show="isSectionVisible('behaviour')" id="settings-behaviour" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:cog-outline" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">Behaviour</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Auto-close, indentation, and bracket matching</p>
                    <div class="space-y-5 pl-1">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Auto-close Brackets">
                          <UiSelect :model-value="preferences.editorAutoClosingBrackets"
                            @update:model-value="preferences.editorAutoClosingBrackets = $event; onSettingChange()"
                            :options="[
                              { value: 'always', label: 'Always' },
                              { value: 'never', label: 'Never' },
                            ]" />
                        </UiFormField>
                        <UiFormField :label="`Tab Size: ${preferences.editorTabSize} spaces`">
                          <UiSlider min="1" max="8" step="1" v-model="preferences.editorTabSize" @input="onSettingChange" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>8</span></div>
                        </UiFormField>
                      </div>
                    </div>
                  </section>

                  <!-- ===== Results & Display ===== -->
                  <section v-show="isSectionVisible('results')" id="settings-results" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:calculator-variant-outline" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">Results &amp; Display</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Precision, formatting, and inline result behaviour</p>
                    <div class="space-y-5 pl-1">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UiFormField label="Precision Mode">
                          <UiSelect :model-value="preferences.precisionMode"
                            @update:model-value="preferences.precisionMode = $event; onSettingChange()"
                            :options="[
                              { value: 'auto', label: 'Auto (smart formatting)' },
                              { value: 'decimals', label: 'Fixed decimal places' },
                              { value: 'significant', label: 'Significant figures' },
                            ]" />
                        </UiFormField>
                        <UiFormField v-if="preferences.precisionMode !== 'auto'" label="Rounding Mode">
                          <UiSelect :model-value="preferences.roundingMode"
                            @update:model-value="preferences.roundingMode = $event; onSettingChange()"
                            :options="[
                              { value: 'round', label: 'Round' },
                              { value: 'truncate', label: 'Truncate' },
                            ]" />
                        </UiFormField>
                        <UiFormField v-if="preferences.precisionMode === 'decimals'" :label="`Decimal Places: ${preferences.decimalPlaces}`">
                          <UiSlider min="0" max="15" step="1" v-model="preferences.decimalPlaces" @input="onSettingChange" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>15</span></div>
                        </UiFormField>
                        <UiFormField v-if="preferences.precisionMode === 'significant'" :label="`Significant Figures: ${preferences.significantFigures}`">
                          <UiSlider min="1" max="15" step="1" v-model="preferences.significantFigures" @input="onSettingChange" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>15</span></div>
                        </UiFormField>
                      </div>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Auto-copy Results</label>
                            <p :class="hintClass">Copy result to clipboard when clicked</p>
                          </div>
                          <UiToggle v-model="preferences.autoCopyResult" @update:model-value="onSettingChange()" />
                        </div>
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Show Results in Code Blocks</label>
                            <p :class="hintClass">Evaluate and display results for lines inside fenced code blocks</p>
                          </div>
                          <UiToggle v-model="preferences.showResultsInCodeBlocks" @update:model-value="onSettingChange()" />
                        </div>
                        <UiFormField v-if="preferences.autoCopyResult" label="Copy Animation" hint="Animation style for the &quot;Copied&quot; feedback toast">
                          <UiSelect :model-value="preferences.copyAnimationStyle"
                            @update:model-value="preferences.copyAnimationStyle = $event; onSettingChange()"
                            :options="[
                              { value: 'float-up', label: 'Float up' },
                              { value: 'fade', label: 'Fade in/out' },
                              { value: 'scale-pop', label: 'Scale pop' },
                              { value: 'slide-right', label: 'Slide from left' },
                              { value: 'bounce', label: 'Bounce' },
                              { value: 'glow', label: 'Glow pulse' },
                              { value: 'none', label: 'None' },
                            ]" />
                        </UiFormField>
                      </div>
                    </div>
                  </section>

                  <!-- ===== General ===== -->
                  <section v-show="isSectionVisible('general')" id="settings-general" :class="sectionClass">
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="mdi:tune-variant" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-200">General</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Miscellaneous application settings</p>
                    <div class="space-y-4 pl-1">
                      <div class="flex items-center justify-between">
                        <div>
                          <label :class="labelInlineClass">Welcome Wizard</label>
                          <p :class="hintClass">Show the first-time setup wizard again</p>
                        </div>
                        <UiButton @click="emit('relaunch-wizard')" variant="outline" color="gray" size="sm">
                          Relaunch
                        </UiButton>
                      </div>
                      <UiFormField label="Update check interval" hint="How often to check for new versions in the background">
                        <UiSelect :model-value="preferences.updateCheckInterval"
                          @update:model-value="preferences.updateCheckInterval = $event; onSettingChange()"
                          :options="[
                            { value: 5, label: 'Every 5 minutes' },
                            { value: 15, label: 'Every 15 minutes' },
                            { value: 30, label: 'Every 30 minutes' },
                            { value: 60, label: 'Every hour' },
                            { value: 360, label: 'Every 6 hours' },
                            { value: 0, label: 'Manual only' },
                          ]" />
                      </UiFormField>
                    </div>
                  </section>

                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-925 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <UiButton @click="resetAll" variant="text" color="gray" size="sm">
                Reset to defaults
              </UiButton>
              <p class="text-xs text-gray-500 dark:text-gray-400-muted">Saved automatically</p>
            </div>
  </UiModal>
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

const emit = defineEmits(['close', 'relaunch-wizard'])

const showIndex = ref(true)
const activeSection = ref('locales')
const contentRef = ref(null)
const searchQuery = ref('')
const scrollPadding = ref(0)

const updateScrollPadding = () => {
  const container = contentRef.value
  if (!container) return
  const allSections = container.querySelectorAll('section[id^="settings-"]')
  const last = allSections[allSections.length - 1]
  if (!last) return
  scrollPadding.value = Math.max(0, container.clientHeight - last.offsetHeight - 80)
}

const sectionClass = 'pb-8 border-b border-gray-200 dark:border-gray-800 last:border-b-0'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1'
const labelInlineClass = 'block text-sm font-medium text-gray-700 dark:text-gray-400'
const hintClass = 'text-xs text-gray-500 dark:text-gray-500 mt-0.5'

const sections = [
  { id: 'locales', label: 'Locales', keywords: 'locale language preset volume fuel economy distance temperature date time number format region' },
  { id: 'typography', label: 'Typography', keywords: 'font family size line height ligatures typography text' },
  { id: 'layout', label: 'Layout', keywords: 'layout line numbers word wrap folding highlight' },
  { id: 'cursor', label: 'Cursor & Scrolling', keywords: 'cursor style scroll past end' },
  { id: 'behaviour', label: 'Behaviour', keywords: 'behaviour auto close brackets tab size indentation' },
  { id: 'results', label: 'Results & Display', keywords: 'results display precision decimal significant copy animation code blocks' },
  { id: 'general', label: 'General', keywords: 'general welcome wizard relaunch setup update check interval version' },
]

const presets = LOCALE_PRESETS
const presetLabels = { UK: '🇬🇧 UK', US: '🇺🇸 US', ES: '🇪🇸 Spain', FR: '🇫🇷 France', DE: '🇩🇪 Germany', JP: '🇯🇵 Japan' }
const presetLocaleMap = { UK: 'en-GB', US: 'en-GB', ES: 'es-ES', FR: 'en-GB', DE: 'en-GB', JP: 'en-GB' }
const activePreset = computed(() => props.getActivePreset())

// Search & filtering
const filteredSectionIds = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return new Set(sections.map(s => s.id))
  return new Set(sections.filter(s => s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q)).map(s => s.id))
})
const filteredSections = computed(() => sections.filter(s => filteredSectionIds.value.has(s.id)))
const isSectionVisible = (id) => filteredSectionIds.value.has(id)

watch(searchQuery, () => {
  if (contentRef.value) contentRef.value.scrollTop = 0
  nextTick(() => updateScrollPadding())
})

watch(() => props.isOpen, (open) => {
  if (open) nextTick(() => updateScrollPadding())
})

const scrollTo = (id) => {
  const el = contentRef.value?.querySelector(`#settings-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (window.innerWidth < 768) showIndex.value = false
}

const onScroll = () => {
  if (!contentRef.value) return
  const scrollTop = contentRef.value.scrollTop
  let current = sections[0].id
  for (const section of sections) {
    const el = contentRef.value.querySelector(`#settings-${section.id}`)
    if (el && el.offsetTop - 80 <= scrollTop) current = section.id
  }
  activeSection.value = current
}

// Language
const { $getLocale, $getLocales, $switchLocale } = useI18n()
const availableLocales = computed(() => $getLocales())
const currentLocaleCode = computed(() => $getLocale())
const changeLocale = (code) => $switchLocale(code)
const getLanguageEmoji = (code) => {
  const map = { 'en-GB': '🇬🇧', 'en-US': '🇺🇸', 'es-ES': '🇪🇸', 'fr-FR': '🇫🇷', 'de-DE': '🇩🇪', 'ja-JP': '🇯🇵', 'it-IT': '🇮🇹', 'pt-PT': '🇵🇹', 'pt-BR': '🇧🇷', 'zh-CN': '🇨🇳', 'ko-KR': '🇰🇷', 'ru-RU': '🇷🇺' }
  return map[code] || '🌐'
}

const selectPreset = (name) => {
  props.applyPreset(name)
  const targetLocale = presetLocaleMap[name]
  if (targetLocale && availableLocales.value.some(l => l.code === targetLocale)) $switchLocale(targetLocale)
  props.save()
}

const onSettingChange = () => props.save()

const resetAll = () => {
  props.reset()
}

const closeModal = () => {
  activeSection.value = 'locales'
  searchQuery.value = ''
  if (contentRef.value) contentRef.value.scrollTop = 0
  emit('close')
}

onMounted(() => {
  if (window.innerWidth < 768) showIndex.value = false
  nextTick(() => updateScrollPadding())
  const handleEscape = (e) => { if (e.key === 'Escape' && props.isOpen) closeModal() }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})
</script>

