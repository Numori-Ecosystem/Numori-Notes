<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4"
    @click="close">
    <div class="bg-white dark:bg-gray-925 md:rounded-lg max-w-5xl w-full h-full md:h-[90vh] overflow-hidden flex flex-col"
      @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div class="flex items-center gap-2">
          <button @click="showIndex = !showIndex"
            class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            :title="showIndex ? 'Hide index' : 'Show index'">
            <Icon name="mdi:table-of-contents" class="block w-5 h-5" />
          </button>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">{{ $t('help.title') }}</h2>
        </div>
        <button @click="close" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </button>
      </div>

      <!-- Body: Index sidebar + Content -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Mobile index overlay backdrop -->
        <div v-if="showIndex" class="fixed inset-0 bg-black bg-opacity-25 z-10 md:hidden" @click="showIndex = false"></div>

        <!-- Index sidebar -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="max-md:-translate-x-full max-md:opacity-0 md:w-0 md:opacity-0"
          enter-to-class="max-md:translate-x-0 max-md:opacity-100 md:w-56 md:opacity-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="max-md:translate-x-0 max-md:opacity-100 md:w-56 md:opacity-100"
          leave-to-class="max-md:-translate-x-full max-md:opacity-0 md:w-0 md:opacity-0">
          <nav v-if="showIndex"
            class="absolute md:relative z-20 w-64 md:w-56 flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <ul class="py-3 px-3 space-y-0.5">
              <li v-for="section in sections" :key="section.id">
                <button @click="scrollTo(section.id)"
                  class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
                  :class="activeSection === section.id
                    ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'">
                  {{ section.label }}
                </button>
              </li>
            </ul>
          </nav>
        </Transition>

        <!-- Content -->
        <div ref="contentRef" class="flex-1 overflow-y-auto p-6 scroll-smooth" @scroll="onScroll">
          <div class="max-w-3xl mx-auto space-y-12">

            <!-- Basics -->
            <section :id="'help-basics'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.basics.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <p>{{ $t('help.basics.desc') }}</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>10 + 20 <span class="text-primary-600 dark:text-primary-400">= 30</span></div>
                  <div>100 * 1.5 <span class="text-primary-600 dark:text-primary-400">= 150</span></div>
                  <div>50 minus 10 <span class="text-primary-600 dark:text-primary-400">= 40</span></div>
                  <div>20 times 5 <span class="text-primary-600 dark:text-primary-400">= 100</span></div>
                  <div>2 ^ 8 <span class="text-primary-600 dark:text-primary-400">= 256</span></div>
                  <div>17 mod 5 <span class="text-primary-600 dark:text-primary-400">= 2</span></div>
                </div>
              </div>
            </section>

            <!-- Operators -->
            <section :id="'help-operators'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">Operators</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Addition:</span> +, plus, and, with</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Subtraction:</span> -, minus, subtract, without</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Multiplication:</span> *, times, multiplied by, mul</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Division:</span> /, divide, divide by</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Exponent:</span> ^</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Modulo:</span> mod, %</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Bitwise AND:</span> &amp;</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Bitwise OR:</span> |</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Bitwise XOR:</span> xor</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Left Shift:</span> &lt;&lt;</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded"><span class="font-semibold">Right Shift:</span> &gt;&gt;</div>
                </div>
              </div>
            </section>

            <!-- Variables -->
            <section :id="'help-variables'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.variables.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <p>{{ $t('help.variables.desc') }}</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>price = 100 <span class="text-primary-600 dark:text-primary-400">= 100</span></div>
                  <div>tax = price * 20% <span class="text-primary-600 dark:text-primary-400">= 20</span></div>
                  <div>total = price + tax <span class="text-primary-600 dark:text-primary-400">= 120</span></div>
                </div>
              </div>
            </section>

            <!-- Percentages -->
            <section :id="'help-percentages'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.percentages.title') }}</h3>
              <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
                <p class="font-medium">Percentages work consistently across all operators:</p>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Contextual (Addition &amp; Subtraction)</p>
                  <p class="text-xs mb-2">Apply percentage to base, then add/subtract:</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 + 20% <span class="text-primary-600 dark:text-primary-400">= 120</span> <span class="text-gray-500 dark:text-gray-400-muted">// Add 20% of 100</span></div>
                    <div>100 - 15% <span class="text-primary-600 dark:text-primary-400">= 85</span> <span class="text-gray-500 dark:text-gray-400-muted">// Subtract 15% of 100</span></div>
                    <div>200 + 10% <span class="text-primary-600 dark:text-primary-400">= 220</span> <span class="text-gray-500 dark:text-gray-400-muted">// Add 10% of 200</span></div>
                    <div>200 - 10% <span class="text-primary-600 dark:text-primary-400">= 180</span> <span class="text-gray-500 dark:text-gray-400-muted">// Subtract 10% of 200</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Literal (Multiplication &amp; Division)</p>
                  <p class="text-xs mb-2">Treat percentage as decimal (standard calculator):</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 * 5% <span class="text-primary-600 dark:text-primary-400">= 5</span> <span class="text-gray-500 dark:text-gray-400-muted">// 100 × 0.05</span></div>
                    <div>100 / 5% <span class="text-primary-600 dark:text-primary-400">= 2000</span> <span class="text-gray-500 dark:text-gray-400-muted">// 100 ÷ 0.05</span></div>
                    <div>200 * 10% <span class="text-primary-600 dark:text-primary-400">= 20</span> <span class="text-gray-500 dark:text-gray-400-muted">// 200 × 0.10</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Explicit Keywords</p>
                  <p class="text-xs mb-2">Use keywords for clarity:</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>20% of 100 <span class="text-primary-600 dark:text-primary-400">= 20</span> <span class="text-gray-500 dark:text-gray-400-muted">// Calculate percentage</span></div>
                    <div>10% on 200 <span class="text-primary-600 dark:text-primary-400">= 220</span> <span class="text-gray-500 dark:text-gray-400-muted">// Add percentage</span></div>
                    <div>10% off 50 <span class="text-primary-600 dark:text-primary-400">= 45</span> <span class="text-gray-500 dark:text-gray-400-muted">// Subtract percentage</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Real-World Examples</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div class="text-gray-500 dark:text-gray-400-muted">// Shopping discount</div>
                    <div>price = $100</div>
                    <div>final = price - 20% <span class="text-primary-600 dark:text-primary-400">= 80 USD</span></div>
                    <div class="mt-2 text-gray-500 dark:text-gray-400-muted">// Tax calculation</div>
                    <div>subtotal = $100</div>
                    <div>tax = 8.5% of subtotal <span class="text-primary-600 dark:text-primary-400">= 8.5 USD</span></div>
                    <div>total = subtotal + tax <span class="text-primary-600 dark:text-primary-400">= 108.5 USD</span></div>
                    <div class="mt-2 text-gray-500 dark:text-gray-400-muted">// Tip calculation</div>
                    <div>bill = $85</div>
                    <div>tip = 18% of bill <span class="text-primary-600 dark:text-primary-400">= 15.3 USD</span></div>
                    <div>total = bill + 18% <span class="text-primary-600 dark:text-primary-400">= 100.3 USD</span></div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Currency -->
            <section :id="'help-currency'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.currency.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <p>{{ $t('help.currency.desc') }}</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>$100 + $50 <span class="text-primary-600 dark:text-primary-400">= 150 USD</span></div>
                  <div>€200 - €75 <span class="text-primary-600 dark:text-primary-400">= 125 EUR</span></div>
                  <div>£50 * 2 <span class="text-primary-600 dark:text-primary-400">= 100 GBP</span></div>
                </div>
                <p class="mt-3 font-semibold">Currency Conversion:</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>$100 in EUR <span class="text-primary-600 dark:text-primary-400">= 92 EUR</span></div>
                  <div>£50 to USD <span class="text-primary-600 dark:text-primary-400">= 63.29 USD</span></div>
                  <div>€100 as GBP <span class="text-primary-600 dark:text-primary-400">= 85.87 GBP</span></div>
                </div>
                <p class="mt-3 text-xs">Supported: USD ($), EUR (€), GBP (£), JPY (¥), INR (₹), RUB (₽), CAD, AUD, CHF, CNY</p>
              </div>
            </section>

            <!-- Units -->
            <section :id="'help-units'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.units.title') }}</h3>
              <div class="space-y-3 text-sm text-gray-700 dark:text-gray-400">
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Length</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 cm in meters <span class="text-primary-600 dark:text-primary-400">= 1 meters</span></div>
                    <div>5 feet to inches <span class="text-primary-600 dark:text-primary-400">= 60 inches</span></div>
                    <div>10 km in miles <span class="text-primary-600 dark:text-primary-400">= 6.21 miles</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Weight</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 kg in lbs <span class="text-primary-600 dark:text-primary-400">= 220.46 lbs</span></div>
                    <div>5 pounds to kg <span class="text-primary-600 dark:text-primary-400">= 2.27 kg</span></div>
                    <div>2 stone in kg <span class="text-primary-600 dark:text-primary-400">= 12.7 kg</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Volume</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>2 liters in gallons <span class="text-primary-600 dark:text-primary-400">= 0.528 gallons</span></div>
                    <div>500 ml to cups <span class="text-primary-600 dark:text-primary-400">= 2.11 cups</span></div>
                    <div>1 gallon in liters <span class="text-primary-600 dark:text-primary-400">= 3.79 liters</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Area</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 m2 in ft2 <span class="text-primary-600 dark:text-primary-400">= 1076.39 ft2</span></div>
                    <div>1 acre in m2 <span class="text-primary-600 dark:text-primary-400">= 4046.86 m2</span></div>
                    <div>5 km2 in hectares <span class="text-primary-600 dark:text-primary-400">= 500 hectares</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Temperature</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 celsius in fahrenheit <span class="text-primary-600 dark:text-primary-400">= 212 fahrenheit</span></div>
                    <div>32 fahrenheit to celsius <span class="text-primary-600 dark:text-primary-400">= 0 celsius</span></div>
                    <div>273 kelvin in celsius <span class="text-primary-600 dark:text-primary-400">= -0.15 celsius</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Time</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>3600 seconds in hours <span class="text-primary-600 dark:text-primary-400">= 1 hours</span></div>
                    <div>2 weeks in days <span class="text-primary-600 dark:text-primary-400">= 14 days</span></div>
                    <div>365 days in years <span class="text-primary-600 dark:text-primary-400">= 1 years</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Speed</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 km/h in mph <span class="text-primary-600 dark:text-primary-400">= 62.14 mph</span></div>
                    <div>60 mph to m/s <span class="text-primary-600 dark:text-primary-400">= 26.82 m/s</span></div>
                    <div>20 knots in km/h <span class="text-primary-600 dark:text-primary-400">= 37.04 km/h</span></div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Data</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>100 MB in GB <span class="text-primary-600 dark:text-primary-400">= 0.1 GB</span></div>
                    <div>1 GiB in MiB <span class="text-primary-600 dark:text-primary-400">= 1024 MiB</span></div>
                    <div>8 bits in bytes <span class="text-primary-600 dark:text-primary-400">= 1 bytes</span></div>
                  </div>
                  <p class="text-xs italic mt-2">Note: KB/MB/GB use 1000, KiB/MiB/GiB use 1024</p>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">CSS Units</p>
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                    <div>16 px in em <span class="text-primary-600 dark:text-primary-400">= 1 em</span></div>
                    <div>2 em in px <span class="text-primary-600 dark:text-primary-400">= 32 px</span></div>
                    <div>12 pt in px <span class="text-primary-600 dark:text-primary-400">= 16 px</span></div>
                  </div>
                  <p class="text-xs italic mt-2">Note: 1em = 16px (default), 1pt = 1.333px</p>
                </div>
              </div>
            </section>

            <!-- SI Prefixes -->
            <section :id="'help-si'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.si.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <p>{{ $t('help.si.desc') }}</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">k (kilo) = 10³</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">M (mega) = 10⁶</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">G (giga) = 10⁹</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">T (tera) = 10¹²</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">m (milli) = 10⁻³</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">μ (micro) = 10⁻⁶</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">n (nano) = 10⁻⁹</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">p (pico) = 10⁻¹²</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1 mt-3">
                  <div>100 km <span class="text-gray-500">// kilometer</span></div>
                  <div>500 MB <span class="text-gray-500">// megabyte</span></div>
                  <div>2 Gm in km <span class="text-gray-500">// gigameter to kilometer</span></div>
                  <div>50 mm in cm <span class="text-gray-500">// millimeter to centimeter</span></div>
                </div>
                <p class="text-xs italic mt-2">Note: SI prefixes are case-sensitive. Use MB for megabytes, not mB.</p>
              </div>
            </section>

            <!-- Functions -->
            <section :id="'help-functions'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.functions.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <p>{{ $t('help.functions.desc') }}</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">sqrt(16) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">cbrt(8) = 2</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">abs(-5) = 5</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">round(3.7) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">ceil(3.2) = 4</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">floor(3.8) = 3</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">sin(45°) = 0.707</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">cos(90°) = 0</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">tan(45°) = 1</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">log(100) = 2</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">ln(10) = 2.303</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">fact(5) = 120</div>
                </div>
              </div>
            </section>

            <!-- Constants -->
            <section :id="'help-constants'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.constants.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">pi = 3.14159...</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">e = 2.71828...</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">tau = 6.28318...</div>
                  <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded">phi = 1.61803...</div>
                </div>
              </div>
            </section>

            <!-- Special Keywords -->
            <section :id="'help-special'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.special.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div>prev <span class="text-gray-500">// Previous result</span></div>
                  <div>sum <span class="text-gray-500">// Sum all lines above</span></div>
                  <div>average <span class="text-gray-500">// Average all lines above</span></div>
                  <div>sum in USD <span class="text-gray-500">// Sum with currency conversion</span></div>
                </div>
              </div>
            </section>

            <!-- Date & Time -->
            <section :id="'help-datetime'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">Date &amp; Time</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <p>Get current date/time and perform date arithmetic.</p>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div class="font-semibold text-gray-600 dark:text-gray-400-muted">Current:</div>
                  <div>now <span class="text-gray-500">// Current date and time</span></div>
                  <div>today <span class="text-gray-500">// Today at midnight</span></div>
                  <div class="font-semibold text-gray-600 dark:text-gray-400-muted mt-2">Shortcuts:</div>
                  <div>yesterday <span class="text-gray-500">// Yesterday</span></div>
                  <div>tomorrow <span class="text-gray-500">// Tomorrow</span></div>
                  <div>next week <span class="text-gray-500">// 7 days from now</span></div>
                  <div>last week <span class="text-gray-500">// 7 days ago</span></div>
                  <div>next month <span class="text-gray-500">// Next month</span></div>
                  <div>last month <span class="text-gray-500">// Last month</span></div>
                  <div>next year <span class="text-gray-500">// Next year</span></div>
                  <div>last year <span class="text-gray-500">// Last year</span></div>
                  <div class="font-semibold text-gray-600 dark:text-gray-400-muted mt-2">Arithmetic:</div>
                  <div>today + 2 weeks <span class="text-gray-500">// Date arithmetic</span></div>
                  <div>tomorrow + 3 days <span class="text-gray-500">// Combine shortcuts</span></div>
                  <div>yesterday - 1 month <span class="text-gray-500">// Subtract time</span></div>
                  <div>fromunix(1446587186) <span class="text-gray-500">// Convert Unix timestamp</span></div>
                </div>
                <p class="text-xs italic mt-2">Supported units: second, minute, hour, day, week, month, year</p>
              </div>
            </section>

            <!-- Formatting -->
            <section :id="'help-formatting'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('help.formatting.title') }}</h3>
              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-xs space-y-1">
                  <div># Header <span class="text-gray-500">// Large bold text</span></div>
                  <div>// Comment <span class="text-gray-500">// Italic gray text</span></div>
                  <div>Label: <span class="text-gray-500">// Bold label</span></div>
                  <div>Price: $100 * 2 <span class="text-gray-500">// Label with calculation</span></div>
                </div>
              </div>
            </section>

            <!-- Shortcuts -->
            <section :id="'help-shortcuts'">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-3">{{ $t('shortcuts.title') }}</h3>
              <div class="space-y-4">
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Navigation</p>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">{{ $t('shortcuts.newLine') }}</span>
                      <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">Enter</kbd>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">{{ $t('shortcuts.moveUp') }}</span>
                      <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">↑</kbd>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">{{ $t('shortcuts.moveDown') }}</span>
                      <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">↓</kbd>
                    </div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Quick Functions</p>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Square root</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">sqrt(16)</kbd>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Power/Exponent</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">2^8</kbd>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Percentage</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">20% of 100</kbd>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Previous result</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">prev</kbd>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Sum all above</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">sum</kbd>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-gray-400 mb-2">Quick Conversions</p>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Currency conversion</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">$100 in EUR</kbd>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Unit conversion</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">100 kg in lbs</kbd>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-sm text-gray-700 dark:text-gray-400">Date arithmetic</span>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400-muted">Type:</span>
                        <kbd class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-400">today + 2 weeks</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Tips -->
            <section :id="'help-tips'">
              <div class="p-4 bg-primary-50 dark:bg-gray-800 rounded-lg">
                <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-400 mb-2">{{ $t('shortcuts.tips') }}</h3>
                <ul class="text-xs text-primary-800 dark:text-gray-400 space-y-1">
                  <li>• {{ $t('shortcuts.tip1') }}</li>
                  <li>• {{ $t('shortcuts.tip2') }}</li>
                  <li>• {{ $t('shortcuts.tip3') }}</li>
                  <li>• {{ $t('shortcuts.tip4') }}</li>
                  <li>• Use parentheses () to group operations: (10 + 20) * 2</li>
                  <li>• Variables work across lines: price = 100, then use "price" later</li>
                  <li>• Empty lines separate sum/average calculations</li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const showIndex = ref(true)
const activeSection = ref('basics')
const contentRef = ref(null)

const sections = [
  { id: 'basics', label: 'Basics' },
  { id: 'operators', label: 'Operators' },
  { id: 'variables', label: 'Variables' },
  { id: 'percentages', label: 'Percentages' },
  { id: 'currency', label: 'Currency' },
  { id: 'units', label: 'Units' },
  { id: 'si', label: 'SI Prefixes' },
  { id: 'functions', label: 'Functions' },
  { id: 'constants', label: 'Constants' },
  { id: 'special', label: 'Special Keywords' },
  { id: 'datetime', label: 'Date & Time' },
  { id: 'formatting', label: 'Formatting' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'tips', label: 'Tips' },
]

const scrollTo = (id) => {
  const el = contentRef.value?.querySelector(`#help-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // Close index on mobile after clicking
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

// Hide index on mobile by default
onMounted(() => {
  if (window.innerWidth < 768) {
    showIndex.value = false
  }
})

const close = () => {
  emit('close')
}
</script>
