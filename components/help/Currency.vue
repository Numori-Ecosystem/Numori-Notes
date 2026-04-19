<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <HelpSectionHeader icon="mdi:currency-usd" :title="$t('help.currency.title')" description="Conversion, mixed arithmetic, and 50+ currencies" />

      <div class="space-y-8">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('help.currency.desc') }}</p>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Symbol &amp; Code Formats</h4>
          <HelpCodeBlock :lines="['$100', '€50', '£100', '100 USD', '56 EUR']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Conversion</h4>
          <HelpCodeBlock :lines="['$100 in EUR', '100 USD in GBP', '$30 in euro']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Mixed Currency Arithmetic</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Currencies are automatically converted to the first currency used.</p>
          <HelpCodeBlock :lines="['$30 + €20', '$20 + 56 EUR', '$100 + €50 in GBP']" />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200">Variables with Currency</h4>
          <HelpCodeBlock :lines="['v = $20', 'v + $10', 'v times 7', 'a = €100', 'a in GBP']" />
        </div>

        <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Supported Currencies</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Symbols: $ € £ ¥ ₹ ₽ ₩ ₺ ₿ and 50+ ISO codes (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, BRL, etc.)</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Names: euro, pound, yen, won, rupee, franc, yuan, bitcoin</p>
        </div>
      </div>
    </div>
  </div>
</template>
