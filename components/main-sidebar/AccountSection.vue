<template>
  <div
    class="flex-shrink-0 bg-gray-100/80 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700"
  >
    <UiDropdown
      ref="accountDropdownRef"
      drop="up"
      panel-class="absolute bottom-full left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
    >
      <template #trigger="{ toggle }">
        <!-- Logged-in state -->
        <UiButton v-if="isLoggedIn" variant="list-item" class="text-left" @click="toggle">
          <UiAvatar :src="user?.avatarUrl" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
              {{ user?.name || 'No name' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
          </div>
          <Icon
            name="mdi:chevron-down"
            class="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': accountDropdownRef?.isOpen }"
          />
        </UiButton>

        <!-- Logged-out state -->
        <UiButton v-else variant="list-item" class="text-left" @click="toggle">
          <UiAvatar color="gray" fallback-icon="mdi:account-circle-outline" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-200">Guest</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Not signed in</p>
          </div>
          <Icon
            name="mdi:chevron-down"
            class="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': accountDropdownRef?.isOpen }"
          />
        </UiButton>
      </template>

      <div class="py-1">
        <template v-if="isLoggedIn">
          <UiButton variant="menu-item" class="px-4" @click="accountAction('edit-profile')">
            <Icon name="mdi:account-edit-outline" class="w-4 h-4" />
            Edit Profile
          </UiButton>
        </template>
        <template v-else>
          <UiButton variant="menu-item" class="px-4" @click="accountAction('show-auth')">
            <Icon name="mdi:login" class="w-4 h-4" />
            Sign In / Sign Up
          </UiButton>
        </template>
        <UiButton variant="menu-item" class="px-4" @click="accountAction('show-locale-settings')">
          <Icon name="mdi:cog-outline" class="w-4 h-4" />
          Settings
        </UiButton>
        <template v-if="isLoggedIn">
          <UiDropdownRow>
            <UiButton
              v-if="appLockEnabled"
              variant="menu-item"
              class="flex-1 justify-center"
              @click="accountAction('lock-app')"
            >
              <Icon name="mdi:lock" class="w-4 h-4" />
              Lock
            </UiButton>
            <UiDivider v-if="appLockEnabled" direction="vertical" />
            <UiButton
              variant="menu-item"
              color="red"
              class="flex-1 justify-center"
              @click="accountAction('logout')"
            >
              <Icon name="mdi:logout" class="w-4 h-4" />
              Sign Out
            </UiButton>
          </UiDropdownRow>
        </template>
      </div>
    </UiDropdown>
  </div>
</template>

<script setup>
defineProps({
  isLoggedIn: { type: Boolean, required: true },
  user: { type: Object, default: null },
  appLockEnabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'edit-profile',
  'show-auth',
  'show-locale-settings',
  'lock-app',
  'logout',
])

const accountDropdownRef = ref(null)

const accountAction = (action) => {
  accountDropdownRef.value?.close()
  emit(action)
}
</script>
