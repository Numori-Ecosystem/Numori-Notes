<template>
  <div
    class="relative border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
    :class="{
      'bg-white dark:bg-gray-925 border-l-4 border-l-primary-500': active && !selectMode,
      'bg-primary-50 dark:bg-primary-900/20': selectMode && selected,
    }"
    @click="handleClick"
  >
    <!-- Sync pending dot — left side, vertically centered, only for logged-in users -->
    <span
      v-if="pending && isLoggedIn"
      class="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
      title="Not synced"
    />
    <div class="p-4" :class="{ 'pl-6': pending && isLoggedIn }">
      <div class="flex items-start justify-between gap-2">
        <!-- Animated checkbox for select mode -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-0 w-0 mr-0"
          enter-to-class="opacity-100 scale-100 w-5 mr-1"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 w-5 mr-1"
          leave-to-class="opacity-0 scale-0 w-0 mr-0"
        >
          <div
            v-if="selectMode"
            class="flex-shrink-0 pt-0.5 mr-1"
            @click.stop="$emit('toggle-select', note.id)"
          >
            <div
              class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150"
              :class="
                selected
                  ? 'bg-primary-600 border-primary-600 scale-110'
                  : 'border-gray-300 dark:border-gray-600 scale-100'
              "
            >
              <Transition
                enter-active-class="transition-all duration-150 ease-out"
                enter-from-class="opacity-0 scale-0"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-100 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-0"
              >
                <Icon v-if="selected" name="mdi:check" class="w-3.5 h-3.5 text-white" />
              </Transition>
            </div>
          </div>
        </Transition>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <Icon
              v-if="shared"
              name="mdi:link-variant"
              class="w-3.5 h-3.5 flex-shrink-0 text-primary-500 dark:text-primary-400"
              title="Shared"
            />
            <h3 class="font-medium text-gray-900 dark:text-gray-400 truncate">
              {{ note.title || 'Untitled' }}
            </h3>
          </div>
          <p v-if="note.description" class="text-sm text-gray-600 dark:text-gray-500 truncate mt-1">
            {{ note.description }}
          </p>
          <div v-if="note.tags && note.tags.length" class="flex flex-wrap gap-1 mt-1.5">
            <UiBadge v-for="tag in note.tags" :key="tag">
              {{ tag }}
            </UiBadge>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {{ formatDate(note.updatedAt) }}
          </p>
        </div>

        <!-- Three-dots menu -->
        <div v-if="!selectMode" class="flex-shrink-0 self-center">
          <UiDropdown
            ref="menuDropdownRef"
            width="w-48"
            align="right"
            :drop="dropUp ? 'up' : 'down'"
            @open="onMenuOpen"
          >
            <template #trigger="{ toggle }">
              <UiButton variant="ghost" color="gray" icon-only title="Actions" @click.stop="toggle">
                <Icon name="mdi:dots-vertical" class="w-5 h-5" />
              </UiButton>
            </template>

            <!-- Bin mode: simplified menu -->
            <template v-if="binMode">
              <UiButton variant="menu-item" @click.stop="handleAction('restore')">
                <Icon name="mdi:restore" class="w-4 h-4" /> Restore
              </UiButton>
              <UiDivider color="medium" />
              <UiButton variant="menu-item" color="red" @click.stop="handleAction('permanent-delete')">
                <Icon name="mdi:delete-forever-outline" class="w-4 h-4" /> Delete permanently
              </UiButton>
            </template>

            <!-- Normal mode: full menu -->
            <template v-else>
              <UiButton variant="menu-item" @click.stop="handleAction('duplicate')">
                <Icon name="mdi:content-duplicate" class="w-4 h-4" /> Duplicate
              </UiButton>
              <UiButton variant="menu-item" @click.stop="handleAction('copy-to-clipboard')">
                <Icon name="mdi:clipboard-text-outline" class="w-4 h-4" /> Copy to clipboard
              </UiButton>
              <UiButton variant="menu-item" @click.stop="handleAction('export')">
                <Icon name="mdi:file-export-outline" class="w-4 h-4" /> Export
              </UiButton>
              <UiButton variant="menu-item" @click.stop="handleAction('print')">
                <Icon name="mdi:printer-outline" class="w-4 h-4" /> Print
              </UiButton>
              <UiDivider color="medium" />
              <UiButton variant="menu-item" @click.stop="handleAction('share')">
                <Icon name="mdi:share-variant-outline" class="w-4 h-4" />
                {{ shared ? 'Sharing details' : 'Share' }}
              </UiButton>
              <UiButton v-if="shared" variant="menu-item" @click.stop="handleCopyLink">
                <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
                {{ copied ? 'Copied' : 'Copy link' }}
              </UiButton>
              <UiButton
                v-if="shared"
                variant="menu-item"
                color="red"
                @click.stop="handleAction('unshare')"
              >
                <Icon name="mdi:link-variant-off" class="w-4 h-4" /> Stop sharing
              </UiButton>
              <UiButton
                v-if="analyticsHash"
                variant="menu-item"
                @click.stop="handleAction('analytics')"
              >
                <Icon name="mdi:chart-bar" class="w-4 h-4" /> View analytics
              </UiButton>
              <UiDivider color="medium" />
              <UiButton
                v-if="note.archived"
                variant="menu-item"
                @click.stop="handleAction('unarchive')"
              >
                <Icon name="mdi:package-up" class="w-4 h-4" /> Unarchive
              </UiButton>
              <UiButton v-else variant="menu-item" @click.stop="handleAction('archive')">
                <Icon name="mdi:archive-outline" class="w-4 h-4" /> Archive
              </UiButton>
              <UiButton variant="menu-item" @click.stop="handleAction('properties')">
                <Icon name="mdi:information-outline" class="w-4 h-4" /> Properties
              </UiButton>
              <UiButton variant="menu-item" @click.stop="handleAction('add-to-group')">
                <Icon name="mdi:folder-plus-outline" class="w-4 h-4" /> Add to group
              </UiButton>
              <UiDivider color="medium" />
              <UiButton variant="menu-item" color="red" @click.stop="handleAction('delete')">
                <Icon name="mdi:trash-can-outline" class="w-4 h-4" /> Delete
              </UiButton>
            </template>
          </UiDropdown>
        </div>
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
  analyticsHash: { type: String, default: null },
  pending: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  binMode: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select',
  'delete',
  'toggle-select',
  'share',
  'unshare',
  'properties',
  'open-analytics',
  'duplicate',
  'export',
  'copy-to-clipboard',
  'print',
  'archive',
  'unarchive',
  'add-to-group',
  'restore',
  'permanent-delete',
])

const { copy: clipboardCopy } = useClipboard()
const { apiUrl } = useApi()

const menuDropdownRef = ref(null)
const dropUp = ref(false)
const copied = ref(false)
const menuId = Math.random().toString(36).slice(2)

const handleClick = () => {
  if (props.selectMode) {
    emit('toggle-select', props.note.id)
  } else {
    emit('select', props.note.id)
  }
}

const onMenuOpen = () => {
  document.dispatchEvent(new CustomEvent('close-all-menus', { detail: { sourceId: menuId } }))
  const el = menuDropdownRef.value?.$el
  if (el) {
    const rect = el.getBoundingClientRect()
    dropUp.value = rect.bottom + 360 > window.innerHeight
  }
}

const onCloseAllMenus = (e) => {
  if (e.detail?.sourceId !== menuId) {
    menuDropdownRef.value?.close()
  }
}

const handleAction = (action) => {
  menuDropdownRef.value?.close()
  if (action === 'share') emit('share', props.note.id)
  else if (action === 'unshare') emit('unshare', props.note.id)
  else if (action === 'delete') emit('delete', props.note.id)
  else if (action === 'properties') emit('properties', props.note.id)
  else if (action === 'analytics') emit('open-analytics', props.analyticsHash)
  else if (action === 'duplicate') emit('duplicate', props.note.id)
  else if (action === 'export') emit('export', props.note.id)
  else if (action === 'copy-to-clipboard') emit('copy-to-clipboard', props.note.id)
  else if (action === 'print') emit('print', props.note.id)
  else if (action === 'archive') emit('archive', props.note.id)
  else if (action === 'unarchive') emit('unarchive', props.note.id)
  else if (action === 'add-to-group') emit('add-to-group', props.note.id)
  else if (action === 'restore') emit('restore', props.note.id)
  else if (action === 'permanent-delete') emit('permanent-delete', props.note.id)
}

const handleCopyLink = async () => {
  if (!props.shareHash) return
  await clipboardCopy(apiUrl(`/shared/${props.shareHash}`))
  copied.value = true
  setTimeout(() => {
    copied.value = false
    menuDropdownRef.value?.close()
  }, 1000)
}

onMounted(() => {
  document.addEventListener('close-all-menus', onCloseAllMenus)
})
onBeforeUnmount(() => {
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
