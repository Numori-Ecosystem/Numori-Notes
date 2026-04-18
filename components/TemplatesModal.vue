<template>
  <UiModal
    :show="isOpen"
    max-width="5xl"
    padding="p-2 sm:p-4"
    panel-class="h-[95vh] sm:h-screen md:h-[90vh]"
    @close="close"
  >
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
        {{ $t('templates.title') }}
      </h2>
      <UiButton variant="ghost" color="gray" icon-only @click="close">
        <Icon name="mdi:close" class="block w-5 h-5" />
      </UiButton>
    </div>

    <!-- Search + Filters -->
    <div
      class="px-3 sm:px-4 pt-3 pb-2 space-y-2 border-b border-gray-200 dark:border-gray-700 overflow-x-hidden"
    >
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="relative flex-1">
          <Icon
            name="mdi:magnify"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400-muted"
          />
          <UiInput
            v-model="searchQuery"
            type="text"
            :placeholder="$t('templates.search')"
            :validate="false"
          />
        </div>
        <UiSelect
          v-model="activeComplexity"
          :block="false"
          :options="[
            { value: '', label: 'All sizes' },
            { value: 'quick', label: 'Quick' },
            { value: 'detailed', label: 'Detailed' },
          ]"
        />
      </div>
      <!-- Use case filters -->
      <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">Use case:</span>
        <UiButton
          v-for="filter in categoryFilters"
          :key="filter.id"
          variant="outline"
          size="xs"
          class="whitespace-nowrap shrink-0"
          :class="
            activeCategories.has(filter.id)
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-750 hover:text-gray-900 dark:hover:text-white'
          "
          @click="toggleChip('category', filter.id)"
        >
          {{ filter.name }}
        </UiButton>
      </div>
      <!-- Feature filters -->
      <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">Features:</span>
        <UiButton
          v-for="feat in featureFilters"
          :key="feat.id"
          variant="dashed"
          size="xs"
          shape="pill"
          class="whitespace-nowrap shrink-0"
          :class="
            activeFeatures.has(feat.id)
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-700 border-solid'
              : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          "
          @click="toggleChip('feature', feat.id)"
        >
          {{ feat.name }}
        </UiButton>
        <UiButton
          v-if="hasActiveFilters"
          variant="ghost"
          color="gray"
          size="xs"
          shape="pill"
          class="shrink-0"
          @click="clearFilters"
        >
          Clear all
        </UiButton>
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
        mode="out-in"
      >
        <div
          v-if="filteredTemplates.length === 0"
          key="empty"
          class="text-center py-8 text-gray-500 dark:text-gray-400-muted"
        >
          {{ $t('templates.noResults') }}
        </div>
        <div v-else :key="filterKey" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiButton
            v-for="template in filteredTemplates"
            :key="template.id"
            variant="outline"
            color="gray"
            block
            class="text-left p-4 items-start justify-start"
            @click="insertTemplate(template)"
          >
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-400 mb-1">
                {{ template.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400-muted">
                {{ template.description }}
              </p>
            </div>
          </UiButton>
        </div>
      </Transition>
    </div>
  </UiModal>
</template>

<script setup>
const _props = defineProps({
  isOpen: Boolean,
})

const emit = defineEmits(['close', 'insert'])

const { templates, categories } = useTemplates()

const searchQuery = ref('')
const activeCategories = ref(new Set())
const activeFeatures = ref(new Set())
const activeComplexity = ref('')

const categoryFilters = categories.filter((c) => c.id !== 'all')

const featureFilters = [
  { id: 'currency', name: 'Currency', pattern: /[$€£¥₹₽₩₺₿]|USD|EUR|GBP|JPY/i },
  { id: 'percentages', name: 'Percentages', pattern: /\d+%|% of|% on|% off/i },
  {
    id: 'units',
    name: 'Unit conversion',
    pattern:
      /\bin\s+(km|m|cm|mm|miles?|feet|foot|inch|lb|kg|oz|g|ml|liters?|gallons?|celsius|fahrenheit|kelvin|mph|kph|sqft|sqm|px|em|rem|pt|radians|degrees|MB|GB|TB|MiB|GiB|bytes?|bits?|mpg|kpl|l\/100km)\b/i,
  },
  { id: 'variables', name: 'Variables', pattern: /^\w+\s*=\s*.+/m },
  {
    id: 'dates',
    name: 'Dates & Time',
    pattern:
      /\b(today|tomorrow|yesterday|now|next\s+\w+|last\s+\w+|fromunix|timezone?|PST|EST|GMT|UTC|CET|HKT)\b/i,
  },
  {
    id: 'functions',
    name: 'Functions',
    pattern:
      /\b(sqrt|cbrt|abs|log|ln|sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|round|ceil|floor|fact|root|fromunix)\s*[\d(]/i,
  },
  { id: 'aggregation', name: 'Sum & Avg', pattern: /\b(sum|sub|average|avg|prev)\b/i },
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
  return template.content
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//')).length
}

const toggleChip = (type, id) => {
  if (type === 'category') {
    const next = new Set(activeCategories.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    activeCategories.value = next
  } else if (type === 'feature') {
    const next = new Set(activeFeatures.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    activeFeatures.value = next
  }
}

const hasActiveFilters = computed(() => {
  return (
    activeCategories.value.size > 0 ||
    activeFeatures.value.size > 0 ||
    activeComplexity.value !== ''
  )
})

const clearFilters = () => {
  activeCategories.value = new Set()
  activeFeatures.value = new Set()
  activeComplexity.value = ''
}

const filterKey = computed(() => {
  return (
    [...activeCategories.value].sort().join(',') +
    '|' +
    [...activeFeatures.value].sort().join(',') +
    '|' +
    activeComplexity.value +
    '|' +
    searchQuery.value
  )
})

const filteredTemplates = computed(() => {
  let result = templates

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query),
    )
  }

  if (activeCategories.value.size > 0) {
    result = result.filter((t) => activeCategories.value.has(t.category))
  }

  if (activeFeatures.value.size > 0) {
    result = result.filter((t) => {
      const tFeatures = templateFeatureCache.value.get(t.id)
      for (const f of activeFeatures.value) {
        if (tFeatures.has(f)) return true
      }
      return false
    })
  }

  if (activeComplexity.value === 'quick') {
    result = result.filter((t) => getTemplateLineCount(t) <= 8)
  } else if (activeComplexity.value === 'detailed') {
    result = result.filter((t) => getTemplateLineCount(t) > 8)
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
