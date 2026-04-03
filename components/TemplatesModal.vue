<template>
  <Teleport to="body">
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
        @click="close">
        <Transition enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95">
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-5xl w-full h-[95vh] sm:h-screen md:h-[90vh] overflow-hidden flex flex-col"
            @click.stop>
      <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">{{ $t('templates.title') }}</h2>
        <button @click="close" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </button>
      </div>

      <!-- Search + Filters -->
      <div class="px-3 sm:px-4 pt-3 pb-2 space-y-2 border-b border-gray-200 dark:border-gray-700 overflow-x-hidden">
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="relative flex-1">
            <Icon name="mdi:magnify"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400-muted" />
            <input v-model="searchQuery" type="text" :placeholder="$t('templates.search')"
              class="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-925 text-gray-900 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400" />
          </div>
          <select v-model="activeComplexity"
            class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-925 text-gray-700 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400">
            <option value="">All sizes</option>
            <option value="quick">Quick</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <!-- Use case filters -->
        <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">Use case:</span>
          <button
            v-for="filter in categoryFilters"
            :key="filter.id"
            @click="toggleChip('category', filter.id)"
            class="px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0"
            :class="activeCategories.has(filter.id)
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-750 hover:text-gray-900 dark:hover:text-white'"
          >
            {{ filter.name }}
          </button>
        </div>
        <!-- Feature filters -->
        <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">Features:</span>
          <button
            v-for="feat in featureFilters"
            :key="feat.id"
            @click="toggleChip('feature', feat.id)"
            class="px-2.5 py-1 text-xs font-medium rounded-full border border-dashed transition-colors whitespace-nowrap shrink-0"
            :class="activeFeatures.has(feat.id)
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-700 border-solid'
              : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            {{ feat.name }}
          </button>
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-2.5 py-1 text-xs font-medium rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            Clear all
          </button>
        </div>
      </div>

      <div class="overflow-y-auto p-3 sm:p-4 flex-1">
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
          mode="out-in">
          <div v-if="filteredTemplates.length === 0" key="empty" class="text-center py-8 text-gray-500 dark:text-gray-400-muted">
            {{ $t('templates.noResults') }}
          </div>
          <div v-else :key="filterKey" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button v-for="template in filteredTemplates" :key="template.id" @click="insertTemplate(template)"
              class="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
              <h3 class="font-semibold text-gray-900 dark:text-gray-400 mb-1">{{ template.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400-muted">{{ template.description }}</p>
            </button>
          </div>
        </Transition>
      </div>
      </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'insert'])

const { templates, categories } = useTemplates()

const searchQuery = ref('')
const activeCategories = ref(new Set())
const activeFeatures = ref(new Set())
const activeComplexity = ref('')

const categoryFilters = categories.filter(c => c.id !== 'all')

const featureFilters = [
  { id: 'currency', name: 'Currency', pattern: /[$€£¥₹₽₩₺₿]|USD|EUR|GBP|JPY/i },
  { id: 'percentages', name: 'Percentages', pattern: /\d+%|% of|% on|% off/i },
  { id: 'units', name: 'Unit conversion', pattern: /\bin\s+(km|m|cm|mm|miles?|feet|foot|inch|lb|kg|oz|g|ml|liters?|gallons?|celsius|fahrenheit|kelvin|mph|kph|sqft|sqm|px|em|rem|pt|radians|degrees|MB|GB|TB|MiB|GiB|bytes?|bits?|mpg|kpl|l\/100km)\b/i },
  { id: 'variables', name: 'Variables', pattern: /^\w+\s*=\s*.+/m },
  { id: 'dates', name: 'Dates & Time', pattern: /\b(today|tomorrow|yesterday|now|next\s+\w+|last\s+\w+|fromunix|timezone?|PST|EST|GMT|UTC|CET|HKT)\b/i },
  { id: 'functions', name: 'Functions', pattern: /\b(sqrt|cbrt|abs|log|ln|sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|round|ceil|floor|fact|root|fromunix)\s*[\d(]/i },
  { id: 'aggregation', name: 'Sum & Avg', pattern: /\b(sum|average|avg|prev)\b/i },
]

const templateFeatureCache = computed(() => {
  const cache = new Map()
  for (const t of templates) {
    const features = new Set()
    for (const f of featureFilters) {
      if (f.pattern.test(t.content)) {
        features.add(f.id)
      }
    }
    cache.set(t.id, features)
  }
  return cache
})

const getTemplateLineCount = (template) => {
  return template.content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//')).length
}

const toggleChip = (type, id) => {
  if (type === 'category') {
    const next = new Set(activeCategories.value)
    next.has(id) ? next.delete(id) : next.add(id)
    activeCategories.value = next
  } else if (type === 'feature') {
    const next = new Set(activeFeatures.value)
    next.has(id) ? next.delete(id) : next.add(id)
    activeFeatures.value = next
  }
}

const hasActiveFilters = computed(() => {
  return activeCategories.value.size > 0 || activeFeatures.value.size > 0 || activeComplexity.value !== ''
})

const clearFilters = () => {
  activeCategories.value = new Set()
  activeFeatures.value = new Set()
  activeComplexity.value = ''
}

const filterKey = computed(() => {
  return [...activeCategories.value].sort().join(',') + '|' + [...activeFeatures.value].sort().join(',') + '|' + activeComplexity.value + '|' + searchQuery.value
})

const filteredTemplates = computed(() => {
  let result = templates

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.content.toLowerCase().includes(query)
    )
  }

  if (activeCategories.value.size > 0) {
    result = result.filter(t => activeCategories.value.has(t.category))
  }

  if (activeFeatures.value.size > 0) {
    result = result.filter(t => {
      const tFeatures = templateFeatureCache.value.get(t.id)
      for (const f of activeFeatures.value) {
        if (tFeatures.has(f)) return true
      }
      return false
    })
  }

  if (activeComplexity.value === 'quick') {
    result = result.filter(t => getTemplateLineCount(t) <= 8)
  } else if (activeComplexity.value === 'detailed') {
    result = result.filter(t => getTemplateLineCount(t) > 8)
  }

  return result
})

const insertTemplate = (template) => {
  emit('insert', template.content)
  close()
}

const close = () => {
  emit('close')
}
</script>
