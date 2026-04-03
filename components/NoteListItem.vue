<template>
  <div
    @click="handleClick"
    class="p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
    :class="{
      'bg-white dark:bg-gray-925 border-l-4 border-l-primary-500': active && !selectMode,
      'bg-primary-50 dark:bg-primary-900/20': selectMode && selected
    }">
    <div class="flex items-start justify-between gap-2">
      <!-- Animated checkbox for select mode -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-0 w-0 mr-0"
        enter-to-class="opacity-100 scale-100 w-5 mr-1"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 w-5 mr-1"
        leave-to-class="opacity-0 scale-0 w-0 mr-0">
        <div v-if="selectMode" class="flex-shrink-0 pt-0.5 mr-1" @click.stop="$emit('toggle-select', note.id)">
          <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150"
            :class="selected
              ? 'bg-primary-600 border-primary-600 scale-110'
              : 'border-gray-300 dark:border-gray-600 scale-100'">
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 scale-0"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-0">
              <Icon v-if="selected" name="mdi:check" class="w-3.5 h-3.5 text-white" />
            </Transition>
          </div>
        </div>
      </Transition>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <Icon v-if="shared" name="mdi:link-variant" class="w-3.5 h-3.5 flex-shrink-0 text-primary-500 dark:text-primary-400" title="Shared" />
          <h3 class="font-medium text-gray-900 dark:text-gray-400 truncate">
            {{ note.title || 'Untitled' }}
          </h3>
        </div>
        <p v-if="note.description" class="text-sm text-gray-600 dark:text-gray-500 truncate mt-1">
          {{ note.description }}
        </p>
        <div v-if="note.tags && note.tags.length" class="flex flex-wrap gap-1 mt-1.5">
          <span v-for="tag in note.tags" :key="tag"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            {{ tag }}
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {{ formatDate(note.updatedAt) }}
        </p>
      </div>

      <!-- Three-dots menu -->
      <div v-if="!selectMode" class="relative flex-shrink-0 self-center" ref="menuRef"
        tabindex="-1" @focusout="onFocusOut">
        <button @click.stop="toggleMenu"
          class="p-2.5 -m-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg"
          title="Actions">
          <Icon name="mdi:dots-vertical" class="w-5 h-5" />
        </button>
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95">
          <div v-if="menuOpen"
            class="absolute right-0 top-full mt-1 z-20 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
            <button @click.stop="handleAction('share')"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="mdi:share-variant-outline" class="w-4 h-4" />
              {{ shared ? 'Sharing details' : 'Share' }}
            </button>
            <button v-if="shared" @click.stop="handleCopyLink"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
              {{ copied ? 'Copied' : 'Copy link' }}
            </button>
            <button v-if="shared" @click.stop="handleAction('unshare')"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Icon name="mdi:link-variant-off" class="w-4 h-4" />
              Stop sharing
            </button>
            <button v-if="analyticsHash" @click.stop="handleAction('analytics')"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="mdi:chart-bar" class="w-4 h-4" />
              View analytics
            </button>
            <div class="my-1 border-t border-gray-200 dark:border-gray-700" />
            <button @click.stop="handleAction('properties')"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="mdi:information-outline" class="w-4 h-4" />
              Properties
            </button>
            <div class="my-1 border-t border-gray-200 dark:border-gray-700" />
            <button @click.stop="handleAction('delete')"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Icon name="mdi:trash-can-outline" class="w-4 h-4" />
              Delete
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  note: { type: Object, required: true },
  active: { type: Boolean, default: false },
  selectMode: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  shared: { type: Boolean, default: false },
  shareHash: { type: String, default: null },
  analyticsHash: { type: String, default: null }
})

const emit = defineEmits(['select', 'delete', 'toggle-select', 'share', 'unshare', 'properties', 'open-analytics'])

const { copy: clipboardCopy } = useClipboard()
const { apiUrl } = useApi()

const menuOpen = ref(false)
const menuRef = ref(null)
const copied = ref(false)
const menuId = Math.random().toString(36).slice(2)

const handleClick = () => {
  if (props.selectMode) {
    emit('toggle-select', props.note.id)
  } else {
    emit('select', props.note.id)
  }
}

const toggleMenu = () => {
  const willOpen = !menuOpen.value
  if (willOpen) {
    document.dispatchEvent(new CustomEvent('close-all-menus', { detail: { sourceId: menuId } }))
  }
  menuOpen.value = willOpen
}

const onCloseAllMenus = (e) => {
  if (e.detail?.sourceId !== menuId) {
    menuOpen.value = false
  }
}

const handleAction = (action) => {
  menuOpen.value = false
  if (action === 'share') emit('share', props.note.id)
  else if (action === 'unshare') emit('unshare', props.note.id)
  else if (action === 'delete') emit('delete', props.note.id)
  else if (action === 'properties') emit('properties', props.note.id)
  else if (action === 'analytics') emit('open-analytics', props.analyticsHash)
}

const handleCopyLink = async () => {
  if (!props.shareHash) return
  await clipboardCopy(apiUrl(`/shared/${props.shareHash}`))
  copied.value = true
  setTimeout(() => { copied.value = false; menuOpen.value = false }, 1000)
}

// Close menu when focus leaves the container
const onFocusOut = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.relatedTarget)) {
    menuOpen.value = false
  }
}

// Close menu on outside click
const onClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('close-all-menus', onCloseAllMenus)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('close-all-menus', onCloseAllMenus)
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return date.toLocaleDateString()
}
</script>
