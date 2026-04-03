<template>
  <Teleport to="body">
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-black bg-opacity-50" @click="closeModal">
        <Transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          <div v-if="isOpen" @click.stop class="bg-white dark:bg-gray-925 rounded-none md:rounded-lg max-w-5xl w-full h-screen md:h-[90vh] overflow-hidden flex flex-col safe-area-modal">

            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div class="flex items-center gap-2">
                <button @click="showIndex = !showIndex" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" :title="showIndex ? 'Hide index' : 'Show index'">
                  <Icon name="mdi:table-of-contents" class="block w-5 h-5" />
                </button>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">Settings</h2>
              </div>
              <div class="flex items-center gap-2">
                <div class="relative">
                  <Icon name="mdi:magnify" class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input v-model="searchQuery" type="text" placeholder="Search settings..."
                    class="w-40 md:w-56 pl-7 pr-7 py-1 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    @keydown.escape="searchQuery = ''" />
                  <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <Icon name="mdi:close" class="block w-4 h-4" />
                  </button>
                </div>
                <button @click="closeModal" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <Icon name="mdi:close" class="block w-5 h-5" />
                </button>
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
                      <button @click="scrollTo(section.id)" class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
                        :class="activeSection === section.id ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'">
                        {{ section.label }}
                      </button>
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
                      <!-- Preset -->
                      <div>
                        <label :class="labelClass">Preset</label>
                        <div class="grid grid-cols-3 gap-2">
                          <button v-for="(_preset, name) in presets" :key="name" @click="selectPreset(name)"
                            class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border-2"
                            :class="activePreset === name
                              ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                              : 'bg-gray-50 dark:bg-gray-925 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-400'">
                            {{ presetLabels[name] || name }}
                          </button>
                        </div>
                        <p v-if="activePreset === 'Custom'" class="mt-1 text-xs text-gray-500 dark:text-gray-400-muted">Custom settings — doesn't match any preset</p>
                      </div>
                      <!-- Language -->
                      <div>
                        <label :class="labelClass">Language</label>
                        <select :value="currentLocaleCode" @change="changeLocale($event.target.value)" :class="selectClass">
                          <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">{{ getLanguageEmoji(locale.code) }} {{ locale.name }}</option>
                        </select>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label :class="labelClass">Volume</label>
                          <select v-model="preferences.volume" @change="onSettingChange" :class="selectClass">
                            <option value="litre">Litres</option>
                            <option value="us_gallon">US Gallons</option>
                            <option value="uk_gallon">UK Gallons (Imperial)</option>
                          </select>
                        </div>
                        <div>
                          <label :class="labelClass">Fuel Economy</label>
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
                          <label :class="labelClass">Distance</label>
                          <select v-model="preferences.distance" @change="onSettingChange" :class="selectClass">
                            <option value="km">Kilometres</option>
                            <option value="miles">Miles</option>
                          </select>
                        </div>
                        <div>
                          <label :class="labelClass">Temperature</label>
                          <select v-model="preferences.temperature" @change="onSettingChange" :class="selectClass">
                            <option value="celsius">Celsius (°C)</option>
                            <option value="fahrenheit">Fahrenheit (°F)</option>
                            <option value="kelvin">Kelvin (K)</option>
                          </select>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label :class="labelClass">Date Format</label>
                          <select v-model="preferences.dateFormat" @change="onSettingChange" :class="selectClass">
                            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                            <option value="YYYY/MM/DD">YYYY/MM/DD (2025/12/31)</option>
                            <option value="DD.MM.YYYY">DD.MM.YYYY (31.12.2025)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                          </select>
                        </div>
                        <div>
                          <label :class="labelClass">Time Format</label>
                          <select v-model="preferences.timeFormat" @change="onSettingChange" :class="selectClass">
                            <option value="12h">12-hour (3:30 PM)</option>
                            <option value="24h">24-hour (15:30)</option>
                          </select>
                        </div>
                        <div>
                          <label :class="labelClass">Number Format</label>
                          <select v-model="preferences.numberFormat" @change="onSettingChange" :class="selectClass">
                            <option value="comma_dot">1,000.00 (US/UK)</option>
                            <option value="dot_comma">1.000,00 (DE/ES)</option>
                            <option value="space_comma">1 000,00 (FR)</option>
                          </select>
                        </div>
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
                        <div>
                          <label :class="labelClass">Font Family</label>
                          <select v-model="preferences.editorFontFamily" @change="onSettingChange" :class="selectClass">
                            <option value="system">System Default</option>
                            <option value="fira-code">Fira Code</option>
                            <option value="jetbrains-mono">JetBrains Mono</option>
                            <option value="source-code-pro">Source Code Pro</option>
                            <option value="cascadia-code">Cascadia Code</option>
                            <option value="ibm-plex-mono">IBM Plex Mono</option>
                          </select>
                          <p :class="hintClass">Custom fonts must be installed on your system</p>
                        </div>
                        <div>
                          <label :class="labelClass">Font Size: {{ preferences.editorFontSize }}px</label>
                          <input type="range" min="10" max="28" step="1" v-model.number="preferences.editorFontSize" @input="onSettingChange" class="w-full accent-primary-500" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>10px</span><span>28px</span></div>
                        </div>
                        <div>
                          <label :class="labelClass">Line Height: {{ preferences.editorLineHeight }}px</label>
                          <input type="range" min="14" max="36" step="1" v-model.number="preferences.editorLineHeight" @input="onSettingChange" class="w-full accent-primary-500" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>14px</span><span>36px</span></div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between">
                        <div>
                          <label :class="labelInlineClass">Font Ligatures</label>
                          <p :class="hintClass">Enable ligatures for supported fonts (e.g. Fira Code)</p>
                        </div>
                        <button @click="preferences.editorLigatures = !preferences.editorLigatures; onSettingChange()" :class="toggleClass(preferences.editorLigatures)">
                          <span :class="toggleDot(preferences.editorLigatures)" />
                        </button>
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
                        <div>
                          <label :class="labelClass">Line Numbers</label>
                          <select v-model="preferences.editorLineNumbers" @change="onSettingChange" :class="selectClass">
                            <option value="on">Absolute</option>
                            <option value="relative">Relative</option>
                            <option value="interval">Interval (every 10)</option>
                            <option value="off">Off</option>
                          </select>
                        </div>
                        <div>
                          <label :class="labelClass">Line Highlight</label>
                          <select v-model="preferences.editorRenderLineHighlight" @change="onSettingChange" :class="selectClass">
                            <option value="none">None</option>
                            <option value="line">Line</option>
                            <option value="all">Gutter + Line</option>
                          </select>
                        </div>
                      </div>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Word Wrap</label>
                            <p :class="hintClass">Wrap long lines to fit the editor width</p>
                          </div>
                          <button @click="preferences.editorWordWrap = !preferences.editorWordWrap; onSettingChange()" :class="toggleClass(preferences.editorWordWrap)">
                            <span :class="toggleDot(preferences.editorWordWrap)" />
                          </button>
                        </div>
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Code Folding</label>
                            <p :class="hintClass">Allow collapsing code regions</p>
                          </div>
                          <button @click="preferences.editorFolding = !preferences.editorFolding; onSettingChange()" :class="toggleClass(preferences.editorFolding)">
                            <span :class="toggleDot(preferences.editorFolding)" />
                          </button>
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
                        <div>
                          <label :class="labelClass">Cursor Style</label>
                          <select v-model="preferences.editorCursorStyle" @change="onSettingChange" :class="selectClass">
                            <option value="line">Line</option>
                            <option value="line-thin">Line (thin)</option>
                          </select>
                        </div>
                      </div>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Scroll Past End</label>
                            <p :class="hintClass">Allow scrolling beyond the last line of the document</p>
                          </div>
                          <button @click="preferences.editorScrollPastEnd = !preferences.editorScrollPastEnd; onSettingChange()" :class="toggleClass(preferences.editorScrollPastEnd)">
                            <span :class="toggleDot(preferences.editorScrollPastEnd)" />
                          </button>
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
                        <div>
                          <label :class="labelClass">Auto-close Brackets</label>
                          <select v-model="preferences.editorAutoClosingBrackets" @change="onSettingChange" :class="selectClass">
                            <option value="always">Always</option>
                            <option value="never">Never</option>
                          </select>
                        </div>
                        <div>
                          <label :class="labelClass">Tab Size: {{ preferences.editorTabSize }} spaces</label>
                          <input type="range" min="1" max="8" step="1" v-model.number="preferences.editorTabSize" @input="onSettingChange" class="w-full accent-primary-500" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>8</span></div>
                        </div>
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
                        <div>
                          <label :class="labelClass">Precision Mode</label>
                          <select v-model="preferences.precisionMode" @change="onSettingChange" :class="selectClass">
                            <option value="auto">Auto (smart formatting)</option>
                            <option value="decimals">Fixed decimal places</option>
                            <option value="significant">Significant figures</option>
                          </select>
                        </div>
                        <div v-if="preferences.precisionMode === 'decimals'">
                          <label :class="labelClass">Decimal Places: {{ preferences.decimalPlaces }}</label>
                          <input type="range" min="0" max="15" step="1" v-model.number="preferences.decimalPlaces" @input="onSettingChange" class="w-full accent-primary-500" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>15</span></div>
                        </div>
                        <div v-if="preferences.precisionMode === 'significant'">
                          <label :class="labelClass">Significant Figures: {{ preferences.significantFigures }}</label>
                          <input type="range" min="1" max="15" step="1" v-model.number="preferences.significantFigures" @input="onSettingChange" class="w-full accent-primary-500" />
                          <div class="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>15</span></div>
                        </div>
                      </div>
                      <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Inline Results Alignment</label>
                            <p :class="hintClass">Align inline results to the right edge of the editor</p>
                          </div>
                          <button @click="preferences.inlineResultAlign = preferences.inlineResultAlign === 'right' ? 'left' : 'right'; onSettingChange()" :class="toggleClass(preferences.inlineResultAlign === 'right')">
                            <span :class="toggleDot(preferences.inlineResultAlign === 'right')" />
                          </button>
                        </div>
                        <div class="flex items-center justify-between">
                          <div>
                            <label :class="labelInlineClass">Auto-copy Results</label>
                            <p :class="hintClass">Copy result to clipboard when clicked</p>
                          </div>
                          <button @click="preferences.autoCopyResult = !preferences.autoCopyResult; onSettingChange()" :class="toggleClass(preferences.autoCopyResult)">
                            <span :class="toggleDot(preferences.autoCopyResult)" />
                          </button>
                        </div>
                        <div v-if="preferences.autoCopyResult">
                          <label :class="labelClass">Copy Animation</label>
                          <select v-model="preferences.copyAnimationStyle" @change="onSettingChange" :class="selectClass">
                            <option value="float-up">Float up</option>
                            <option value="fade">Fade in/out</option>
                            <option value="scale-pop">Scale pop</option>
                            <option value="slide-right">Slide from left</option>
                            <option value="bounce">Bounce</option>
                            <option value="glow">Glow pulse</option>
                            <option value="none">None</option>
                          </select>
                          <p :class="hintClass">Animation style for the "Copied" feedback toast</p>
                        </div>
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
                        <button @click="emit('relaunch-wizard')"
                          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          Relaunch
                        </button>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-925 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <button @click="resetAll" class="text-sm text-gray-500 dark:text-gray-400-muted hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Reset to defaults
              </button>
              <p class="text-xs text-gray-500 dark:text-gray-400-muted">Saved automatically</p>
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

const selectClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
const sectionClass = 'pb-8 border-b border-gray-200 dark:border-gray-800 last:border-b-0'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1'
const labelInlineClass = 'block text-sm font-medium text-gray-700 dark:text-gray-400'
const hintClass = 'text-xs text-gray-500 dark:text-gray-500 mt-0.5'

const toggleClass = (active) => [
  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
  active ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'
]
const toggleDot = (active) => [
  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
  active ? 'translate-x-6' : 'translate-x-1'
]

const sections = [
  { id: 'locales', label: 'Locales', keywords: 'locale language preset volume fuel economy distance temperature date time number format region' },
  { id: 'typography', label: 'Typography', keywords: 'font family size line height ligatures typography text' },
  { id: 'layout', label: 'Layout', keywords: 'layout line numbers word wrap folding highlight' },
  { id: 'cursor', label: 'Cursor & Scrolling', keywords: 'cursor style scroll past end' },
  { id: 'behaviour', label: 'Behaviour', keywords: 'behaviour auto close brackets tab size indentation' },
  { id: 'results', label: 'Results & Display', keywords: 'results display precision decimal significant copy animation inline alignment' },
  { id: 'general', label: 'General', keywords: 'general welcome wizard relaunch setup' },
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

