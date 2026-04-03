<template>
  <div class="relative" ref="menuRef" tabindex="-1" @focusout="onFocusOut">
    <button @click="handleClick"
      class="p-2 rounded-lg transition-colors leading-none"
      :class="isLoggedIn
        ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850'"
      :title="isLoggedIn ? user?.name || user?.email || 'Account' : 'Sign in'">
      <img v-if="isLoggedIn && user?.avatarUrl" :src="user.avatarUrl" class="w-5 h-5 rounded-full object-cover block" alt="Avatar" />
      <Icon v-else :name="isLoggedIn ? 'mdi:account-circle' : 'mdi:account-circle-outline'" class="w-5 h-5 block" />
    </button>

    <!-- Dropdown (opens upward) -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1">
      <div v-if="open && isLoggedIn"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">

        <!-- User info -->
        <div class="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ user?.name || 'No name' }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-500 truncate">{{ user?.email }}</p>
        </div>

        <!-- Menu items -->
        <div class="py-1">
          <button @click="handleAction('profile')"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Icon name="mdi:account-edit-outline" class="w-4 h-4" />
            Edit Profile
          </button>
          <button @click="handleAction('logout')"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Icon name="mdi:logout" class="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  isLoggedIn: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['sign-in', 'logout', 'edit-profile'])

const open = ref(false)
const menuRef = ref(null)
const menuId = Math.random().toString(36).slice(2)

// Close on outside click
const onClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    open.value = false
  }
}

// Close when focus leaves the container
const onFocusOut = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.relatedTarget)) {
    open.value = false
  }
}

// Close when another menu opens
const onCloseAllMenus = (e) => {
  if (e.detail?.sourceId !== menuId) {
    open.value = false
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

const handleClick = () => {
  if (!props.isLoggedIn) {
    emit('sign-in')
    return
  }
  const willOpen = !open.value
  if (willOpen) {
    document.dispatchEvent(new CustomEvent('close-all-menus', { detail: { sourceId: menuId } }))
  }
  open.value = willOpen
}

const handleAction = (action) => {
  open.value = false
  if (action === 'profile') emit('edit-profile')
  if (action === 'logout') emit('logout')
}
</script>
