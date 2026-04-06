<template>
  <div class="relative" ref="dropdownRef">
    <button @click="open = !open"
      class="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title="View menu">
      <Icon name="mdi:eye-outline" class="w-4.5 h-4.5 block" />
      <span class="hidden sm:inline text-sm">View</span>
      <Icon name="mdi:chevron-down" class="w-3 h-3 block transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-show="open"
        class="absolute left-0 mt-1 w-48 sm:w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">

        <!-- Zoom controls -->
        <div class="flex items-center gap-1 px-3 py-1.5">
          <button @click="$emit('zoom-out')" :disabled="zoomPercent <= MIN_ZOOM"
            class="p-1 rounded transition-colors"
            :class="zoomPercent <= MIN_ZOOM ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'"
            title="Zoom out">
            <Icon name="mdi:magnify-minus-outline" class="w-4.5 h-4.5 block" />
          </button>
          <button @click="$emit('zoom-reset')" :title="zoomPercent === 100 ? 'Zoom at 100%' : 'Reset zoom to 100%'"
            class="flex-1 text-center text-sm rounded px-1 py-0.5 min-w-0 transition-colors"
            :class="zoomPercent === 100 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'">
            {{ zoomPercent }}%
          </button>
          <button @click="$emit('zoom-in')" :disabled="zoomPercent >= MAX_ZOOM"
            class="p-1 rounded transition-colors"
            :class="zoomPercent >= MAX_ZOOM ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'"
            title="Zoom in">
            <Icon name="mdi:magnify-plus-outline" class="w-4.5 h-4.5 block" />
          </button>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <div class="px-3 pt-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Markdown</div>

        <button v-for="opt in mdOptions" :key="opt.value"
          @click="setMarkdownMode(opt.value)"
          class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
          :class="markdownMode === opt.value
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'">
          <Icon :key="opt.value + '-' + markdownMode" :name="markdownMode === opt.value ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'" class="w-4 h-4 block flex-shrink-0" />
          <span>{{ opt.label }}</span>
        </button>

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <DropdownItem icon="mdi:file-document-outline" label="Templates" @click="action('templates')" />
        <DropdownItem icon="mdi:help-circle-outline" label="Help" @click="action('help')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <DropdownItem icon="mdi:information-outline" label="About" @click="action('about')" />
        <button @click="handleCheckUpdate" :disabled="updateChecking"
          class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50">
          <Icon :name="updateChecking ? 'mdi:loading' : updateResultIcon" class="w-4 h-4 block flex-shrink-0" :class="{ 'animate-spin': updateChecking, [updateResultColor]: !updateChecking && updateResult }" />
          <span>{{ updateLabel }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const BASE_FONT_SIZE = 16
const MIN_ZOOM = 63
const MAX_ZOOM = 175

const props = defineProps({
  markdownMode: {
    type: String,
    default: 'edit',
    validator: (v) => ['off', 'edit', 'full'].includes(v),
  },
  editorFontSize: {
    type: Number,
    default: 16,
  },
  checkForUpdate: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits([
  'update:markdown-mode',
  'zoom-in',
  'zoom-out',
  'zoom-reset',
  'templates',
  'help',
  'about',
])

const zoomPercent = computed(() =>
  Math.round((props.editorFontSize / BASE_FONT_SIZE) * 100)
)

const mdOptions = [
  { value: 'edit', label: 'View & Edit' },
  { value: 'full', label: 'View Only' },
  { value: 'off', label: 'Edit Only' },
]

const open = ref(false)
const dropdownRef = ref(null)

const setMarkdownMode = (mode) => {
  open.value = false
  emit('update:markdown-mode', mode)
}

const action = (name) => {
  open.value = false
  emit(name)
}

onClickOutside(dropdownRef, () => {
  open.value = false
})

useEventListener(document, 'keydown', (e) => {
  if (e.key === 'Escape') open.value = false
})

const updateChecking = ref(false)
const updateResult = ref('')
let updateResultTimer = null

const updateLabel = computed(() => {
  if (updateChecking.value) return 'Checking...'
  if (updateResult.value === 'available') return 'Update available'
  if (updateResult.value === 'up-to-date') return 'Up to date'
  if (updateResult.value === 'error') return 'Check failed'
  return 'Check for updates'
})

const updateResultIcon = computed(() => {
  if (updateResult.value === 'available') return 'mdi:arrow-up-circle-outline'
  if (updateResult.value === 'up-to-date') return 'mdi:check-circle-outline'
  if (updateResult.value === 'error') return 'mdi:alert-circle-outline'
  return 'mdi:update'
})

const updateResultColor = computed(() => {
  if (updateResult.value === 'available') return 'text-primary-500'
  if (updateResult.value === 'up-to-date') return 'text-green-500'
  if (updateResult.value === 'error') return 'text-red-500'
  return ''
})

const handleCheckUpdate = async () => {
  if (!props.checkForUpdate || updateChecking.value) return
  updateChecking.value = true
  updateResult.value = ''
  clearTimeout(updateResultTimer)
  const result = await props.checkForUpdate(true)
  updateChecking.value = false
  updateResult.value = result
  updateResultTimer = setTimeout(() => { updateResult.value = '' }, 4000)
}
</script>
