<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <TemplatesSectionHeader :icon="icon" :title="title" :description="description" />

      <!-- Filters -->
      <div class="space-y-3 mb-6">
        <div class="relative">
          <Icon name="mdi:magnify" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            v-model="localSearch"
            type="text"
            placeholder="Filter templates..."
            class="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
            @keydown.escape="localSearch = ''"
          >
          <button
            v-if="localSearch"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="localSearch = ''"
          >
            <Icon name="mdi:close" class="block w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Template grid -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
        mode="out-in"
      >
        <div v-if="filtered.length === 0" key="empty" class="text-center py-8 text-gray-400 dark:text-gray-500">
          <Icon name="mdi:file-search-outline" class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">No templates found</p>
        </div>
        <div v-else :key="localSearch" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="template in filtered"
            :key="template.id"
            type="button"
            class="text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group"
            @click="$emit('insert', template.content)"
          >
            <h4 class="font-semibold text-sm text-gray-900 dark:text-gray-200 mb-1 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
              {{ template.name }}
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ template.description }}</p>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  templates: { type: Array, required: true },
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})

defineEmits(['insert'])

const localSearch = ref('')

const filtered = computed(() => {
  if (!localSearch.value.trim()) return props.templates
  const q = localSearch.value.toLowerCase()
  return props.templates.filter(
    (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.content.toLowerCase().includes(q),
  )
})
</script>
