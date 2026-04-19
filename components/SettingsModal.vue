<!-- eslint-disable vue/no-mutating-props -->
<template>
  <UiModal
    :show="isOpen"
    max-width="5xl"
    padding="md:p-4"
    panel-class="h-screen md:h-[90vh] safe-area-modal rounded-none md:rounded-lg"
    @close="closeModal"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
      >
        <div class="flex items-center gap-2">
          <UiButton
            variant="ghost"
            color="gray"
            icon-only
            class="md:hidden"
            :title="activeSection ? 'Back' : 'Close'"
            @click="mobileBack"
          >
            <Icon :name="activeSection && isMobile ? 'mdi:arrow-left' : 'mdi:close'" class="block w-5 h-5" />
          </UiButton>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-200 leading-none">
            {{ activeSection && isMobile ? activeSectionLabel : 'Settings' }}
          </h2>
        </div>
        <UiButton variant="ghost" color="gray" icon-only class="hidden md:flex" @click="closeModal">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <!-- Body: sidebar + content -->
      <div class="flex flex-1 overflow-hidden min-h-0">
        <!-- Sidebar navigation -->
        <nav
          v-show="!isMobile || (!activeSection && transitionState !== 'leaving')"
          class="flex-shrink-0 w-full md:w-60 h-full bg-gray-50 dark:bg-gray-900 md:border-r border-gray-200 dark:border-gray-800 overflow-y-auto"
        >
          <div class="p-3 pb-2">
            <div class="relative">
              <Icon
                name="mdi:magnify"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search settings..."
                class="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                @keydown.escape="searchQuery = ''"
              >
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="searchQuery = ''"
              >
                <Icon name="mdi:close" class="block w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <ul class="px-2 pb-3 space-y-0.5">
            <template v-for="(section, idx) in filteredSections" :key="section.id">
              <!-- Separator between app settings and account sections -->
              <li v-if="section.id === 'profile' && idx > 0" class="py-1.5 px-3">
                <div class="border-t border-gray-200 dark:border-gray-700/50" />
              </li>
              <li>
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
                  :class="
                    activeSection === section.id
                      ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850'
                  "
                  @click="selectSection(section.id)"
                >
                  <Icon :name="section.icon" class="w-5 h-5 flex-shrink-0 opacity-70" />
                  <div class="min-w-0">
                    <span class="block truncate">{{ section.label }}</span>
                    <span class="block text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {{ section.description }}
                    </span>
                  </div>
                </button>
              </li>
            </template>
            <li
              v-if="searchQuery && filteredSections.length === 0"
              class="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-500"
            >
              <Icon name="mdi:magnify" class="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No results for "{{ searchQuery }}"</p>
            </li>
          </ul>
        </nav>

        <!-- Content panel -->
        <div v-show="!isMobile || activeSection || transitionState === 'leaving'" ref="contentPanelRef" class="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-925">
          <!-- No section selected (desktop placeholder) -->
          <div
            v-if="!activeSection && !isMobile"
            class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500"
          >
            <div class="text-center">
              <Icon name="mdi:cog-outline" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p class="text-sm">Select a category</p>
            </div>
          </div>

          <!-- Section content with slide transition -->
          <div v-if="displayedSection" :class="sectionTransitionClasses">

          <!-- ===== Locales ===== -->
          <div v-if="displayedSection === 'locales'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:earth" title="Locales" description="Region, language, and format preferences" />
              <UiListMenu label="Quick Preset" preset="settings">
                <div class="px-4 py-3">
                  <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">Apply a regional preset to set all locale options at once</p>
                  <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <button v-for="(_preset, name) in presets" :key="name" type="button"
                      class="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium border-2 transition-all"
                      :class="activePreset === name
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800/60 border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'"
                      @click="selectPreset(name)">
                      <span class="text-lg leading-none">{{ presetEmojis[name] }}</span>
                      <span>{{ name }}</span>
                    </button>
                  </div>
                  <p v-if="activePreset === 'Custom'" class="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">Custom settings — doesn't match any preset</p>
                </div>
              </UiListMenu>
              <UiListMenu label="Language" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:translate" :select-ref="selectLocale">
                  Display Language
                  <template #suffix>
                    <UiSelect ref="selectLocale" :model-value="currentLocaleCode" searchable
                      :options="availableLocales.map((l) => ({ value: l.code, label: getLanguageEmoji(l.code) + ' ' + l.name }))"
                      @update:model-value="changeLocale($event)" />
                  </template>
                </UiListMenuItem>
              </UiListMenu>
              <UiListMenu label="Units" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:cup-water" :select-ref="selectVolume">
                  Volume
                  <template #suffix><UiSelect ref="selectVolume" :model-value="preferences.volume" :options="[{ value: 'litre', label: 'Litres' },{ value: 'us_gallon', label: 'US Gallons' },{ value: 'uk_gallon', label: 'UK Gallons (Imperial)' }]" @update:model-value="preferences.volume = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:gas-station-outline" :select-ref="selectFuelEconomy">
                  Fuel Economy
                  <template #suffix><UiSelect ref="selectFuelEconomy" :model-value="preferences.fuelEconomy" :options="[{ value: 'mpg', label: 'Miles per gallon (US)' },{ value: 'mpg_uk', label: 'Miles per gallon (UK)' },{ value: 'kpl', label: 'Km per litre' },{ value: 'l/100km', label: 'Litres per 100 km' },{ value: 'mpl', label: 'Miles per litre' },{ value: 'kpg', label: 'Km per gallon (US)' }]" @update:model-value="preferences.fuelEconomy = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:map-marker-distance" :select-ref="selectDistance">
                  Distance
                  <template #suffix><UiSelect ref="selectDistance" :model-value="preferences.distance" :options="[{ value: 'km', label: 'Kilometres' },{ value: 'miles', label: 'Miles' }]" @update:model-value="preferences.distance = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:thermometer" :select-ref="selectTemperature">
                  Temperature
                  <template #suffix><UiSelect ref="selectTemperature" :model-value="preferences.temperature" :options="[{ value: 'celsius', label: 'Celsius (°C)' },{ value: 'fahrenheit', label: 'Fahrenheit (°F)' },{ value: 'kelvin', label: 'Kelvin (K)' }]" @update:model-value="preferences.temperature = $event; onSettingChange()" /></template>
                </UiListMenuItem>
              </UiListMenu>
              <UiListMenu label="Formats" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:calendar-outline" :select-ref="selectDateFormat">
                  Date Format
                  <template #suffix><UiSelect ref="selectDateFormat" :model-value="preferences.dateFormat" :options="[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },{ value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },{ value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]" @update:model-value="preferences.dateFormat = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:clock-outline" :select-ref="selectTimeFormat">
                  Time Format
                  <template #suffix><UiSelect ref="selectTimeFormat" :model-value="preferences.timeFormat" :options="[{ value: '12h', label: '12-hour (3:30 PM)' },{ value: '24h', label: '24-hour (15:30)' }]" @update:model-value="preferences.timeFormat = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:numeric" :select-ref="selectNumberFormat">
                  Number Format
                  <template #suffix><UiSelect ref="selectNumberFormat" :model-value="preferences.numberFormat" :options="[{ value: 'comma_dot', label: '1,000.00 (US/UK)' },{ value: 'dot_comma', label: '1.000,00 (DE/ES)' },{ value: 'space_comma', label: '1 000,00 (FR)' }]" @update:model-value="preferences.numberFormat = $event; onSettingChange()" /></template>
                </UiListMenuItem>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Typography ===== -->
          <div v-if="displayedSection === 'typography'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:format-font" title="Typography" description="Font, size, and text rendering" />
              <UiListMenu label="Font" preset="settings">
                <UiListMenuItem icon="mdi:format-font" hint="Custom fonts must be installed on your system" :select-ref="selectFontFamily">
                  Font Family
                  <template #suffix><UiSelect ref="selectFontFamily" :model-value="preferences.editorFontFamily" :options="[{ value: 'system', label: 'System Default' },{ value: 'fira-code', label: 'Fira Code' },{ value: 'jetbrains-mono', label: 'JetBrains Mono' },{ value: 'source-code-pro', label: 'Source Code Pro' },{ value: 'cascadia-code', label: 'Cascadia Code' },{ value: 'ibm-plex-mono', label: 'IBM Plex Mono' }]" @update:model-value="preferences.editorFontFamily = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:format-letter-matches" hint="Enable ligatures for supported fonts (e.g. Fira Code)" :toggle="preferences.editorLigatures" @update:toggle="preferences.editorLigatures = $event; onSettingChange()">
                  Font Ligatures
                  <template #suffix><UiToggle :model-value="preferences.editorLigatures" readonly /></template>
                </UiListMenuItem>
              </UiListMenu>
              <UiListMenu label="Size &amp; Spacing" preset="settings" class="mt-5">
                <div class="px-4 py-3 space-y-5">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2"><Icon name="mdi:format-size" class="w-4 h-4 text-gray-400 dark:text-gray-500" /><label class="text-sm text-gray-800 dark:text-gray-300">Font Size</label></div>
                      <span class="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums">{{ preferences.editorFontSize }}px</span>
                    </div>
                    <UiSlider v-model="preferences.editorFontSize" min="10" max="28" step="1" @input="onSettingChange" />
                    <div class="flex justify-between text-[11px] text-gray-400 mt-1"><span>10px</span><span>28px</span></div>
                  </div>
                  <div class="border-t border-gray-100 dark:border-gray-700/40 pt-5">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2"><Icon name="mdi:format-line-spacing" class="w-4 h-4 text-gray-400 dark:text-gray-500" /><label class="text-sm text-gray-800 dark:text-gray-300">Line Height</label></div>
                      <span class="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums">{{ preferences.editorLineHeight }}px</span>
                    </div>
                    <UiSlider v-model="preferences.editorLineHeight" min="14" max="36" step="1" @input="onSettingChange" />
                    <div class="flex justify-between text-[11px] text-gray-400 mt-1"><span>14px</span><span>36px</span></div>
                  </div>
                </div>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Layout ===== -->
          <div v-if="displayedSection === 'layout'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:page-layout-body" title="Layout" description="Editor chrome, gutters, and visual aids" />
              <UiListMenu label="Gutters" preset="settings">
                <UiListMenuItem icon="mdi:format-list-numbered" :select-ref="selectLineNumbers">
                  Line Numbers
                  <template #suffix><UiSelect ref="selectLineNumbers" :model-value="preferences.editorLineNumbers" :options="[{ value: 'on', label: 'Absolute' },{ value: 'relative', label: 'Relative' },{ value: 'interval', label: 'Interval (every 10)' },{ value: 'off', label: 'Off' }]" @update:model-value="preferences.editorLineNumbers = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:format-color-highlight" :select-ref="selectLineHighlight">
                  Line Highlight
                  <template #suffix><UiSelect ref="selectLineHighlight" :model-value="preferences.editorRenderLineHighlight" :options="[{ value: 'none', label: 'None' },{ value: 'line', label: 'Line' },{ value: 'all', label: 'Gutter + Line' }]" @update:model-value="preferences.editorRenderLineHighlight = $event; onSettingChange()" /></template>
                </UiListMenuItem>
              </UiListMenu>
              <UiListMenu label="Text Display" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:wrap" hint="Wrap long lines to fit the editor width" :toggle="preferences.editorWordWrap" @update:toggle="preferences.editorWordWrap = $event; onSettingChange()">
                  Word Wrap
                  <template #suffix><UiToggle :model-value="preferences.editorWordWrap" readonly /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:code-braces" hint="Allow collapsing code regions" :toggle="preferences.editorFolding" @update:toggle="preferences.editorFolding = $event; onSettingChange()">
                  Code Folding
                  <template #suffix><UiToggle :model-value="preferences.editorFolding" readonly /></template>
                </UiListMenuItem>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Cursor & Scrolling ===== -->
          <div v-if="displayedSection === 'cursor'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:cursor-text" title="Cursor &amp; Scrolling" description="Cursor appearance and scroll behaviour" />
              <UiListMenu label="Cursor" preset="settings">
                <UiListMenuItem icon="mdi:cursor-text" :select-ref="selectCursorStyle">
                  Cursor Style
                  <template #suffix><UiSelect ref="selectCursorStyle" :model-value="preferences.editorCursorStyle" :options="[{ value: 'line', label: 'Line' },{ value: 'line-thin', label: 'Line (thin)' }]" @update:model-value="preferences.editorCursorStyle = $event; onSettingChange()" /></template>
                </UiListMenuItem>
              </UiListMenu>
              <UiListMenu label="Scrolling" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:arrow-expand-down" hint="Allow scrolling beyond the last line" :toggle="preferences.editorScrollPastEnd" @update:toggle="preferences.editorScrollPastEnd = $event; onSettingChange()">
                  Scroll Past End
                  <template #suffix><UiToggle :model-value="preferences.editorScrollPastEnd" readonly /></template>
                </UiListMenuItem>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Behaviour ===== -->
          <div v-if="displayedSection === 'behaviour'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:cog-outline" title="Behaviour" description="Auto-close, indentation, and bracket matching" />
              <UiListMenu label="Brackets &amp; Indentation" preset="settings">
                <UiListMenuItem icon="mdi:code-brackets" :select-ref="selectAutoCloseBrackets">
                  Auto-close Brackets
                  <template #suffix><UiSelect ref="selectAutoCloseBrackets" :model-value="preferences.editorAutoClosingBrackets" :options="[{ value: 'always', label: 'Always' },{ value: 'never', label: 'Never' }]" @update:model-value="preferences.editorAutoClosingBrackets = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:keyboard-tab">
                  Tab Size
                  <template #suffix>
                    <div class="flex items-center gap-3">
                      <span class="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums w-16 text-right">{{ preferences.editorTabSize }} spaces</span>
                      <div class="w-24"><UiSlider v-model="preferences.editorTabSize" min="1" max="8" step="1" @input="onSettingChange" /></div>
                    </div>
                  </template>
                </UiListMenuItem>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Results & Display ===== -->
          <div v-if="displayedSection === 'results'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:calculator-variant-outline" title="Results &amp; Display" description="Precision, formatting, and inline result behaviour" />
              <UiListMenu label="Precision" preset="settings">
                <UiListMenuItem icon="mdi:decimal" :select-ref="selectPrecisionMode">
                  Precision Mode
                  <template #suffix><UiSelect ref="selectPrecisionMode" :model-value="preferences.precisionMode" :options="[{ value: 'auto', label: 'Auto (smart)' },{ value: 'decimals', label: 'Fixed decimals' },{ value: 'significant', label: 'Significant figures' }]" @update:model-value="preferences.precisionMode = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <UiListMenuItem v-if="preferences.precisionMode !== 'auto'" icon="mdi:decimal-decrease" :select-ref="selectRoundingMode">
                  Rounding Mode
                  <template #suffix><UiSelect ref="selectRoundingMode" :model-value="preferences.roundingMode" :options="[{ value: 'round', label: 'Round' },{ value: 'truncate', label: 'Truncate' }]" @update:model-value="preferences.roundingMode = $event; onSettingChange()" /></template>
                </UiListMenuItem>
                <div v-if="preferences.precisionMode === 'decimals'" class="px-4 py-3 border-t border-gray-100 dark:border-gray-700/40">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2"><Icon name="mdi:decimal-increase" class="w-4 h-4 text-gray-400 dark:text-gray-500" /><label class="text-sm text-gray-800 dark:text-gray-300">Decimal Places</label></div>
                    <span class="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums">{{ preferences.decimalPlaces }}</span>
                  </div>
                  <UiSlider v-model="preferences.decimalPlaces" min="0" max="15" step="1" @input="onSettingChange" />
                  <div class="flex justify-between text-[11px] text-gray-400 mt-1"><span>0</span><span>15</span></div>
                </div>
                <div v-if="preferences.precisionMode === 'significant'" class="px-4 py-3 border-t border-gray-100 dark:border-gray-700/40">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2"><Icon name="mdi:sigma" class="w-4 h-4 text-gray-400 dark:text-gray-500" /><label class="text-sm text-gray-800 dark:text-gray-300">Significant Figures</label></div>
                    <span class="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums">{{ preferences.significantFigures }}</span>
                  </div>
                  <UiSlider v-model="preferences.significantFigures" min="1" max="15" step="1" @input="onSettingChange" />
                  <div class="flex justify-between text-[11px] text-gray-400 mt-1"><span>1</span><span>15</span></div>
                </div>
              </UiListMenu>
              <UiListMenu label="Output" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:content-copy" hint="Copy result to clipboard when clicked" :toggle="preferences.autoCopyResult" @update:toggle="preferences.autoCopyResult = $event; onSettingChange()">
                  Auto-copy Results
                  <template #suffix><UiToggle :model-value="preferences.autoCopyResult" readonly /></template>
                </UiListMenuItem>
                <UiListMenuItem icon="mdi:code-tags" hint="Evaluate and display results inside fenced code blocks" :toggle="preferences.showResultsInCodeBlocks" @update:toggle="preferences.showResultsInCodeBlocks = $event; onSettingChange()">
                  Results in Code Blocks
                  <template #suffix><UiToggle :model-value="preferences.showResultsInCodeBlocks" readonly /></template>
                </UiListMenuItem>
                <UiListMenuItem v-if="preferences.autoCopyResult" icon="mdi:animation-outline" :select-ref="selectCopyAnimation">
                  Copy Animation
                  <template #suffix><UiSelect ref="selectCopyAnimation" :model-value="preferences.copyAnimationStyle" :options="[{ value: 'float-up', label: 'Float up' },{ value: 'fade', label: 'Fade' },{ value: 'scale-pop', label: 'Scale pop' },{ value: 'slide-right', label: 'Slide' },{ value: 'bounce', label: 'Bounce' },{ value: 'glow', label: 'Glow' },{ value: 'none', label: 'None' }]" @update:model-value="preferences.copyAnimationStyle = $event; onSettingChange()" /></template>
                </UiListMenuItem>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== General ===== -->
          <div v-if="displayedSection === 'general'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:tune-variant" title="General" description="Miscellaneous application settings" />
              <UiListMenu label="Setup" preset="settings">
                <UiListMenuItem icon="mdi:wizard-hat" hint="Show the first-time setup wizard again" clickable @click="emit('relaunch-wizard')">
                  Welcome Wizard
                  <template #suffix>
                    <span class="text-xs font-medium text-primary-600 dark:text-primary-400">Relaunch</span>
                  </template>
                </UiListMenuItem>
              </UiListMenu>
              <UiListMenu label="Updates" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:update" hint="How often to check for new versions" :select-ref="selectUpdateInterval">
                  Check Interval
                  <template #suffix><UiSelect ref="selectUpdateInterval" :model-value="preferences.updateCheckInterval" :options="[{ value: 5, label: 'Every 5 min' },{ value: 15, label: 'Every 15 min' },{ value: 30, label: 'Every 30 min' },{ value: 60, label: 'Every hour' },{ value: 360, label: 'Every 6 hours' },{ value: 0, label: 'Manual only' }]" @update:model-value="preferences.updateCheckInterval = $event; onSettingChange()" /></template>
                </UiListMenuItem>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Profile ===== -->
          <div v-if="displayedSection === 'profile'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:account-circle-outline" title="Profile" description="Your account information" />

              <!-- Profile card -->
              <div class="relative rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700/50 px-4 py-5 mb-5">
                <div class="flex items-center gap-4">
                  <button type="button" class="relative group flex-shrink-0 rounded-full" title="Change avatar" @click="profileSubSection = 'avatar'">
                    <UiAvatar :src="user?.avatarUrl" size="xl" ring />
                    <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="mdi:camera" class="w-4 h-4 text-white" />
                    </div>
                  </button>
                  <div class="flex-1 min-w-0 cursor-pointer" role="button" tabindex="0" title="Edit profile" @click="enterEditProfile" @keydown.enter="enterEditProfile">
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{{ user?.name || 'No name set' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{{ user?.email }}</p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Member since {{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' }}</p>
                  </div>
                </div>
              </div>

              <!-- Quick stats -->
              <div class="grid grid-cols-3 gap-2 mb-5">
                <button type="button" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-colors" @click="emit('show-notes')">
                  <Icon name="mdi:note-multiple-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <p class="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-none">{{ user?.stats?.notesCount ?? '—' }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Notes</p>
                </button>
                <button type="button" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-colors" @click="selectSection('shared')">
                  <Icon name="mdi:share-variant-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <p class="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-none">{{ user?.stats?.sharedCount ?? '—' }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Shared</p>
                </button>
                <button type="button" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-colors" @click="emit('sync-now')">
                  <Icon name="mdi:cloud-sync-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-200 leading-snug break-words capitalize">{{ lastSyncedAt ? profileFormatDate(lastSyncedAt) : '—' }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Synced</p>
                </button>
              </div>

              <!-- Avatar sub-section -->
              <template v-if="profileSubSection === 'avatar'">
                <UiListMenu label="Change Avatar" preset="settings" class="mb-5">
                  <div v-if="!avatarImageSrc" class="text-center space-y-3 py-4 px-4">
                    <div class="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Icon name="mdi:image-plus" class="w-10 h-10 text-gray-400" />
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Choose an image for your avatar</p>
                    <UiFileInput accept="image/*" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg" @select="onFileSelect">
                      <Icon name="mdi:upload" class="w-4 h-4" /> Upload Image
                    </UiFileInput>
                    <UiButton v-if="user?.avatarUrl" variant="ghost" color="red" size="xs" class="block mx-auto mt-2" @click="removeAvatar">Remove current avatar</UiButton>
                    <UiButton variant="ghost" color="gray" size="sm" class="block mx-auto mt-1" @click="cancelProfileSubSection">Cancel</UiButton>
                  </div>
                  <div v-else class="space-y-3 p-4">
                    <AvatarEditor :image-source="avatarImageSrc" :canvas-size="editorCanvasSize" @update="onAvatarCropped" />
                    <div class="flex gap-2">
                      <UiButton variant="solid" color="gray" class="flex-1" @click="avatarImageSrc = null">Choose Different</UiButton>
                      <UiButton variant="solid" color="primary" :loading="profileSaving" class="flex-1" @click="saveAvatar">Save Avatar</UiButton>
                    </div>
                    <UiButton variant="ghost" color="gray" size="sm" block @click="cancelProfileSubSection">Cancel</UiButton>
                  </div>
                </UiListMenu>
              </template>

              <!-- Edit profile sub-section -->
              <template v-if="profileSubSection === 'edit'">
                <UiListMenu label="Edit Profile" preset="settings" class="mb-5">
                  <div class="space-y-4 p-4">
                    <UiFormField label="Name"><UiInput v-model="editName" type="text" placeholder="Your name" :validate="false" /></UiFormField>
                    <UiFormField label="Email"><UiInput v-model="editEmail" type="email" placeholder="you@example.com" /></UiFormField>
                    <div class="flex gap-2">
                      <UiButton variant="outline" color="gray" class="flex-1" @click="cancelProfileSubSection">Cancel</UiButton>
                      <UiButton variant="solid" color="primary" class="flex-1" :loading="profileSaving" @click="saveProfile">Save Changes</UiButton>
                    </div>
                  </div>
                </UiListMenu>
              </template>

              <!-- Password sub-section -->
              <template v-if="profileSubSection === 'password'">
                <UiListMenu label="Change Password" preset="settings" class="mb-5">
                  <div class="p-4">
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-3">Changing your password will re-encrypt all your notes. This may take a moment.</p>
                    <div class="space-y-4">
                      <UiFormField label="Current Password"><UiInput v-model="currentPassword" type="password" :validate="false" /></UiFormField>
                      <UiFormField label="New Password" hint="At least 8 characters"><UiInput v-model="newPassword" type="password" :minlength="8" :validate="false" /></UiFormField>
                      <div>
                        <UiFormField label="Confirm New Password"><UiInput v-model="confirmNewPassword" type="password" :validate="false" /></UiFormField>
                        <p v-if="confirmNewPassword && newPassword !== confirmNewPassword" class="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match</p>
                      </div>
                      <UiProgressBar v-if="reEncryptProgress" label="Re-encrypting notes…" show-value :current="reEncryptProgress.current" :total="reEncryptProgress.total" />
                      <div class="flex gap-2">
                        <UiButton variant="outline" color="gray" class="flex-1" :disabled="profileSaving" @click="cancelProfileSubSection">Cancel</UiButton>
                        <UiButton variant="solid" color="primary" class="flex-1" :loading="profileSaving" :disabled="!currentPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 8" @click="savePassword">Update Password</UiButton>
                      </div>
                    </div>
                  </div>
                </UiListMenu>
              </template>

              <!-- Actions (when no sub-section is active) -->
              <template v-if="!profileSubSection">
                <UiListMenu label="Account" preset="settings" class="mb-5">
                  <UiListMenuItem icon="mdi:account-edit-outline" clickable @click="enterEditProfile">Edit Profile</UiListMenuItem>
                  <UiListMenuItem icon="mdi:lock-outline" clickable @click="profileSubSection = 'password'">Change Password</UiListMenuItem>
                </UiListMenu>
                <UiListMenu label="Privacy" preset="settings">
                  <UiListMenuItem icon="mdi:shield-account-outline" :hint="privacyNoTracking ? 'Identity hidden on shared notes' : 'Sharers can see your name & device'" :toggle="privacyNoTracking" :disabled="savingPrivacy" @update:toggle="togglePrivacy">
                    Privacy Protection
                    <template #suffix><UiToggle :model-value="privacyNoTracking" :disabled="savingPrivacy" size="sm" readonly /></template>
                  </UiListMenuItem>
                </UiListMenu>
                <UiListMenu preset="settings" class="mt-5">
                  <UiListMenuItem icon="mdi:logout-variant" danger clickable :chevron="false" @click="emit('logout'); closeModal()">Sign out</UiListMenuItem>
                </UiListMenu>
              </template>
            </div>
          </div>

          <!-- ===== Security ===== -->
          <div v-if="displayedSection === 'security'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:shield-lock-outline" title="Security" description="Session, app lock, and recovery settings" />

              <UiListMenu label="Session" preset="settings">
                <UiListMenuItem icon="mdi:timer-outline" hint="How long you stay logged in. Changes apply on next login." :select-ref="selectSessionDuration">
                  Session Duration
                  <template #suffix>
                    <UiSelect ref="selectSessionDuration" :model-value="sessionDuration" :disabled="savingSessionDuration" :block="false" size="sm"
                      :options="[{ value: 3600, label: '1 hour' },{ value: 86400, label: '1 day' },{ value: 604800, label: '7 days' },{ value: 2592000, label: '30 days' }]"
                      @update:model-value="sessionDuration = $event; saveSessionDuration()" />
                  </template>
                </UiListMenuItem>
              </UiListMenu>

              <!-- App Lock -->
              <UiListMenu label="App Lock" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:lock-outline" :hint="draft.enabled ? 'App is protected. Unlock required after timeout.' : 'Protect the app with a PIN, password, or biometrics.'" :toggle="draft.enabled" @update:toggle="draft.enabled = $event">
                  App Lock
                  <template #suffix><UiToggle :model-value="draft.enabled" size="sm" readonly /></template>
                </UiListMenuItem>
                <template v-if="draft.enabled">
                  <UiListMenuItem icon="mdi:key-outline" :select-ref="selectLockMethod">
                    Lock Method
                    <template #suffix><UiSelect ref="selectLockMethod" :model-value="draft.method" :block="false" size="sm" :options="appLockMethodOptions" @update:model-value="onDraftMethodChange" /></template>
                  </UiListMenuItem>
                  <UiAlert v-if="showBiometricsChangeWarning" color="amber" icon="mdi:cellphone-remove" bordered size="md" class="my-2">
                    <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      Biometrics is active on another device — switching to {{ draft.method === 'pin' ? 'PIN' : 'password' }} here will disable it everywhere. To avoid this, use the biometrics fallback option instead.
                    </p>
                  </UiAlert>
                  <div v-if="draft.method === 'biometrics' && appLockAvailableBiometrics.length > 1" class="px-4 py-2 space-y-1.5">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Biometric methods</span>
                    <div class="flex flex-wrap gap-1.5">
                      <UiButton v-for="bio in appLockAvailableBiometrics" :key="bio.id" variant="ghost" shape="pill" size="xs"
                        :class="draft.selectedBiometrics.includes(bio.id) ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                        @click="toggleDraftBiometric(bio.id)">
                        <Icon :name="bio.icon" class="w-3.5 h-3.5" /> {{ bio.label }}
                      </UiButton>
                    </div>
                  </div>
                  <div v-if="draftShowPin" class="px-4 py-2 space-y-1.5">
                    <label class="text-xs text-gray-600 dark:text-gray-400">{{ draft.method === 'biometrics' ? 'Fallback PIN' : 'PIN' }} <span class="text-gray-400">(4 digits)</span></label>
                    <UiInput :model-value="draft.pin" type="password" placeholder="Enter 4-digit PIN" :maxlength="4" inputmode="numeric" :validate="false" @update:model-value="draft.pin = $event.replace(/\D/g, '').slice(0, 4)" />
                    <UiInput :model-value="draft.pinConfirm" type="password" placeholder="Confirm PIN" :maxlength="4" inputmode="numeric" :validate="false" @update:model-value="draft.pinConfirm = $event.replace(/\D/g, '').slice(0, 4)" />
                    <p v-if="draft.pinConfirm && draft.pin !== draft.pinConfirm" class="text-xs text-red-600 dark:text-red-400">PINs do not match</p>
                  </div>
                  <div v-if="draftShowPassword" class="px-4 py-2 space-y-1.5">
                    <label class="text-xs text-gray-600 dark:text-gray-400">{{ draft.method === 'biometrics' ? 'Fallback password' : 'Lock password' }}</label>
                    <UiInput v-model="draft.password" type="password" placeholder="Enter lock password" :validate="false" />
                    <UiInput v-model="draft.passwordConfirm" type="password" placeholder="Confirm password" :validate="false" />
                    <p v-if="draft.passwordConfirm && draft.password !== draft.passwordConfirm" class="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                  </div>
                  <div v-if="draft.method === 'biometrics' || showBiometricsChangeWarning" class="relative">
                    <Transition
                      enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0" enter-to-class="opacity-100"
                      leave-active-class="transition-opacity duration-500" leave-from-class="opacity-100" leave-to-class="opacity-0"
                    >
                      <div v-if="fallbackGlow" class="absolute inset-0 z-10 pointer-events-none rounded-lg bg-primary-500/25 dark:bg-primary-400/20" />
                    </Transition>
                    <UiListMenuItem icon="mdi:key-variant" :select-ref="selectBiometricsFallback">
                      Biometrics Fallback
                      <template #suffix><UiSelect ref="selectBiometricsFallback" v-model="draft.biometricsFallback" :block="false" size="sm" :options="[{ value: 'pin', label: 'PIN' },{ value: 'password', label: 'Password' }]" /></template>
                    </UiListMenuItem>
                  </div>
                  <UiAlert v-if="draft.method === 'biometrics' && biometricError" color="amber" icon="mdi:fingerprint-off" bordered size="md" class="my-2">
                    <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{{ biometricError.message }}</p>
                  </UiAlert>
                  <UiListMenuItem icon="mdi:timer-sand" :select-ref="selectLockAfter">
                    Lock After
                    <template #suffix><UiSelect ref="selectLockAfter" v-model="draft.timeout" :block="false" size="sm" :options="[{ value: 0, label: 'Manual only' },{ value: 60, label: '1 minute' },{ value: 300, label: '5 minutes' },{ value: 900, label: '15 minutes' },{ value: 1800, label: '30 minutes' }]" /></template>
                  </UiListMenuItem>
                  <div class="flex gap-2 px-4 py-3">
                    <UiButton variant="outline" color="gray" class="flex-1" size="sm" :disabled="!draftHasChanges" @click="resetDraft">Cancel</UiButton>
                    <UiButton variant="solid" color="primary" class="flex-1" size="sm" :disabled="!canSaveAppLock" @click="saveAppLock">Save</UiButton>
                  </div>
                </template>
              </UiListMenu>

              <!-- Privacy Screen -->
              <UiListMenu v-if="isNativePlatform" label="Privacy Screen" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:eye-off-outline" :hint="privacyScreenEnabled ? 'Content hidden in app switcher, screenshots blocked.' : 'Hide content in app switcher and prevent screenshots.'" :toggle="privacyScreenEnabled" :disabled="savingPrivacyScreen" @update:toggle="togglePrivacyScreen">
                  Privacy Screen
                  <template #suffix><UiToggle :model-value="privacyScreenEnabled" :disabled="savingPrivacyScreen" size="sm" readonly /></template>
                </UiListMenuItem>
              </UiListMenu>

              <!-- Password Recovery -->
              <UiListMenu label="Password Recovery" preset="settings" class="mt-5">
                <UiListMenuItem icon="mdi:email-lock-outline" :hint="passwordRecoveryEnabled ? 'You can recover your account via email.' : 'Recovery disabled — store your password safely.'" :toggle="passwordRecoveryEnabled" :disabled="savingSecurity" @update:toggle="onPasswordRecoveryToggle">
                  Recovery by Email
                  <template #suffix><UiToggle :model-value="passwordRecoveryEnabled" :disabled="savingSecurity" size="sm" readonly /></template>
                </UiListMenuItem>
                <div v-if="confirmingRecoveryEnable" class="rounded-lg border p-3 space-y-2 mx-4 mb-3 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800">
                  <div class="flex gap-2">
                    <Icon name="mdi:shield-alert-outline" class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">Enabling password recovery makes your account recoverable via email, but anyone with email access could reset your password and delete your notes.</p>
                  </div>
                  <div class="flex gap-2">
                    <UiButton variant="outline" color="gray" size="xs" class="flex-1" @click="confirmingRecoveryEnable = false">Cancel</UiButton>
                    <UiButton variant="solid" color="amber" size="xs" class="flex-1" :loading="savingSecurity" @click="confirmPasswordRecovery">Enable</UiButton>
                  </div>
                </div>
                <template v-if="passwordRecoveryEnabled">
                  <UiAlert color="amber" icon="mdi:shield-alert-outline" bordered size="md" class="mx-4 mb-2">
                    <p class="font-semibold text-amber-800 dark:text-amber-200">Account access risk</p>
                    <p class="text-amber-700 dark:text-amber-300 leading-relaxed">Anyone with access to your email can trigger a password reset and take over your account.</p>
                  </UiAlert>
                  <UiAlert color="red" icon="mdi:database-remove-outline" bordered size="md" class="mx-4 mb-3">
                    <p class="font-semibold text-red-800 dark:text-red-200">All notes destroyed on recovery</p>
                    <p class="text-red-700 dark:text-red-300 leading-relaxed">A password reset means the encryption key is lost — <span class="font-semibold">all notes will be permanently deleted</span>.</p>
                  </UiAlert>
                </template>
              </UiListMenu>
            </div>
          </div>

          <!-- ===== Sessions ===== -->
          <div v-if="displayedSection === 'sessions'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:devices" title="Active Sessions" description="Manage your logged-in devices" />
              <div v-if="loadingSessions" class="flex items-center justify-center py-8">
                <Icon name="mdi:loading" class="w-6 h-6 text-gray-400 animate-spin" />
              </div>
              <template v-else>
                <UiButton v-if="sessions.length > 1" variant="ghost" color="red" block :loading="savingSessions" class="mb-4" @click="closeOtherSessions">
                  <Icon v-if="!savingSessions" name="mdi:logout-variant" class="w-4 h-4" /> Close all other sessions
                </UiButton>
                <div class="space-y-2">
                  <div v-for="s in sessions" :key="s.id" class="px-3 py-2.5 rounded-lg border"
                    :class="s.isCurrent ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5">
                          <Icon :name="getDeviceIcon(s.deviceName)" class="w-4 h-4 flex-shrink-0" :class="s.isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'" />
                          <p class="text-sm font-medium truncate" :class="s.isCurrent ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-200'">{{ s.deviceName || 'Unknown device' }}</p>
                          <span v-if="s.isCurrent" class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex-shrink-0">current</span>
                        </div>
                        <div class="mt-1 space-y-0.5">
                          <p v-if="s.location || s.ipAddress" class="text-xs text-gray-500 dark:text-gray-500 truncate">{{ s.location || s.ipAddress }}</p>
                          <p class="text-xs text-gray-400 dark:text-gray-600">Last active {{ formatSessionDate(s.lastUsedAt) }} · Opened {{ formatSessionDate(s.createdAt) }}</p>
                          <p v-if="s.expiresAt" class="text-xs text-gray-400 dark:text-gray-600">Expires {{ formatSessionDate(s.expiresAt) }}</p>
                        </div>
                      </div>
                      <UiButton v-if="!s.isCurrent" variant="ghost" color="red" size="xs" icon-only :disabled="savingSessions" class="flex-shrink-0" title="Close session" @click="closeSession(s.id)">
                        <Icon name="mdi:close" class="w-4 h-4" />
                      </UiButton>
                    </div>
                  </div>
                </div>
                <div v-if="!sessions.length" class="text-center py-8">
                  <Icon name="mdi:devices" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p class="text-sm text-gray-500 dark:text-gray-500">No active sessions</p>
                </div>
              </template>
            </div>
          </div>

          <!-- ===== Shared Notes ===== -->
          <div v-if="displayedSection === 'shared'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:share-variant-outline" title="Shared Notes" description="Manage your shared notes" />
              <div v-if="loadingShared" class="flex items-center justify-center py-8">
                <Icon name="mdi:loading" class="w-6 h-6 text-gray-400 animate-spin" />
              </div>
              <template v-else-if="sharedNotes.length">
                <div class="space-y-2">
                  <div v-for="sn in sharedNotes" :key="sn.hash" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                    :class="sn.isActive ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50 opacity-60'">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ sn.title || 'Untitled' }}</p>
                        <span v-if="!sn.isActive" class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">unshared</span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {{ sn.anonymous ? 'Anonymous' : '' }}{{ sn.anonymous && sn.expiresAt ? ' · ' : '' }}{{ formatExpiry(sn.expiresAt) }}{{ sn.collectAnalytics ? ' · Analytics' : '' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-0.5 flex-shrink-0">
                      <UiButton v-if="sn.collectAnalytics" variant="ghost" color="primary" size="xs" icon-only title="View analytics" @click="openAnalytics(sn.hash)"><Icon name="mdi:chart-bar" class="w-4 h-4" /></UiButton>
                      <UiButton variant="ghost" color="primary" size="xs" icon-only title="Copy link" @click="copySharedLink(sn.hash)"><Icon :name="copiedHash === sn.hash ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" /></UiButton>
                      <UiButton variant="ghost" color="red" size="xs" icon-only :disabled="!sn.isActive" :title="sn.isActive ? 'Stop sharing' : 'Already unshared'" @click="handleUnshare(sn.hash)"><Icon name="mdi:link-variant-off" class="w-4 h-4" /></UiButton>
                      <UiButton variant="ghost" color="red" size="xs" icon-only title="Delete permanently" @click="handlePurge(sn.hash)"><Icon name="mdi:delete-outline" class="w-4 h-4" /></UiButton>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="text-center py-8">
                <Icon name="mdi:share-variant-outline" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p class="text-sm text-gray-500 dark:text-gray-500">No shared notes</p>
              </div>
            </div>
          </div>

          <!-- ===== Danger Zone ===== -->
          <div v-if="displayedSection === 'danger'" class="p-5 md:p-8">
            <div class="max-w-2xl mx-auto">
              <SettingsSectionHeader icon="mdi:alert-outline" title="Danger Zone" description="Irreversible account actions" />
              <UiListMenu preset="settings">
                <div class="p-4">
                  <p class="text-xs text-gray-500 dark:text-gray-500 mb-3">These actions are irreversible. Your password is required to confirm.</p>
                  <UiFormField label="Confirm Password"><UiInput v-model="dangerPassword" type="password" :validate="false" /></UiFormField>
                  <div v-if="confirmingAction" class="rounded-lg border p-4 space-y-3 mt-3"
                    :class="confirmingAction === 'data' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'">
                    <div class="flex gap-2.5">
                      <Icon :name="confirmingAction === 'data' ? 'mdi:database-remove-outline' : 'mdi:account-remove-outline'" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="confirmingAction === 'data' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'" />
                      <div class="text-xs space-y-1.5">
                        <p class="font-semibold" :class="confirmingAction === 'data' ? 'text-amber-800 dark:text-amber-200' : 'text-red-800 dark:text-red-200'">{{ confirmingAction === 'data' ? 'Reset account data?' : 'Delete your account?' }}</p>
                        <p :class="confirmingAction === 'data' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'" class="leading-relaxed">{{ confirmingAction === 'data' ? 'This will permanently delete all your notes, shared notes, and related data. This cannot be undone.' : 'This will permanently delete your account and all associated data.' }}</p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <UiButton variant="outline" color="gray" class="flex-1" @click="confirmingAction = null">Cancel</UiButton>
                      <UiButton variant="solid" :color="confirmingAction === 'data' ? 'amber' : 'red'" :loading="profileSaving" class="flex-1" @click="executeConfirmedAction">{{ confirmingAction === 'data' ? 'Delete All Data' : 'Delete Account' }}</UiButton>
                    </div>
                  </div>
                  <div v-if="!confirmingAction" class="space-y-3 mt-3">
                    <UiButton variant="solid" color="amber" block :loading="profileSaving" :disabled="!dangerPassword" @click="confirmingAction = 'data'">
                      <Icon v-if="!profileSaving" name="mdi:database-remove-outline" class="w-4 h-4" /> Delete All Data
                    </UiButton>
                    <p class="text-xs text-gray-500 dark:text-gray-500">Resets your account. All notes and data permanently deleted.</p>
                    <UiButton variant="solid" color="red" block :loading="profileSaving" :disabled="!dangerPassword" @click="confirmingAction = 'account'">
                      <Icon v-if="!profileSaving" name="mdi:account-remove-outline" class="w-4 h-4" /> Delete Account
                    </UiButton>
                    <p class="text-xs text-gray-500 dark:text-gray-500">Permanently deletes your account and all data. Cannot be undone.</p>
                  </div>
                </div>
              </UiListMenu>
            </div>
          </div>

          </div><!-- /transition wrapper -->
        </div>
      </div>

      <!-- Footer -->
      <div class="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-925 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <UiButton variant="text" color="gray" size="sm" @click="resetAll">Reset to defaults</UiButton>
        <p class="text-xs text-gray-500 dark:text-gray-400">Saved automatically</p>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
import { LOCALE_PRESETS } from '~/composables/useLocalePreferences'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialSection: { type: String, default: null },
  // Locale preferences
  preferences: { type: Object, required: true },
  applyPreset: { type: Function, required: true },
  setPreference: { type: Function, required: true },
  getActivePreset: { type: Function, required: true },
  save: { type: Function, required: true },
  reset: { type: Function, required: true },
  // Profile
  user: { type: Object, default: null },
  lastSyncedAt: { type: String, default: null },
  authHeaders: { type: Object, default: () => ({}) },
  onDeleteData: { type: Function, default: null },
  onDeleteAccount: { type: Function, default: null },
})

const emit = defineEmits([
  'close',
  'relaunch-wizard',
  'update-profile',
  'change-password',
  'logout',
  'unshare',
  'open-analytics',
  'sync-now',
  'show-notes',
])

// ── Navigation state ──
const activeSection = ref(null)
const displayedSection = ref(null)
const slideDirection = ref('down')
const searchQuery = ref('')
const isMobile = ref(false)
const contentPanelRef = ref(null)
const profileSubSection = ref(null) // 'edit' | 'password' | 'avatar' | null

// Select refs for row-click-to-open
const selectLocale = ref(null)
const selectVolume = ref(null)
const selectFuelEconomy = ref(null)
const selectDistance = ref(null)
const selectTemperature = ref(null)
const selectDateFormat = ref(null)
const selectTimeFormat = ref(null)
const selectNumberFormat = ref(null)
const selectFontFamily = ref(null)
const selectLineNumbers = ref(null)
const selectLineHighlight = ref(null)
const selectCursorStyle = ref(null)
const selectAutoCloseBrackets = ref(null)
const selectPrecisionMode = ref(null)
const selectRoundingMode = ref(null)
const selectCopyAnimation = ref(null)
const selectUpdateInterval = ref(null)
const selectSessionDuration = ref(null)
const selectLockMethod = ref(null)
const selectBiometricsFallback = ref(null)
const selectLockAfter = ref(null)

const checkMobile = () => { isMobile.value = window.innerWidth < 768 }

const sections = [
  { id: 'locales', label: 'Locales', icon: 'mdi:earth', description: 'Region & formats', keywords: 'locale language preset volume fuel economy distance temperature date time number format region' },
  { id: 'typography', label: 'Typography', icon: 'mdi:format-font', description: 'Font & sizing', keywords: 'font family size line height ligatures typography text' },
  { id: 'layout', label: 'Layout', icon: 'mdi:page-layout-body', description: 'Gutters & visual aids', keywords: 'layout line numbers word wrap folding highlight' },
  { id: 'cursor', label: 'Cursor & Scrolling', icon: 'mdi:cursor-text', description: 'Cursor & scroll', keywords: 'cursor style scroll past end' },
  { id: 'behaviour', label: 'Behaviour', icon: 'mdi:cog-outline', description: 'Editing defaults', keywords: 'behaviour auto close brackets tab size indentation' },
  { id: 'results', label: 'Results & Display', icon: 'mdi:calculator-variant-outline', description: 'Precision & output', keywords: 'results display precision decimal significant copy animation code blocks' },
  { id: 'general', label: 'General', icon: 'mdi:tune-variant', description: 'App settings', keywords: 'general welcome wizard relaunch setup update check interval version' },
  // Account sections (separated visually in sidebar)
  { id: 'profile', label: 'Profile', icon: 'mdi:account-circle-outline', description: 'Account info', keywords: 'profile account name email avatar photo' },
  { id: 'security', label: 'Security', icon: 'mdi:shield-lock-outline', description: 'Lock & recovery', keywords: 'security session app lock pin password biometrics recovery privacy screen' },
  { id: 'sessions', label: 'Sessions', icon: 'mdi:devices', description: 'Active devices', keywords: 'sessions devices logged in active' },
  { id: 'shared', label: 'Shared Notes', icon: 'mdi:share-variant-outline', description: 'Manage shares', keywords: 'shared notes links sharing analytics' },
  { id: 'danger', label: 'Danger Zone', icon: 'mdi:alert-outline', description: 'Delete data', keywords: 'danger delete account data reset destroy' },
]

// ── Locale presets ──
const presets = LOCALE_PRESETS
const presetEmojis = { UK: '🇬🇧', US: '🇺🇸', ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', JP: '🇯🇵' }
const presetLocaleMap = { UK: 'en-GB', US: 'en-GB', ES: 'es-ES', FR: 'en-GB', DE: 'en-GB', JP: 'en-GB' }
const activePreset = computed(() => props.getActivePreset())

const activeSectionLabel = computed(() => {
  const s = sections.find((s) => s.id === activeSection.value)
  return s ? s.label : 'Settings'
})

// ── Search & filtering ──
const filteredSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sections
  return sections.filter((s) => s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q))
})

watch(filteredSections, (filtered) => {
  if (searchQuery.value && filtered.length === 1) activeSection.value = filtered[0].id
})

const selectSection = (id) => {
  if (id === activeSection.value) return
  profileSubSection.value = null

  // On mobile, switching between sections should also slide horizontally
  if (isMobile.value && activeSection.value) {
    slideDirection.value = sectionIndex(id) > sectionIndex(activeSection.value) ? 'right' : 'left'
    transitionState.value = 'leaving'
    const enterDir = slideDirection.value
    setTimeout(() => {
      activeSection.value = id
      displayedSection.value = id
      if (contentPanelRef.value) contentPanelRef.value.scrollTop = 0
      slideDirection.value = enterDir
      transitionState.value = 'entering-start'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          transitionState.value = 'entering'
          setTimeout(() => { transitionState.value = 'idle' }, 200)
        })
      })
    }, 200)
  } else {
    activeSection.value = id
  }

  searchQuery.value = ''
  // Load data for sections that need it
  if (id === 'sessions') loadSessions()
  if (id === 'shared') loadSharedNotes()
}

const sectionIndex = (id) => sections.findIndex((s) => s.id === id)

// ── Transition ──
const transitionState = ref('idle')
const mobileGoingBack = ref(false)

watch(activeSection, (newId, oldId) => {
  const mobile = isMobile.value

  // Mobile: entering a section (from sidebar) or going back (to sidebar)
  if (mobile) {
    const goingBack = mobileGoingBack.value
    mobileGoingBack.value = false

    if (!oldId && newId) {
      // Entering section from sidebar — slide in from right
      slideDirection.value = 'right'
      displayedSection.value = newId
      transitionState.value = 'entering-start'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          transitionState.value = 'entering'
          setTimeout(() => { transitionState.value = 'idle' }, 200)
        })
      })
      return
    }
    if (oldId && !newId && goingBack) {
      // Going back to sidebar — slide out to right
      slideDirection.value = 'left'
      transitionState.value = 'leaving'
      setTimeout(() => {
        displayedSection.value = null
        transitionState.value = 'idle'
      }, 200)
      return
    }
  }

  // Desktop or section-to-section switch
  if (!oldId || !newId) {
    displayedSection.value = newId
    transitionState.value = 'idle'
    return
  }
  slideDirection.value = sectionIndex(newId) > sectionIndex(oldId) ? 'down' : 'up'
  transitionState.value = 'leaving'
  setTimeout(() => {
    displayedSection.value = newId
    if (contentPanelRef.value) contentPanelRef.value.scrollTop = 0
    transitionState.value = 'entering-start'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionState.value = 'entering'
        setTimeout(() => { transitionState.value = 'idle' }, 200)
      })
    })
  }, 150)
}, { immediate: true })

const sectionTransitionClasses = computed(() => {
  const dir = slideDirection.value
  const mobile = isMobile.value

  // Mobile horizontal slide
  if (mobile && (dir === 'right' || dir === 'left')) {
    switch (transitionState.value) {
      case 'leaving': return dir === 'left'
        ? 'transition-all duration-200 ease-in opacity-0 translate-x-8'
        : 'transition-all duration-200 ease-in opacity-0 -translate-x-8'
      case 'entering-start': return dir === 'right'
        ? 'opacity-0 translate-x-8'
        : 'opacity-0 -translate-x-8'
      case 'entering': return 'transition-all duration-200 ease-out opacity-100 translate-x-0'
      default: return 'opacity-100 translate-x-0'
    }
  }

  // Desktop vertical slide
  switch (transitionState.value) {
    case 'leaving': return dir === 'down' ? 'transition-all duration-150 ease-in opacity-0 -translate-y-4' : 'transition-all duration-150 ease-in opacity-0 translate-y-4'
    case 'entering-start': return dir === 'down' ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-4'
    case 'entering': return 'transition-all duration-200 ease-out opacity-100 translate-y-0'
    default: return 'opacity-100 translate-y-0'
  }
})

const mobileBack = () => {
  if (profileSubSection.value) { profileSubSection.value = null; return }
  if (activeSection.value && isMobile.value) { mobileGoingBack.value = true; activeSection.value = null } else { closeModal() }
}

// ── Language ──
const { locale, locales, setLocale } = useI18n()
const availableLocales = computed(() => locales.value)
const currentLocaleCode = computed(() => locale.value)
const changeLocale = (code) => setLocale(code)
const getLanguageEmoji = (code) => {
  const map = { 'en-GB': '🇬🇧', 'en-US': '🇺🇸', 'es-ES': '🇪🇸', 'fr-FR': '🇫🇷', 'de-DE': '🇩🇪', 'ja-JP': '🇯🇵', 'it-IT': '🇮🇹', 'pt-PT': '🇵🇹', 'pt-BR': '🇧🇷', 'zh-CN': '🇨🇳', 'ko-KR': '🇰🇷', 'ru-RU': '🇷🇺' }
  return map[code] || '🌐'
}

const selectPreset = (name) => {
  props.applyPreset(name)
  const targetLocale = presetLocaleMap[name]
  if (targetLocale && availableLocales.value.some((l) => l.code === targetLocale)) setLocale(targetLocale)
  props.save()
}
const onSettingChange = () => props.save()
const resetAll = () => { props.reset() }

// ── Profile state ──
const toast = useToast()
const profileSaving = ref(false)
const editName = ref('')
const editEmail = ref('')
const avatarImageSrc = ref(null)
const croppedAvatarDataUrl = ref(null)
const editorCanvasSize = computed(() => typeof window === 'undefined' ? 220 : Math.min(220, window.innerWidth - 80))
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const reEncryptProgress = ref(null)
const dangerPassword = ref('')
const confirmingAction = ref(null)

// Shared notes
const sharedNotes = ref([])
const loadingShared = ref(false)
const { apiFetch, apiUrl } = useApi()

// Privacy
const privacyNoTracking = ref(true)
const savingPrivacy = ref(false)

// Privacy Screen
const { enabled: privacyScreenEnabled, isNative: isNativePlatform, loadFromUser: loadPrivacyScreen, toggle: togglePrivacyScreenSetting } = usePrivacyScreen()
const savingPrivacyScreen = ref(false)

// Security
const passwordRecoveryEnabled = ref(false)
const savingSecurity = ref(false)
const confirmingRecoveryEnable = ref(false)
const sessionDuration = ref(604800)
const savingSessionDuration = ref(false)

// Sessions
const sessions = ref([])
const loadingSessions = ref(false)
const savingSessions = ref(false)

// App Lock
const { settings: appLockSettings, availableBiometrics: appLockAvailableBiometrics, biometricError, updateSettings: commitAppLock, disable: disableAppLock, detectBiometrics } = useAppLock()

const draft = reactive({
  enabled: false, method: 'pin', pin: '', pinConfirm: '', password: '', passwordConfirm: '', timeout: 0, biometricsFallback: 'pin', selectedBiometrics: [],
})

const resetDraft = () => {
  draft.enabled = appLockSettings.enabled; draft.method = appLockSettings.method
  draft.pin = ''; draft.pinConfirm = ''; draft.password = ''; draft.passwordConfirm = ''
  draft.timeout = appLockSettings.timeout; draft.biometricsFallback = appLockSettings.biometricsFallback
  draft.selectedBiometrics = [...(appLockSettings.selectedBiometrics || [])]
}

const appLockMethodOptions = computed(() => {
  const opts = [{ value: 'pin', label: 'PIN' }, { value: 'password', label: 'Password' }]
  if (appLockAvailableBiometrics.value.length > 0) opts.push({ value: 'biometrics', label: 'Biometrics' })
  return opts
})

const draftShowPin = computed(() => draft.method === 'pin' || (draft.method === 'biometrics' && draft.biometricsFallback === 'pin'))
const draftShowPassword = computed(() => draft.method === 'password' || (draft.method === 'biometrics' && draft.biometricsFallback === 'password'))
const showBiometricsChangeWarning = computed(() => appLockSettings.method === 'biometrics' && draft.method !== 'biometrics' && appLockAvailableBiometrics.value.length === 0)
const fallbackGlow = ref(false)

watch(() => draft.method, () => {
  if (showBiometricsChangeWarning.value) {
    fallbackGlow.value = false
    setTimeout(() => { fallbackGlow.value = true }, 100)
    setTimeout(() => { fallbackGlow.value = false }, 1100)
  }
})

const draftHasChanges = computed(() => {
  if (draft.enabled !== appLockSettings.enabled) return true
  if (!draft.enabled) return false
  if (draft.method !== appLockSettings.method || draft.timeout !== appLockSettings.timeout || draft.biometricsFallback !== appLockSettings.biometricsFallback) return true
  if (JSON.stringify(draft.selectedBiometrics) !== JSON.stringify(appLockSettings.selectedBiometrics || [])) return true
  if (draftShowPin.value && draft.pin.length === 4 && draft.pin !== appLockSettings.pin) return true
  if (draftShowPassword.value && draft.password.length >= 1 && draft.password !== appLockSettings.password) return true
  return false
})

const canSaveAppLock = computed(() => {
  if (!draftHasChanges.value) return false
  if (!draft.enabled) return true
  if (draftShowPin.value) {
    const hasExisting = appLockSettings.pin?.length === 4
    const started = draft.pin.length > 0 || draft.pinConfirm.length > 0
    if (started) { if (draft.pin.length !== 4 || draft.pin !== draft.pinConfirm) return false } else if (!hasExisting) return false
  }
  if (draftShowPassword.value) {
    const hasExisting = appLockSettings.password?.length >= 1
    const started = draft.password.length > 0 || draft.passwordConfirm.length > 0
    if (started) { if (draft.password.length < 1 || draft.password !== draft.passwordConfirm) return false } else if (!hasExisting) return false
  }
  return true
})

const toggleDraftBiometric = (id) => {
  const idx = draft.selectedBiometrics.indexOf(id)
  if (idx >= 0) { if (draft.selectedBiometrics.length <= 1) return; draft.selectedBiometrics.splice(idx, 1) }
  else draft.selectedBiometrics.push(id)
}

const onDraftMethodChange = (method) => {
  draft.method = method
  if (method === 'biometrics') draft.selectedBiometrics = appLockAvailableBiometrics.value.map((b) => b.id)
  draft.pin = ''; draft.pinConfirm = ''; draft.password = ''; draft.passwordConfirm = ''
}

const cancelProfileSubSection = () => {
  avatarImageSrc.value = null
  croppedAvatarDataUrl.value = null
  profileSubSection.value = null
}

const enterEditProfile = () => {
  editName.value = props.user?.name || ''
  editEmail.value = props.user?.email || ''
  profileSubSection.value = 'edit'
}

const showProfileFeedback = (msg, type = 'success') => {
  toast.show(msg, { type: type === 'error' ? 'error' : 'success', icon: type === 'error' ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline' })
}

const profileFormatDate = (iso) => {
  if (!iso) return 'Never'
  const d = new Date(iso); const now = new Date(); const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

// Avatar
const onFileSelect = (file) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { avatarImageSrc.value = reader.result }; reader.readAsDataURL(file) }
const onAvatarCropped = (dataUrl) => { croppedAvatarDataUrl.value = dataUrl }

const saveAvatar = async () => {
  if (!croppedAvatarDataUrl.value) return
  profileSaving.value = true
  try { await emit('update-profile', { avatarUrl: croppedAvatarDataUrl.value }); showProfileFeedback('Avatar updated'); avatarImageSrc.value = null; profileSubSection.value = null }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to update avatar', 'error') }
  finally { profileSaving.value = false }
}

const removeAvatar = async () => {
  profileSaving.value = true
  try { await emit('update-profile', { avatarUrl: '' }); showProfileFeedback('Avatar removed'); profileSubSection.value = null }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to remove avatar', 'error') }
  finally { profileSaving.value = false }
}

const saveProfile = async () => {
  profileSaving.value = true
  try { await emit('update-profile', { name: editName.value, email: editEmail.value }); showProfileFeedback('Profile updated'); profileSubSection.value = null }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to update profile', 'error') }
  finally { profileSaving.value = false }
}

const savePassword = async () => {
  profileSaving.value = true; reEncryptProgress.value = null
  try {
    await emit('change-password', { currentPassword: currentPassword.value, newPassword: newPassword.value, onProgress: (current, total) => { reEncryptProgress.value = { current, total } } })
    showProfileFeedback('Password updated. Please log in again.')
    currentPassword.value = ''; newPassword.value = ''; confirmNewPassword.value = ''; profileSubSection.value = null
  } catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to change password', 'error') }
  finally { profileSaving.value = false; reEncryptProgress.value = null }
}

const handleDeleteData = async () => {
  profileSaving.value = true
  try { await props.onDeleteData(dangerPassword.value); showProfileFeedback('All data deleted — account reset'); dangerPassword.value = ''; confirmingAction.value = null }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to delete data', 'error') }
  finally { profileSaving.value = false }
}

const handleDeleteAccount = async () => {
  profileSaving.value = true
  try { await props.onDeleteAccount(dangerPassword.value) }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to delete account', 'error'); profileSaving.value = false }
}

const executeConfirmedAction = () => { if (confirmingAction.value === 'data') handleDeleteData(); else if (confirmingAction.value === 'account') handleDeleteAccount() }

const saveAppLock = async () => {
  if (!canSaveAppLock.value) return
  if (draftShowPin.value && draft.pin.length > 0 && draft.pin !== draft.pinConfirm) { showProfileFeedback('PINs do not match', 'error'); return }
  if (draftShowPassword.value && draft.password.length > 0 && draft.password !== draft.passwordConfirm) { showProfileFeedback('Passwords do not match', 'error'); return }
  try {
    if (!draft.enabled) { await disableAppLock(); showProfileFeedback('App Lock disabled'); resetDraft(); return }
    const patch = { enabled: true, method: draft.method, timeout: draft.timeout, biometricsFallback: draft.biometricsFallback, selectedBiometrics: [...draft.selectedBiometrics] }
    if (draftShowPin.value && draft.pin.length === 4 && draft.pin === draft.pinConfirm) patch.pin = draft.pin
    if (draftShowPassword.value && draft.password.length >= 1 && draft.password === draft.passwordConfirm) patch.password = draft.password
    await commitAppLock(patch); showProfileFeedback('App Lock settings saved'); resetDraft()
  } catch (err) { showProfileFeedback(err?.data?.statusMessage || err?.message || 'Failed to save App Lock settings', 'error') }
}

// Shared notes
const loadSharedNotes = async () => {
  loadingShared.value = true
  try {
    if (!props.authHeaders?.Authorization) return
    const notes = await apiFetch('/api/share/my', { headers: props.authHeaders })
    const { default: db } = await import('~/db.js')
    const localNotes = await db.notes.toArray()
    const localMap = new Map(localNotes.map((n) => [n.id, n]))
    sharedNotes.value = notes.map((sn) => {
      const local = sn.sourceClientId ? localMap.get(sn.sourceClientId) : null
      const isEncryptedTitle = sn.title && sn.title.startsWith('{') && sn.title.includes('"iv"')
      return { ...sn, title: isEncryptedTitle && local ? local.title || 'Untitled' : sn.title }
    })
  } catch { sharedNotes.value = [] }
  finally { loadingShared.value = false }
}

const { copy: clipboardCopy } = useClipboard()
const copiedHash = ref(null)
const copySharedLink = async (hash) => { const url = apiUrl(`/shared/${hash}`); await clipboardCopy(url); copiedHash.value = hash; setTimeout(() => { copiedHash.value = null }, 2000) }

const handleUnshare = async (hash) => {
  try { await apiFetch(`/api/share/${hash}`, { method: 'DELETE', headers: props.authHeaders }); await loadSharedNotes(); showProfileFeedback('Sharing stopped'); emit('unshare', hash) }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to remove shared note', 'error') }
}

const handlePurge = async (hash) => {
  if (!confirm('Permanently delete this shared note and all its analytics? This cannot be undone.')) return
  try { await apiFetch(`/api/share/${hash}?purge=true`, { method: 'DELETE', headers: props.authHeaders }); await loadSharedNotes(); showProfileFeedback('Shared note deleted'); emit('unshare', hash) }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to delete shared note', 'error') }
}

const openAnalytics = (hash) => { emit('close'); nextTick(() => { emit('open-analytics', hash) }) }

// Privacy
const togglePrivacy = async () => {
  savingPrivacy.value = true; const newVal = !privacyNoTracking.value
  try { await apiFetch('/api/auth/privacy', { method: 'PUT', headers: props.authHeaders, body: { noTracking: newVal } }); privacyNoTracking.value = newVal; showProfileFeedback(newVal ? 'Privacy protection enabled' : 'Privacy protection disabled') }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to update privacy setting', 'error') }
  finally { savingPrivacy.value = false }
}

const togglePrivacyScreen = async () => {
  savingPrivacyScreen.value = true
  try { const newVal = await togglePrivacyScreenSetting({ apiFetch, authHeaders: props.authHeaders }); showProfileFeedback(newVal ? 'Privacy screen enabled' : 'Privacy screen disabled') }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to update privacy screen setting', 'error') }
  finally { savingPrivacyScreen.value = false }
}

const onPasswordRecoveryToggle = () => {
  const newVal = !passwordRecoveryEnabled.value
  if (newVal) { confirmingRecoveryEnable.value = true; return }
  savingSecurity.value = true
  apiFetch('/api/auth/security', { method: 'PUT', headers: props.authHeaders, body: { passwordRecoveryEnabled: false } })
    .then(() => { passwordRecoveryEnabled.value = false; showProfileFeedback('Password recovery disabled') })
    .catch((err) => { showProfileFeedback(err?.data?.statusMessage || 'Failed to update security setting', 'error') })
    .finally(() => { savingSecurity.value = false })
}

const confirmPasswordRecovery = async () => {
  confirmingRecoveryEnable.value = false; savingSecurity.value = true
  try { await apiFetch('/api/auth/security', { method: 'PUT', headers: props.authHeaders, body: { passwordRecoveryEnabled: true } }); passwordRecoveryEnabled.value = true; showProfileFeedback('Password recovery enabled') }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to update security setting', 'error') }
  finally { savingSecurity.value = false }
}

const saveSessionDuration = async () => {
  savingSessionDuration.value = true
  try { await apiFetch('/api/auth/session-duration', { method: 'PUT', headers: props.authHeaders, body: { duration: Number(sessionDuration.value) } }); showProfileFeedback('Session duration updated — takes effect on next login') }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to update session duration', 'error') }
  finally { savingSessionDuration.value = false }
}

// Sessions
const loadSessions = async () => {
  loadingSessions.value = true
  try { if (!props.authHeaders?.Authorization) return; sessions.value = await apiFetch('/api/auth/sessions', { headers: props.authHeaders }) }
  catch { sessions.value = [] }
  finally { loadingSessions.value = false }
}

const closeSession = async (sessionId) => {
  savingSessions.value = true
  try { await apiFetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE', headers: props.authHeaders }); sessions.value = sessions.value.filter((s) => s.id !== sessionId); showProfileFeedback('Session closed') }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to close session', 'error') }
  finally { savingSessions.value = false }
}

const closeOtherSessions = async () => {
  savingSessions.value = true
  try { await apiFetch('/api/auth/sessions', { method: 'DELETE', headers: props.authHeaders }); sessions.value = sessions.value.filter((s) => s.isCurrent); showProfileFeedback('All other sessions closed') }
  catch (err) { showProfileFeedback(err?.data?.statusMessage || 'Failed to close sessions', 'error') }
  finally { savingSessions.value = false }
}

const getDeviceIcon = (deviceName) => {
  if (!deviceName) return 'mdi:help-circle-outline'
  const d = deviceName.toLowerCase()
  if (d.includes('android')) return 'mdi:android'; if (d.includes('ios') || d.includes('iphone') || d.includes('ipad')) return 'mdi:apple'
  if (d.includes('mobile') || d.includes('app')) return 'mdi:cellphone'; if (d.includes('windows')) return 'mdi:microsoft-windows'
  if (d.includes('mac')) return 'mdi:apple'; if (d.includes('linux')) return 'mdi:linux'; return 'mdi:monitor'
}

const formatSessionDate = (iso) => {
  if (!iso) return 'Unknown'; const d = new Date(iso); const now = new Date(); const diff = now - d
  if (diff < 0) { const ahead = -diff; if (ahead < 3600000) return `in ${Math.ceil(ahead / 60000)}m`; if (ahead < 86400000) return `in ${Math.floor(ahead / 3600000)}h`; if (ahead < 7 * 86400000) return `in ${Math.floor(ahead / 86400000)}d`; return d.toLocaleDateString() }
  if (diff < 60000) return 'just now'; if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`; if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`; return d.toLocaleDateString()
}

const formatExpiry = (iso) => { if (!iso) return 'No expiry'; const d = new Date(iso); const now = new Date(); if (d < now) return 'Expired'; const days = Math.ceil((d - now) / 86400000); return days === 1 ? '1 day left' : `${days} days left` }

// ── Lifecycle ──
let biometricPollTimer = null

const closeModal = () => {
  activeSection.value = null; displayedSection.value = null; transitionState.value = 'idle'
  searchQuery.value = ''; profileSubSection.value = null
  confirmingAction.value = null; confirmingRecoveryEnable.value = false
  emit('close')
}

const resetProfileState = () => {
  editName.value = props.user?.name || ''; editEmail.value = props.user?.email || ''
  avatarImageSrc.value = null; croppedAvatarDataUrl.value = null
  currentPassword.value = ''; newPassword.value = ''; confirmNewPassword.value = ''
  dangerPassword.value = ''; confirmingAction.value = null; profileSubSection.value = null
  privacyNoTracking.value = props.user?.privacyNoTracking !== false
  passwordRecoveryEnabled.value = props.user?.passwordRecoveryEnabled === true
  sessionDuration.value = props.user?.sessionDuration || 604800
  loadPrivacyScreen(props.user); resetDraft()
}

const handleEscape = (e) => { if (e.key === 'Escape' && props.isOpen) closeModal() }

onMounted(async () => {
  checkMobile(); window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleEscape)
  await detectBiometrics()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', checkMobile)
  if (biometricPollTimer) { clearInterval(biometricPollTimer); biometricPollTimer = null }
})

watch(activeSection, (section, oldSection) => {
  if (section === 'security') { resetDraft(); biometricPollTimer = setInterval(() => detectBiometrics(), 5000) }
  else if (oldSection === 'security') { if (biometricPollTimer) { clearInterval(biometricPollTimer); biometricPollTimer = null } }
})

watch(() => props.isOpen, (open) => {
  if (open) {
    checkMobile(); resetProfileState()
    const target = props.initialSection || (isMobile.value ? null : 'locales')
    activeSection.value = target
  } else {
    if (biometricPollTimer) { clearInterval(biometricPollTimer); biometricPollTimer = null }
  }
})
</script>
