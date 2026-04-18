<template>
  <div>
    <!-- Group header -->
    <div
      @click="$emit('toggle-collapse', group.id)"
      class="relative flex items-center gap-2 px-4 py-2.5 cursor-pointer border-b border-gray-200 dark:border-gray-800 bg-gray-100/60 dark:bg-gray-850/60 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors"
      :class="{
        'border-t-2 border-t-primary-500': dropIndicator === 'before',
        'border-b-2 border-b-primary-500': dropIndicator === 'after',
        'ring-2 ring-inset ring-primary-400 bg-primary-50/50 dark:bg-primary-900/20': dropIndicator === 'inside'
      }">
      <Icon
        :name="group.collapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'"
        class="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-150" />
      <Icon name="mdi:folder-outline" class="w-4 h-4 flex-shrink-0 text-primary-500 dark:text-primary-400" />
      <div class="flex-1 min-w-0">
        <span class="text-sm font-medium text-gray-800 dark:text-gray-300 truncate block">
          {{ group.name }}
        </span>
      </div>
      <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        {{ noteCount }}
      </span>
      <!-- Three-dots menu -->
      <div class="relative flex-shrink-0" ref="menuRef" tabindex="-1" @focusout="onFocusOut">
        <UiButton @click.stop="toggleMenu" variant="ghost" color="gray" icon-only class="-m-1"
          title="Group actions">
          <Icon name="mdi:dots-vertical" class="w-4 h-4" />
        </UiButton>
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95">
          <div v-show="menuOpen"
            class="absolute right-0 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
            :class="dropUp ? 'bottom-full mb-1' : 'top-full mt-1'">
            <UiButton @click.stop="handleAction('edit')" variant="menu-item">
              <Icon name="mdi:pencil-outline" class="w-4 h-4" />
              Edit Group
            </UiButton>
            <UiDivider color="medium" />
            <UiButton @click.stop="handleAction('delete')" variant="menu-item" color="red">
              <Icon name="mdi:trash-can-outline" class="w-4 h-4" />
              Delete Group
            </UiButton>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  group: { type: Object, required: true },
  noteCount: { type: Number, default: 0 },
  dropIndicator: { type: String, default: null }, // 'before' | 'after' | 'inside' | null
})

const emit = defineEmits(['toggle-collapse', 'edit', 'delete'])

const menuOpen = ref(false)
const menuRef = ref(null)
const dropUp = ref(false)
const menuId = Math.random().toString(36).slice(2)

const toggleMenu = () => {
  const willOpen = !menuOpen.value
  if (willOpen) {
    document.dispatchEvent(new CustomEvent('close-all-menus', { detail: { sourceId: menuId } }))
    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect()
      dropUp.value = rect.bottom + 120 > window.innerHeight
    }
  }
  menuOpen.value = willOpen
}

const handleAction = (action) => {
  menuOpen.value = false
  if (action === 'edit') emit('edit', props.group.id)
  else if (action === 'delete') emit('delete', props.group.id)
}

const onFocusOut = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.relatedTarget)) {
    menuOpen.value = false
  }
}

const onClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

const onCloseAllMenus = (e) => {
  if (e.detail?.sourceId !== menuId) menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('close-all-menus', onCloseAllMenus)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('close-all-menus', onCloseAllMenus)
})
</script>
