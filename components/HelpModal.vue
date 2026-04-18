<template>
  <UiModal
    :show="isOpen"
    max-width="5xl"
    padding="md:p-4"
    panel-class="h-screen md:h-[90vh] safe-area-modal rounded-none md:rounded-lg"
    @close="close"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 gap-2"
    >
      <div class="flex items-center gap-2 flex-shrink-0">
        <UiButton
          variant="ghost"
          color="gray"
          icon-only
          :title="showIndex ? 'Hide index' : 'Show index'"
          @click="showIndex = !showIndex"
        >
          <Icon name="mdi:table-of-contents" class="block w-5 h-5" />
        </UiButton>
        <h2
          class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none hidden sm:block"
        >
          {{ $t('help.title') }}
        </h2>
      </div>
      <div class="flex items-center gap-2 min-w-0">
        <div class="relative min-w-0 flex-1">
          <Icon
            name="mdi:magnify"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
          <UiInput
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            :validate="false"
            @keydown.escape="searchQuery = ''"
          />
          <UiButton
            v-if="searchQuery"
            variant="ghost"
            color="gray"
            icon-only
            size="xs"
            class="absolute right-1.5 top-1/2 -translate-y-1/2"
            @click="searchQuery = ''"
          >
            <Icon name="mdi:close" class="block w-4 h-4" />
          </UiButton>
        </div>
        <UiButton variant="ghost" color="gray" icon-only class="flex-shrink-0" @click="close">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>
    </div>

    <!-- Body: Index sidebar + Content -->
    <div class="flex flex-1 overflow-hidden relative">
      <!-- Mobile index overlay backdrop -->
      <div
        v-if="showIndex"
        class="fixed inset-0 bg-black bg-opacity-25 z-10 md:hidden"
        @click="showIndex = false"
      />

      <!-- Index sidebar -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="max-md:-translate-x-full max-md:opacity-0 md:w-0 md:opacity-0"
        enter-to-class="max-md:translate-x-0 max-md:opacity-100 md:w-56 md:opacity-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="max-md:translate-x-0 max-md:opacity-100 md:w-56 md:opacity-100"
        leave-to-class="max-md:-translate-x-full max-md:opacity-0 md:w-0 md:opacity-0"
      >
        <nav
          v-if="showIndex"
          class="absolute md:relative z-20 w-64 md:w-56 flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto"
        >
          <ul class="py-3 px-3 space-y-0.5">
            <li v-for="section in filteredSections" :key="section.id">
              <UiButton
                variant="ghost"
                block
                class="text-left px-3 py-2"
                :class="
                  activeSection === section.id
                    ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'
                "
                @click="scrollTo(section.id)"
              >
                {{ section.label }}
              </UiButton>
            </li>
          </ul>
        </nav>
      </Transition>

      <!-- Content -->
      <div ref="contentRef" class="flex-1 overflow-y-auto p-6 scroll-smooth" @scroll="onScroll">
        <div class="max-w-3xl mx-auto space-y-12" :style="{ paddingBottom: scrollPadding + 'px' }">
          <!-- No results -->
          <div
            v-if="searchQuery && filteredSectionIds.size === 0"
            class="text-center py-12 text-gray-400 dark:text-gray-500"
          >
            <Icon name="mdi:magnify" class="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p class="text-sm">No results for "{{ searchQuery }}"</p>
          </div>

          <!-- Basics -->
          <section v-show="isSectionVisible('basics')" :id="'help-basics'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.basics.title') }}
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>{{ $t('help.basics.desc') }}</p>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                <div>2 + 3 <span class="text-primary-600 dark:text-primary-400">= 5</span></div>
                <div>10 - 4 <span class="text-primary-600 dark:text-primary-400">= 6</span></div>
                <div>6 * 7 <span class="text-primary-600 dark:text-primary-400">= 42</span></div>
                <div>20 / 4 <span class="text-primary-600 dark:text-primary-400">= 5</span></div>
                <div>2 ^ 10 <span class="text-primary-600 dark:text-primary-400">= 1024</span></div>
                <div>17 mod 5 <span class="text-primary-600 dark:text-primary-400">= 2</span></div>
                <div>
                  (2 + 3) * 4 <span class="text-primary-600 dark:text-primary-400">= 20</span>
                </div>
              </div>
              <p class="mt-2">Implicit multiplication:</p>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                <div>6 (3) <span class="text-primary-600 dark:text-primary-400">= 18</span></div>
                <div>(2)(3) <span class="text-primary-600 dark:text-primary-400">= 6</span></div>
              </div>
            </div>
          </section>

          <!-- Operators -->
          <section v-show="isSectionVisible('operators')" :id="'help-operators'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">Operators</h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>Use symbols or natural language:</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Addition:</span> +, plus, and, with
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Subtraction:</span> -, minus, subtract, without
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Multiplication:</span> *, times, multiplied by, mul
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Division:</span> /, divide, divide by
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Exponent:</span> ^
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Modulo:</span> mod
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-2">
                <div>5 plus 3 <span class="text-primary-600 dark:text-primary-400">= 8</span></div>
                <div>
                  10 minus 3 <span class="text-primary-600 dark:text-primary-400">= 7</span>
                </div>
                <div>
                  8 times 9 <span class="text-primary-600 dark:text-primary-400">= 72</span>
                </div>
                <div>
                  20 divide by 4 <span class="text-primary-600 dark:text-primary-400">= 5</span>
                </div>
                <div>
                  10 without 3 <span class="text-primary-600 dark:text-primary-400">= 7</span>
                </div>
                <div>
                  8 multiplied by 9 <span class="text-primary-600 dark:text-primary-400">= 72</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Bitwise -->
          <section v-show="isSectionVisible('bitwise')" :id="'help-bitwise'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              Bitwise Operations
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">AND:</span> &amp;
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">OR:</span> |
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">XOR:</span> xor
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Left Shift:</span> &lt;&lt;
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">Right Shift:</span> &gt;&gt;
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-2">
                <div>
                  12 &amp; 10 <span class="text-primary-600 dark:text-primary-400">= 8</span>
                </div>
                <div>12 | 10 <span class="text-primary-600 dark:text-primary-400">= 14</span></div>
                <div>12 xor 10 <span class="text-primary-600 dark:text-primary-400">= 6</span></div>
                <div>
                  1 &lt;&lt; 4 <span class="text-primary-600 dark:text-primary-400">= 16</span>
                </div>
                <div>
                  16 &gt;&gt; 2 <span class="text-primary-600 dark:text-primary-400">= 4</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Variables -->
          <section v-show="isSectionVisible('variables')" :id="'help-variables'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.variables.title') }}
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>{{ $t('help.variables.desc') }}</p>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                <div>x = 10 <span class="text-primary-600 dark:text-primary-400">= 10</span></div>
                <div>x + 5 <span class="text-primary-600 dark:text-primary-400">= 15</span></div>
                <div class="mt-2">
                  a = 10 <span class="text-primary-600 dark:text-primary-400">= 10</span>
                </div>
                <div>b = 20 <span class="text-primary-600 dark:text-primary-400">= 20</span></div>
                <div>a + b <span class="text-primary-600 dark:text-primary-400">= 30</span></div>
                <div class="mt-2">
                  my_var = 42 <span class="text-primary-600 dark:text-primary-400">= 42</span>
                </div>
                <div>
                  v2 = 100 <span class="text-primary-600 dark:text-primary-400">= 100</span>
                </div>
              </div>
              <p class="text-xs italic mt-2">
                Variable names support letters, numbers, and underscores.
              </p>
            </div>
          </section>

          <!-- Prev & Special Keywords -->
          <section v-show="isSectionVisible('special')" :id="'help-special'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.special.title') }}
            </h3>
            <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  prev — Previous Result
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    20 + 56 <span class="text-primary-600 dark:text-primary-400">= 76</span>
                  </div>
                  <div>
                    prev - 5 <span class="text-primary-600 dark:text-primary-400">= 71</span>
                  </div>
                  <div>
                    prev - 5% <span class="text-primary-600 dark:text-primary-400">= 67.45</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  sum — Sum Lines Above
                </p>
                <p class="text-xs mb-2">
                  Sums all numeric lines above until an empty line or header.
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>10 <span class="text-primary-600 dark:text-primary-400">= 10</span></div>
                  <div>15 <span class="text-primary-600 dark:text-primary-400">= 15</span></div>
                  <div>25 <span class="text-primary-600 dark:text-primary-400">= 25</span></div>
                  <div>sum <span class="text-primary-600 dark:text-primary-400">= 50</span></div>
                  <div class="mt-2 text-gray-500">// With labels and currency</div>
                  <div>
                    Salary: €1457
                    <span class="text-primary-600 dark:text-primary-400">= 1457 EUR</span>
                  </div>
                  <div>
                    Food: -€200
                    <span class="text-primary-600 dark:text-primary-400">= -200 EUR</span>
                  </div>
                  <div>
                    Fuel: -€100
                    <span class="text-primary-600 dark:text-primary-400">= -100 EUR</span>
                  </div>
                  <div>
                    sum <span class="text-primary-600 dark:text-primary-400">= 1157 EUR</span>
                  </div>
                  <div class="mt-2 text-gray-500">// Sum with operations</div>
                  <div>100 <span class="text-primary-600 dark:text-primary-400">= 100</span></div>
                  <div>200 <span class="text-primary-600 dark:text-primary-400">= 200</span></div>
                  <div>
                    sum - 10% <span class="text-primary-600 dark:text-primary-400">= 270</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  sub — Subtract Lines Above
                </p>
                <p class="text-xs mb-2">
                  Takes the first line as the starting value and subtracts all subsequent lines from
                  it. Useful for tracking expenses against income.
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>2 <span class="text-primary-600 dark:text-primary-400">= 2</span></div>
                  <div>3 <span class="text-primary-600 dark:text-primary-400">= 3</span></div>
                  <div>4 <span class="text-primary-600 dark:text-primary-400">= 4</span></div>
                  <div>
                    sub <span class="text-primary-600 dark:text-primary-400">= -5</span>
                    <span class="text-gray-500">// 2 - 3 - 4</span>
                  </div>
                  <div class="mt-2 text-gray-500">// Budget tracking</div>
                  <div>
                    Salary: €1457
                    <span class="text-primary-600 dark:text-primary-400">= 1457 EUR</span>
                  </div>
                  <div>
                    Food: €200 <span class="text-primary-600 dark:text-primary-400">= 200 EUR</span>
                  </div>
                  <div>
                    Fuel: €100 <span class="text-primary-600 dark:text-primary-400">= 100 EUR</span>
                  </div>
                  <div>
                    Remaining: sub
                    <span class="text-primary-600 dark:text-primary-400">= 1157 EUR</span>
                  </div>
                </div>
                <p class="text-xs italic mt-2">
                  Unlike sum, expenses don't need a minus sign — sub automatically subtracts them
                  from the first value.
                </p>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  average / avg — Average Lines Above
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>10 <span class="text-primary-600 dark:text-primary-400">= 10</span></div>
                  <div>20 <span class="text-primary-600 dark:text-primary-400">= 20</span></div>
                  <div>30 <span class="text-primary-600 dark:text-primary-400">= 30</span></div>
                  <div>
                    average <span class="text-primary-600 dark:text-primary-400">= 20</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Percentages -->
          <section v-show="isSectionVisible('percentages')" :id="'help-percentages'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.percentages.title') }}
            </h3>
            <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Contextual (Addition &amp; Subtraction)
                </p>
                <p class="text-xs mb-2">
                  Percentage is applied to the base value, then added/subtracted:
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    100 + 20% <span class="text-primary-600 dark:text-primary-400">= 120</span>
                  </div>
                  <div>
                    100 - 15% <span class="text-primary-600 dark:text-primary-400">= 85</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Literal (Multiplication &amp; Division)
                </p>
                <p class="text-xs mb-2">Percentage is treated as a decimal:</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    100 * 5% <span class="text-primary-600 dark:text-primary-400">= 5</span>
                    <span class="text-gray-500">// 100 × 0.05</span>
                  </div>
                  <div>
                    100 / 5% <span class="text-primary-600 dark:text-primary-400">= 2000</span>
                    <span class="text-gray-500">// 100 ÷ 0.05</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Explicit Keywords</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    20% of 100 <span class="text-primary-600 dark:text-primary-400">= 20</span>
                  </div>
                  <div>
                    5% on 30 <span class="text-primary-600 dark:text-primary-400">= 31.5</span>
                    <span class="text-gray-500">// add 5%</span>
                  </div>
                  <div>
                    6% off 40 <span class="text-primary-600 dark:text-primary-400">= 37.6</span>
                    <span class="text-gray-500">// subtract 6%</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Reverse Percentages
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    50 as a % of 100
                    <span class="text-primary-600 dark:text-primary-400">= 50%</span>
                  </div>
                  <div>
                    70 as a % on 20
                    <span class="text-primary-600 dark:text-primary-400">= 250%</span>
                  </div>
                  <div>
                    5% of what is 6
                    <span class="text-primary-600 dark:text-primary-400">= 120</span>
                  </div>
                  <div>
                    5% on what is 6
                    <span class="text-primary-600 dark:text-primary-400">= 5.71</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Percentage Exponentiation (Compound Interest)
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    interest = 110%
                    <span class="text-primary-600 dark:text-primary-400">= 1.1</span>
                  </div>
                  <div>
                    starting = 1000
                    <span class="text-primary-600 dark:text-primary-400">= 1000</span>
                  </div>
                  <div>
                    years = 3 <span class="text-primary-600 dark:text-primary-400">= 3</span>
                  </div>
                  <div>
                    starting * interest ^ years
                    <span class="text-primary-600 dark:text-primary-400">= 1331</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Scales -->
          <section v-show="isSectionVisible('scales')" :id="'help-scales'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">Scales</h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>Use shorthand for large numbers:</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">k</span> / thousand = 10³
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">M</span> / million = 10⁶
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">billion</span> = 10⁹
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">trillion</span> = 10¹²
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-2">
                <div>5k <span class="text-primary-600 dark:text-primary-400">= 5000</span></div>
                <div>2M <span class="text-primary-600 dark:text-primary-400">= 2000000</span></div>
                <div>
                  1 billion <span class="text-primary-600 dark:text-primary-400">= 1000000000</span>
                </div>
                <div>
                  1.5M - 500k <span class="text-primary-600 dark:text-primary-400">= 1000000</span>
                </div>
                <div>
                  2k + 500 <span class="text-primary-600 dark:text-primary-400">= 2500</span>
                </div>
                <div class="mt-2 text-gray-500">// With units</div>
                <div>
                  2k meters in km <span class="text-primary-600 dark:text-primary-400">= 2 km</span>
                </div>
                <div>
                  500k bytes in MB
                  <span class="text-primary-600 dark:text-primary-400">= 0.5 MB</span>
                </div>
                <div class="mt-2 text-gray-500">// With currency</div>
                <div>
                  $2k <span class="text-primary-600 dark:text-primary-400">= 2000 USD</span>
                </div>
                <div>
                  €3M <span class="text-primary-600 dark:text-primary-400">= 3000000 EUR</span>
                </div>
                <div>
                  £1 million
                  <span class="text-primary-600 dark:text-primary-400">= 1000000 GBP</span>
                </div>
                <div>
                  $2k in EUR <span class="text-primary-600 dark:text-primary-400">= 1740 EUR</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Currency -->
          <section v-show="isSectionVisible('currency')" :id="'help-currency'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.currency.title') }}
            </h3>
            <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <p>{{ $t('help.currency.desc') }}</p>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Symbol &amp; Code Formats
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    $100 <span class="text-primary-600 dark:text-primary-400">= 100 USD</span>
                  </div>
                  <div>
                    €50 <span class="text-primary-600 dark:text-primary-400">= 50 EUR</span>
                  </div>
                  <div>
                    £100 <span class="text-primary-600 dark:text-primary-400">= 100 GBP</span>
                  </div>
                  <div>
                    100 USD <span class="text-primary-600 dark:text-primary-400">= 100 USD</span>
                  </div>
                  <div>
                    56 EUR <span class="text-primary-600 dark:text-primary-400">= 56 EUR</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Conversion</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    $100 in EUR <span class="text-primary-600 dark:text-primary-400">= 87 EUR</span>
                  </div>
                  <div>
                    100 USD in GBP
                    <span class="text-primary-600 dark:text-primary-400">= 75 GBP</span>
                  </div>
                  <div>
                    $30 in euro
                    <span class="text-primary-600 dark:text-primary-400">= 26.1 EUR</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Mixed Currency Arithmetic
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    $30 + €20
                    <span class="text-primary-600 dark:text-primary-400">= 52.98 USD</span>
                  </div>
                  <div>
                    $20 + 56 EUR
                    <span class="text-primary-600 dark:text-primary-400">= 68.72 USD</span>
                  </div>
                  <div>
                    $100 + €50 in GBP
                    <span class="text-primary-600 dark:text-primary-400">= 118.5 GBP</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Variables with Currency
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    v = $20 <span class="text-primary-600 dark:text-primary-400">= 20 USD</span>
                  </div>
                  <div>
                    v + $10 <span class="text-primary-600 dark:text-primary-400">= 30 USD</span>
                  </div>
                  <div>
                    v times 7 <span class="text-primary-600 dark:text-primary-400">= 140 USD</span>
                  </div>
                  <div class="mt-2">
                    a = €100 <span class="text-primary-600 dark:text-primary-400">= 100 EUR</span>
                  </div>
                  <div>
                    a in GBP <span class="text-primary-600 dark:text-primary-400">= 86.21 GBP</span>
                  </div>
                </div>
              </div>
              <p class="text-xs mt-2">
                Supported symbols: $ € £ ¥ ₹ ₽ ₩ ₺ ₿ and 50+ ISO codes (USD, EUR, GBP, JPY, CAD,
                AUD, CHF, CNY, BRL, etc.)
              </p>
              <p class="text-xs">
                Common names also work: euro, pound, yen, won, rupee, franc, yuan, bitcoin
              </p>
            </div>
          </section>

          <!-- Units -->
          <section v-show="isSectionVisible('units')" :id="'help-units'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.units.title') }}
            </h3>
            <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <p>
                {{ $t('help.units.desc') }} Units work with or without spaces (e.g., 100km or 100
                km).
              </p>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Length</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    1 km in m <span class="text-primary-600 dark:text-primary-400">= 1000 m</span>
                  </div>
                  <div>
                    1 mile in km
                    <span class="text-primary-600 dark:text-primary-400">= 1.609 km</span>
                  </div>
                  <div>
                    1 foot in cm
                    <span class="text-primary-600 dark:text-primary-400">= 30.48 cm</span>
                  </div>
                  <div>
                    1 inch in cm
                    <span class="text-primary-600 dark:text-primary-400">= 2.54 cm</span>
                  </div>
                  <div>
                    1 yard in m
                    <span class="text-primary-600 dark:text-primary-400">= 0.9144 m</span>
                  </div>
                  <div>
                    1 km + 500 m in m
                    <span class="text-primary-600 dark:text-primary-400">= 1500 m</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Weight</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    1 kg in lb
                    <span class="text-primary-600 dark:text-primary-400">= 2.205 lb</span>
                  </div>
                  <div>
                    1 oz in g <span class="text-primary-600 dark:text-primary-400">= 28.35 g</span>
                  </div>
                  <div>
                    1 tonne in kg
                    <span class="text-primary-600 dark:text-primary-400">= 1000 kg</span>
                  </div>
                  <div>
                    1 stone in lb
                    <span class="text-primary-600 dark:text-primary-400">= 14 lb</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Volume</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    1 gallon in liters
                    <span class="text-primary-600 dark:text-primary-400">= 3.785 liters</span>
                  </div>
                  <div>
                    1 cup in ml <span class="text-primary-600 dark:text-primary-400">= 237 ml</span>
                  </div>
                  <div>
                    1 tablespoon in ml
                    <span class="text-primary-600 dark:text-primary-400">= 14.79 ml</span>
                  </div>
                  <div>
                    1 teaspoon in ml
                    <span class="text-primary-600 dark:text-primary-400">= 4.93 ml</span>
                  </div>
                  <div>
                    25 ml in tea spoons
                    <span class="text-primary-600 dark:text-primary-400">= 5.07 tea spoons</span>
                  </div>
                  <div>
                    1 pint in ml
                    <span class="text-primary-600 dark:text-primary-400">= 473 ml</span>
                  </div>
                  <div>
                    1 cbm in liters
                    <span class="text-primary-600 dark:text-primary-400">= 1000 liters</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Temperature</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    0 celsius in fahrenheit
                    <span class="text-primary-600 dark:text-primary-400">= 32 fahrenheit</span>
                  </div>
                  <div>
                    100 celsius in fahrenheit
                    <span class="text-primary-600 dark:text-primary-400">= 212 fahrenheit</span>
                  </div>
                  <div>
                    32 fahrenheit in celsius
                    <span class="text-primary-600 dark:text-primary-400">= 0 celsius</span>
                  </div>
                  <div>
                    0 celsius in kelvin
                    <span class="text-primary-600 dark:text-primary-400">= 273.15 kelvin</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Area</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    1 acre in sqm
                    <span class="text-primary-600 dark:text-primary-400">= 4046.86 sqm</span>
                  </div>
                  <div>
                    1 hectare in acres
                    <span class="text-primary-600 dark:text-primary-400">= 2.471 acres</span>
                  </div>
                  <div>
                    1 sqft in sqm
                    <span class="text-primary-600 dark:text-primary-400">= 0.0929 sqm</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Speed</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    100 kph in mph
                    <span class="text-primary-600 dark:text-primary-400">= 62.14 mph</span>
                  </div>
                  <div>
                    60 mph in kph
                    <span class="text-primary-600 dark:text-primary-400">= 96.56 kph</span>
                  </div>
                  <div>
                    1 knot in kph
                    <span class="text-primary-600 dark:text-primary-400">= 1.852 kph</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Time</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    1 hour in minutes
                    <span class="text-primary-600 dark:text-primary-400">= 60 minutes</span>
                  </div>
                  <div>
                    1 day in hours
                    <span class="text-primary-600 dark:text-primary-400">= 24 hours</span>
                  </div>
                  <div>
                    1 week in days
                    <span class="text-primary-600 dark:text-primary-400">= 7 days</span>
                  </div>
                  <div>
                    1 year in days
                    <span class="text-primary-600 dark:text-primary-400">= 365 days</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Data</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    1 GB in MB <span class="text-primary-600 dark:text-primary-400">= 1000 MB</span>
                  </div>
                  <div>
                    1 TB in GB <span class="text-primary-600 dark:text-primary-400">= 1000 GB</span>
                  </div>
                  <div>
                    1 GiB in MiB
                    <span class="text-primary-600 dark:text-primary-400">= 1024 MiB</span>
                  </div>
                  <div>
                    1 byte in bits
                    <span class="text-primary-600 dark:text-primary-400">= 8 bits</span>
                  </div>
                  <div>
                    1 KiB in bytes
                    <span class="text-primary-600 dark:text-primary-400">= 1024 bytes</span>
                  </div>
                </div>
                <p class="text-xs italic mt-2">
                  KB/MB/GB use 1000 (SI). KiB/MiB/GiB use 1024 (binary).
                </p>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Angular</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    180 degrees in radians
                    <span class="text-primary-600 dark:text-primary-400">= 3.1416 radians</span>
                  </div>
                  <div>
                    90° in radians
                    <span class="text-primary-600 dark:text-primary-400">= 1.5708 radians</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Fuel Economy -->
          <section v-show="isSectionVisible('fuel')" :id="'help-fuel'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              Fuel Economy
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>Convert between fuel economy units and calculate fuel consumption.</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">mpg</span> — miles per gallon (US)
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">kpl</span> — km per litre
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">mpl</span> — miles per litre
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">kpg</span> — km per gallon
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">l/100km</span> — litres per 100km
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">mpg_uk</span> — miles per UK gallon
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-2">
                <div>
                  30 mpg in kpl
                  <span class="text-primary-600 dark:text-primary-400">= 12.75 kpl</span>
                </div>
                <div>
                  30 mpg in l/100km
                  <span class="text-primary-600 dark:text-primary-400">= 7.84 l/100km</span>
                </div>
                <div>
                  8 l/100km in mpg
                  <span class="text-primary-600 dark:text-primary-400">= 29.4 mpg</span>
                </div>
                <div>
                  12 kpl in mpg
                  <span class="text-primary-600 dark:text-primary-400">= 28.25 mpg</span>
                </div>
                <div>
                  30 mpg in mpg_uk
                  <span class="text-primary-600 dark:text-primary-400">= 36.03 mpg_uk</span>
                </div>
                <div class="mt-2 text-gray-500">// Long-form also works</div>
                <div>
                  30 miles per gallon in km per litre
                  <span class="text-primary-600 dark:text-primary-400">= 12.75 kpl</span>
                </div>
                <div class="mt-2 text-gray-500">// Fuel consumption calculation</div>
                <div>distance = 100 miles</div>
                <div>mileage = 30 mpg</div>
                <div>
                  fuel = distance / mileage
                  <span class="text-primary-600 dark:text-primary-400">= 3.33 gallons</span>
                </div>
              </div>
            </div>
          </section>

          <!-- CSS Units -->
          <section v-show="isSectionVisible('css')" :id="'help-css'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">CSS Units</h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>Convert between CSS units. Default: 1em = 16px, 1pt = 1.333px.</p>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                <div>
                  12 pt in px <span class="text-primary-600 dark:text-primary-400">= 16 px</span>
                </div>
                <div>
                  1 em in px <span class="text-primary-600 dark:text-primary-400">= 16 px</span>
                </div>
                <div>
                  1 rem in px <span class="text-primary-600 dark:text-primary-400">= 16 px</span>
                </div>
                <div>
                  1 inch in px <span class="text-primary-600 dark:text-primary-400">= 96 px</span>
                </div>
                <div class="mt-2 text-gray-500">// Custom em size</div>
                <div>em = 20</div>
                <div>
                  1.2 em in px <span class="text-primary-600 dark:text-primary-400">= 24 px</span>
                </div>
                <div class="mt-2 text-gray-500">// Custom PPI (e.g., Retina display)</div>
                <div>ppi = 326</div>
                <div>
                  1 cm in px <span class="text-primary-600 dark:text-primary-400">= 128 px</span>
                </div>
              </div>
            </div>
          </section>

          <!-- SI Prefixes -->
          <section v-show="isSectionVisible('si')" :id="'help-si'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.si.title') }}
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>{{ $t('help.si.desc') }}</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">k (kilo) = 10³</div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">M (mega) = 10⁶</div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">G (giga) = 10⁹</div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">T (tera) = 10¹²</div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">m (milli) = 10⁻³</div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">μ (micro) = 10⁻⁶</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-2">
                <div>
                  1 km in m <span class="text-primary-600 dark:text-primary-400">= 1000 m</span>
                </div>
                <div>
                  1 mg in g <span class="text-primary-600 dark:text-primary-400">= 0.001 g</span>
                </div>
                <div>
                  1 MB in bytes
                  <span class="text-primary-600 dark:text-primary-400">= 1000000 bytes</span>
                </div>
                <div>
                  1 kilogram in grams
                  <span class="text-primary-600 dark:text-primary-400">= 1000 grams</span>
                </div>
                <div>
                  1 millimeter in meters
                  <span class="text-primary-600 dark:text-primary-400">= 0.001 meters</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Number Formats -->
          <section v-show="isSectionVisible('numformats')" :id="'help-numformats'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              Number Formats
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <p>Work with binary, hexadecimal, octal, and scientific notation.</p>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                <div class="text-gray-500">// Binary (0b prefix)</div>
                <div>0b1010 <span class="text-primary-600 dark:text-primary-400">= 10</span></div>
                <div>
                  0b1010 + 0b0101 <span class="text-primary-600 dark:text-primary-400">= 15</span>
                </div>
                <div>
                  10 in bin <span class="text-primary-600 dark:text-primary-400">= 1010</span>
                </div>
                <div class="mt-2 text-gray-500">// Hexadecimal (0x prefix)</div>
                <div>0xFF <span class="text-primary-600 dark:text-primary-400">= 255</span></div>
                <div>
                  0xFF + 1 <span class="text-primary-600 dark:text-primary-400">= 256</span>
                </div>
                <div>
                  255 in hex <span class="text-primary-600 dark:text-primary-400">= FF</span>
                </div>
                <div class="mt-2 text-gray-500">// Octal (0o prefix)</div>
                <div>
                  0o1435343 <span class="text-primary-600 dark:text-primary-400">= 407267</span>
                </div>
                <div>8 in oct <span class="text-primary-600 dark:text-primary-400">= 10</span></div>
                <div class="mt-2 text-gray-500">// Scientific notation</div>
                <div>
                  5300 in sci
                  <span class="text-primary-600 dark:text-primary-400">= 5.3 × 10³</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Functions -->
          <section v-show="isSectionVisible('functions')" :id="'help-functions'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.functions.title') }}
            </h3>
            <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <p>{{ $t('help.functions.desc') }}</p>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Basic Functions</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">sqrt(16) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">cbrt(8) = 2</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">abs(-4) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">fact(5) = 120</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">round(3.55) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">ceil(3.76) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">floor(2.56) = 2</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">log(100) = 2</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">ln(e) = 1</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    fromunix(0) = 1970-01-01
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Roots &amp; Logarithms
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>
                    root 2 (8) <span class="text-primary-600 dark:text-primary-400">= 2.83</span>
                    <span class="text-gray-500">// square root of 8</span>
                  </div>
                  <div>
                    root 3 (27) <span class="text-primary-600 dark:text-primary-400">= 3</span>
                    <span class="text-gray-500">// cube root</span>
                  </div>
                  <div>
                    log 2 (10) <span class="text-primary-600 dark:text-primary-400">= 3.32</span>
                    <span class="text-gray-500">// log base 2</span>
                  </div>
                  <div>
                    log 10 (1000) <span class="text-primary-600 dark:text-primary-400">= 3</span>
                    <span class="text-gray-500">// log base 10</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Trigonometry</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div class="text-gray-500">// Use ° for degrees</div>
                  <div>
                    sin(45°) <span class="text-primary-600 dark:text-primary-400">= 0.7071</span>
                  </div>
                  <div>
                    cos(60°) <span class="text-primary-600 dark:text-primary-400">= 0.5</span>
                  </div>
                  <div>
                    tan(45°) <span class="text-primary-600 dark:text-primary-400">= 1</span>
                  </div>
                  <div class="mt-2 text-gray-500">// Inverse trig (returns radians)</div>
                  <div>
                    arcsin(1) <span class="text-primary-600 dark:text-primary-400">= 1.5708</span>
                    <span class="text-gray-500">// π/2</span>
                  </div>
                  <div>
                    arccos(0) <span class="text-primary-600 dark:text-primary-400">= 1.5708</span>
                  </div>
                  <div>
                    arctan(1) <span class="text-primary-600 dark:text-primary-400">= 0.7854</span>
                    <span class="text-gray-500">// π/4</span>
                  </div>
                  <div class="mt-2 text-gray-500">// Hyperbolic</div>
                  <div>
                    sinh(1) <span class="text-primary-600 dark:text-primary-400">= 1.1752</span>
                  </div>
                  <div>
                    cosh(1) <span class="text-primary-600 dark:text-primary-400">= 1.5431</span>
                  </div>
                  <div>
                    tanh(1) <span class="text-primary-600 dark:text-primary-400">= 0.7616</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Constants -->
          <section v-show="isSectionVisible('constants')" :id="'help-constants'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.constants.title') }}
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">pi</span> = 3.14159...
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">e</span> = 2.71828...
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">tau</span> = 6.28318... (2π)
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span class="font-semibold">phi</span> = 1.61803... (golden ratio)
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-2">
                <div>
                  pi * 2 <span class="text-primary-600 dark:text-primary-400">= 6.2832</span>
                </div>
                <div>e ^ 2 <span class="text-primary-600 dark:text-primary-400">= 7.389</span></div>
              </div>
            </div>
          </section>

          <!-- Date & Time -->
          <section v-show="isSectionVisible('datetime')" :id="'help-datetime'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              Date &amp; Time
            </h3>
            <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Date Keywords</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>now <span class="text-gray-500">// Current date and time</span></div>
                  <div>today <span class="text-gray-500">// Today at midnight</span></div>
                  <div>yesterday <span class="text-gray-500">// Yesterday</span></div>
                  <div>tomorrow <span class="text-gray-500">// Tomorrow</span></div>
                  <div>next week <span class="text-gray-500">// 7 days from now</span></div>
                  <div>last week <span class="text-gray-500">// 7 days ago</span></div>
                  <div>next month <span class="text-gray-500">// Next month</span></div>
                  <div>last month <span class="text-gray-500">// Last month</span></div>
                  <div>next year <span class="text-gray-500">// Next year</span></div>
                  <div>last year <span class="text-gray-500">// Last year</span></div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Date Arithmetic</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>today + 3 days <span class="text-gray-500">// 3 days from now</span></div>
                  <div>today - 1 week <span class="text-gray-500">// 1 week ago</span></div>
                  <div>
                    today + 2 months <span class="text-gray-500">// 2 months from now</span>
                  </div>
                  <div>
                    2 hours + 30 minutes <span class="text-gray-500">// Duration math</span>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Timezone Conversion
                </p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>PST time <span class="text-gray-500">// Current time in PST</span></div>
                  <div>
                    time in Madrid <span class="text-gray-500">// Current time in Madrid</span>
                  </div>
                  <div>
                    time in Tokyo <span class="text-gray-500">// Current time in Tokyo</span>
                  </div>
                  <div>
                    2:30 pm HKT in Berlin
                    <span class="text-gray-500">// Convert between zones</span>
                  </div>
                </div>
                <p class="text-xs italic mt-2">
                  Supported zones: PST, EST, GMT, UTC, CET, IST, JST, HKT, AEST, and more. Cities:
                  New York, London, Paris, Tokyo, Sydney, etc.
                </p>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Unix Timestamps</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>fromunix(1446587186) <span class="text-gray-500">// Nov 3, 2015</span></div>
                  <div>fromunix(0) <span class="text-gray-500">// Jan 1, 1970 (epoch)</span></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Formatting -->
          <section v-show="isSectionVisible('formatting')" :id="'help-formatting'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('help.formatting.title') }}
            </h3>
            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                <div># Header <span class="text-gray-500">// Large bold text, no result</span></div>
                <div>
                  // Comment <span class="text-gray-500">// Italic gray text, no result</span>
                </div>
                <div>Label: <span class="text-gray-500">// Bold label, no result</span></div>
                <div>
                  Price: $100 * 2
                  <span class="text-primary-600 dark:text-primary-400">= 200 USD</span>
                  <span class="text-gray-500">// Label with calculation</span>
                </div>
                <div>
                  $275 for the "Model 227"
                  <span class="text-primary-600 dark:text-primary-400">= 275 USD</span>
                  <span class="text-gray-500">// Inline comment with quotes</span>
                </div>
              </div>
              <p class="text-xs italic mt-2">
                Empty lines separate sum/average calculations into groups.
              </p>
            </div>
          </section>

          <!-- Shortcuts -->
          <section v-show="isSectionVisible('shortcuts')" :id="'help-shortcuts'">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">
              {{ $t('shortcuts.title') }}
            </h3>
            <div class="space-y-4">
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">
                  Keyboard Shortcuts
                </p>
                <div class="space-y-2">
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">New Note</span>
                    <UiKbd>{{ modLabel }}+⇧+N</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Open File</span>
                    <UiKbd>{{ modLabel }}+O</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Save (auto-saved)</span>
                    <UiKbd>{{ modLabel }}+S</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Duplicate Note</span>
                    <UiKbd>{{ modLabel }}+D</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Export as Text</span>
                    <UiKbd>{{ modLabel }}+E</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Print</span>
                    <UiKbd>{{ modLabel }}+P</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Show Help</span>
                    <UiKbd>{{ modLabel }}+H</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Export All Notes</span>
                    <UiKbd>{{ modLabel }}+⇧+S</UiKbd>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Navigation</p>
                <div class="space-y-2">
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">{{
                      $t('shortcuts.newLine')
                    }}</span>
                    <UiKbd>Enter</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">{{
                      $t('shortcuts.moveUp')
                    }}</span>
                    <UiKbd>↑</UiKbd>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">{{
                      $t('shortcuts.moveDown')
                    }}</span>
                    <UiKbd>↓</UiKbd>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Quick Functions</p>
                <div class="space-y-2">
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Square root</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>sqrt(16)</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Power/Exponent</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>2^8</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Percentage</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>20% of 100</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Previous result</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>prev</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Sum all above</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>sum</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400"
                      >Subtract from first</span
                    >
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>sub</UiKbd>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Quick Conversions</p>
                <div class="space-y-2">
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400"
                      >Currency conversion</span
                    >
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>$100 in EUR</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Unit conversion</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>100 kg in lbs</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Date arithmetic</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>today + 2 weeks</UiKbd>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-700 dark:text-gray-400">Number format</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                      <UiKbd>255 in hex</UiKbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Tips -->
          <section v-show="isSectionVisible('tips')" :id="'help-tips'">
            <div class="p-4 bg-primary-50 dark:bg-gray-800 rounded-lg">
              <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-400 mb-2">
                {{ $t('shortcuts.tips') }}
              </h3>
              <ul class="text-xs text-primary-800 dark:text-gray-400 space-y-1">
                <li>• {{ $t('shortcuts.tip1') }}</li>
                <li>• {{ $t('shortcuts.tip2') }}</li>
                <li>• {{ $t('shortcuts.tip3') }}</li>
                <li>• {{ $t('shortcuts.tip4') }}</li>
                <li>• Use parentheses () to group operations: (10 + 20) * 2</li>
                <li>• Variables work across lines: price = 100, then use "price" later</li>
                <li>• Empty lines separate sum/average calculations</li>
                <li>• Units work with or without spaces: 100km or 100 km</li>
                <li>• Use scales with currency: $2k, €3M, £1 million</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  modLabel: {
    type: String,
    default: 'Ctrl',
  },
})

const emit = defineEmits(['close'])

const showIndex = ref(true)
const activeSection = ref('basics')
const contentRef = ref(null)
const searchQuery = ref('')
const searchInputRef = ref(null)
const scrollPadding = ref(0)

const updateScrollPadding = () => {
  const container = contentRef.value
  if (!container) return
  const allSections = container.querySelectorAll('section[id^="help-"]')
  const last = allSections[allSections.length - 1]
  if (!last) return
  scrollPadding.value = Math.max(0, container.clientHeight - last.offsetHeight - 80)
}

const sections = [
  {
    id: 'basics',
    label: 'Basics',
    keywords:
      'basics arithmetic add subtract multiply divide exponent modulo implicit multiplication',
  },
  {
    id: 'operators',
    label: 'Operators',
    keywords:
      'operators plus minus times divide multiply addition subtraction multiplication division exponent modulo',
  },
  { id: 'bitwise', label: 'Bitwise', keywords: 'bitwise and or xor shift left right' },
  { id: 'variables', label: 'Variables', keywords: 'variables assign store value names' },
  {
    id: 'special',
    label: 'Special Keywords',
    keywords: 'special prev previous sum sub subtract subtraction average avg aggregate',
  },
  {
    id: 'percentages',
    label: 'Percentages',
    keywords: 'percentages percent contextual literal reverse compound interest',
  },
  {
    id: 'scales',
    label: 'Scales',
    keywords: 'scales thousand million billion trillion k M shorthand large numbers',
  },
  {
    id: 'currency',
    label: 'Currency',
    keywords: 'currency dollar euro pound yen usd eur gbp conversion exchange rate money',
  },
  {
    id: 'units',
    label: 'Units',
    keywords:
      'units length weight volume temperature area speed time data convert conversion km miles feet celsius fahrenheit',
  },
  {
    id: 'fuel',
    label: 'Fuel Economy',
    keywords: 'fuel economy mpg kpl consumption miles per gallon litre',
  },
  { id: 'css', label: 'CSS Units', keywords: 'css units px em rem pt inch pixel font size' },
  { id: 'si', label: 'SI Prefixes', keywords: 'si prefixes kilo mega giga tera milli micro' },
  {
    id: 'numformats',
    label: 'Number Formats',
    keywords: 'number formats binary hex hexadecimal octal scientific notation base',
  },
  {
    id: 'functions',
    label: 'Functions',
    keywords: 'functions sqrt cbrt abs round ceil floor log ln sin cos tan trigonometry',
  },
  { id: 'constants', label: 'Constants', keywords: 'constants pi e tau phi golden ratio' },
  {
    id: 'datetime',
    label: 'Date & Time',
    keywords: 'date time now today yesterday tomorrow timezone unix timestamp',
  },
  { id: 'formatting', label: 'Formatting', keywords: 'formatting header comment label hash' },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    keywords:
      'shortcuts keyboard navigation quick functions conversions ctrl cmd save new open print duplicate export help',
  },
  { id: 'tips', label: 'Tips', keywords: 'tips tricks hints' },
]

const filteredSectionIds = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return new Set(sections.map((s) => s.id))
  return new Set(
    sections
      .filter((s) => s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q))
      .map((s) => s.id),
  )
})

const filteredSections = computed(() => {
  return sections.filter((s) => filteredSectionIds.value.has(s.id))
})

const isSectionVisible = (id) => {
  return filteredSectionIds.value.has(id)
}

watch(searchQuery, () => {
  nextTick(() => updateScrollPadding())
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) nextTick(() => updateScrollPadding())
  },
)

const scrollTo = (id) => {
  const el = contentRef.value?.querySelector(`#help-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  if (window.innerWidth < 768) {
    showIndex.value = false
  }
}

const onScroll = () => {
  if (!contentRef.value) return
  const scrollTop = contentRef.value.scrollTop
  let current = sections[0].id
  for (const section of sections) {
    const el = contentRef.value.querySelector(`#help-${section.id}`)
    if (el && el.offsetTop - 80 <= scrollTop) {
      current = section.id
    }
  }
  activeSection.value = current
}

onMounted(() => {
  if (window.innerWidth < 768) {
    showIndex.value = false
  }
  nextTick(() => updateScrollPadding())
})

const close = () => {
  activeSection.value = 'basics'
  searchQuery.value = ''
  emit('close')
}
</script>
