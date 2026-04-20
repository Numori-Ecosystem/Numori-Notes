<template>
  <header
    class="bg-gray-100 dark:bg-gray-900 flex-shrink-0"
    :style="{
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
    }"
  >
    <div class="flex items-stretch gap-1.5 px-3 py-1.5">
      <!-- Left: Title + controls stack -->
      <div class="flex flex-col flex-1 min-w-0 gap-0.5">
        <!-- Top row: Centered title -->
        <UiButton
          variant="ghost"
          color="gray"
          class="text-center min-w-0 px-1 py-0.5 mb-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-md"
          @click="$emit('show-meta')"
        >
          <h1 class="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-400 truncate">
            {{ currentNote?.title || 'Numori' }}
          </h1>
        </UiButton>

      <!-- Bottom row: All controls -->
      <div class="flex items-center gap-1">
        <!-- Left: Sidebar toggle + dropdowns -->
        <div class="flex items-center gap-0.5">
          <UiButton
            variant="ghost"
            color="gray"
            icon-only
            title="Toggle notes list"
            @click="$emit('toggle-sidebar')"
          >
            <Icon name="mdi:menu" class="w-4.5 h-4.5 block" />
          </UiButton>
          <FileDropdown
            :has-note="!!currentNote"
            :mod-label="modLabel"
            :selection-count="selectionCount"
            @new-note="$emit('file-new')"
            @open-file="$emit('file-open')"
            @duplicate="$emit('file-duplicate')"
            @save="$emit('file-save')"
            @backup="$emit('file-backup')"
            @restore="$emit('file-restore')"
            @copy="$emit('file-copy')"
            @print="$emit('file-print')"
          />
          <ViewDropdown
            :markdown-mode="markdownMode"
            :editor-font-size="editorFontSize"
            :check-for-update="checkForUpdate"
            @update:markdown-mode="(mode) => $emit('update:markdown-mode', mode)"
            @zoom-in="$emit('zoom-in')"
            @zoom-out="$emit('zoom-out')"
            @zoom-reset="$emit('zoom-reset')"
            @toggle-focus="$emit('toggle-focus')"
            @templates="$emit('show-templates')"
            @help="$emit('show-help')"
            @about="$emit('file-about')"
          />
        </div>

        <!-- Center: Markdown formatting (desktop only) -->
        <FormattingToolbar
          class="hidden lg:flex flex-1 justify-center"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @apply-format="(before, after) => $emit('apply-format', before, after)"
          @indent="$emit('indent')"
          @outdent="$emit('outdent')"
          @undo="$emit('undo')"
          @redo="$emit('redo')"
        />

        <!-- Spacer on mobile -->
        <div class="flex-1 lg:hidden" />

        <!-- Right: Actions -->
        <div class="flex items-center gap-0.5">
          <!-- Inline results mode group -->
          <UiButtonsGroup
            :model-value="inlineMode"
            :options="[
              { value: 'left', icon: 'mdi:dock-left', title: 'Results on left' },
              { value: 'off', icon: 'mdi:eye-off-outline', title: 'Results off' },
              { value: 'right', icon: 'mdi:dock-right', title: 'Results on right' },
            ]"
            @update:model-value="$emit('update:inline-mode', $event)"
          />
        </div>
      </div>
      </div>

      <!-- User avatar dropdown -->
      <UiDropdown ref="avatarDropdownRef" align="right" width="w-64" class="mr-1.5">
        <template #trigger="{ toggle }">
          <button
            class="flex-shrink-0 aspect-square h-full rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-0 flex items-center justify-center"
            @click="toggle"
          >
            <UiAvatar
              v-if="isLoggedIn"
              :src="user?.avatarUrl"
              size="lg"
            />
            <UiAvatar
              v-else
              size="lg"
              color="gray"
              fallback-icon="mdi:account-circle-outline"
            />
          </button>
        </template>

        <div class="py-1">
          <template v-if="isLoggedIn">
            <UiButton variant="menu-item" class="px-4" @click="avatarAction('edit-profile')">
              <Icon name="mdi:account-edit-outline" class="w-4 h-4" />
              Edit Profile
            </UiButton>
          </template>
          <template v-else>
            <UiButton variant="menu-item" class="px-4" @click="avatarAction('show-auth')">
              <Icon name="mdi:login" class="w-4 h-4" />
              Sign In / Sign Up
            </UiButton>
          </template>
          <UiButton variant="menu-item" class="px-4" @click="avatarAction('show-locale-settings-locales')">
            <Icon name="mdi:translate" class="w-4 h-4" />
            Language
          </UiButton>
          <UiButton variant="menu-item" class="px-4" @click="avatarAction('show-locale-settings-shared-notes')">
            <Icon name="mdi:share-variant-outline" class="w-4 h-4" />
            Shared Notes
          </UiButton>

          <UiDivider class="my-1" />

          <UiButton variant="menu-item" class="px-4" @click="avatarAction('show-locale-settings-sessions')">
            <Icon name="mdi:devices" class="w-4 h-4" />
            Sessions
          </UiButton>
          <UiButton variant="menu-item" class="px-4" @click="avatarAction('show-locale-settings-security')">
            <Icon name="mdi:shield-lock-outline" class="w-4 h-4" />
            Security
          </UiButton>

          <UiDivider class="my-1" />

          <UiButton variant="menu-item" class="px-4" @click="avatarAction('show-locale-settings')">
            <Icon name="mdi:cog-outline" class="w-4 h-4" />
            Settings
          </UiButton>

          <UiDivider class="my-1 mb-3" />

          <!-- Sign out / Lock (logged in) or Sign In / Sign Up (logged out) -->
          <template v-if="isLoggedIn">
            <UiDropdownRow>
              <UiButton
                v-if="appLockEnabled"
                variant="menu-item"
                class="flex-1 justify-center"
                @click="avatarAction('lock-app')"
              >
                <Icon name="mdi:lock" class="w-4 h-4" />
                Lock
              </UiButton>
              <UiDivider v-if="appLockEnabled" direction="vertical" />
              <UiButton
                variant="menu-item"
                color="red"
                class="flex-1 justify-center"
                @click="avatarAction('logout')"
              >
                <Icon name="mdi:logout" class="w-4 h-4" />
                Sign Out
              </UiButton>
            </UiDropdownRow>
          </template>
          <template v-else>
            <UiDropdownRow>
              <UiButton
                variant="menu-item"
                class="flex-1 justify-center"
                @click="avatarAction('show-auth')"
              >
                <Icon name="mdi:login" class="w-4 h-4" />
                Sign In / Sign Up
              </UiButton>
            </UiDropdownRow>
          </template>
        </div>
      </UiDropdown>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentNote: {
    type: Object,
    default: null,
  },
  inlineMode: {
    type: String,
    default: 'left',
  },
  markdownMode: {
    type: String,
    default: 'edit',
  },
  modLabel: {
    type: String,
    default: 'Ctrl',
  },
  selectionCount: {
    type: Number,
    default: 0,
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
  appLockEnabled: {
    type: Boolean,
    default: false,
  },
  canUndo: {
    type: Boolean,
    default: false,
  },
  canRedo: {
    type: Boolean,
    default: false,
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
  'toggle-sidebar',
  'toggle-focus',
  'show-meta',
  'show-templates',
  'show-help',
  'apply-format',
  'indent',
  'outdent',
  'update:inline-mode',
  'update:markdown-mode',
  'zoom-in',
  'zoom-out',
  'zoom-reset',
  'undo',
  'redo',
  'file-new',
  'file-open',
  'file-duplicate',
  'file-save',
  'file-backup',
  'file-restore',
  'file-copy',
  'file-print',
  'file-about',
  'edit-profile',
  'show-auth',
  'show-locale-settings',
  'show-locale-settings-locales',
  'show-locale-settings-security',
  'show-locale-settings-sessions',
  'show-locale-settings-shared-notes',
  'lock-app',
  'logout',
])

const avatarDropdownRef = ref(null)

const avatarAction = (action) => {
  avatarDropdownRef.value?.close()
  emit(action)
}
</script>
