<template>
  <UiPrompt
    :show="isOpen"
    title="Back-up"
    icon="mdi:backup-restore"
    :confirm-on-enter="false"
    @close="handleClose"
  >
    <div class="space-y-5">
      <!-- Encrypt -->
      <div class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Security
        </p>
        <div
          class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <UiCheckbox v-model="encrypt" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Encrypt with password</span>
            </div>
            <Icon name="mdi:lock-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
          <div v-if="encrypt" class="px-3 pb-3 pt-1">
            <UiInput
              v-model="password"
              type="password"
              placeholder="Enter a password"
            />
          </div>
        </div>
      </div>

      <!-- Scope -->
      <div class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          What to back up
        </p>
        <div
          class="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden"
        >
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            :class="{ 'opacity-50 pointer-events-none': !hasNote }"
          >
            <UiRadio v-model="scope" value="current" name="backup-scope" :disabled="!hasNote" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Current note only</span>
            </div>
            <Icon name="mdi:note-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <UiRadio v-model="scope" value="all" name="backup-scope" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">All notes</span>
            </div>
            <Icon name="mdi:note-multiple-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
        </div>
      </div>

      <!-- Include -->
      <div v-if="scope === 'all'" class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Include
        </p>
        <div
          class="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden"
        >
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <UiCheckbox v-model="includeGroups" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Groups</span>
            </div>
            <Icon name="mdi:folder-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <UiCheckbox v-model="includeArchive" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Archive</span>
            </div>
            <Icon name="mdi:archive-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <UiCheckbox v-model="includeBin" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Bin</span>
            </div>
            <Icon name="mdi:delete-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 leading-relaxed px-0.5">
          With "Groups" checked, notes keep their group structure. Without it, notes export flat.
        </p>
      </div>
    </div>

    <template #actions>
      <UiButton variant="ghost" color="gray" @click="handleClose">Cancel</UiButton>
      <UiButton :disabled="encrypt && !password.trim()" @click="handleConfirm">
        <Icon name="mdi:download" class="w-4 h-4" />
        Back-up
      </UiButton>
    </template>
  </UiPrompt>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  hasNote: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const scope = ref('all')
const includeGroups = ref(true)
const includeArchive = ref(false)
const includeBin = ref(false)
const encrypt = ref(false)
const password = ref('')

watch(() => props.isOpen, (open) => {
  if (open) {
    scope.value = props.hasNote ? 'current' : 'all'
    includeGroups.value = true
    includeArchive.value = false
    includeBin.value = false
    encrypt.value = false
    password.value = ''
  }
})

const handleClose = () => emit('close')

const handleConfirm = () => {
  emit('confirm', {
    scope: scope.value,
    includeGroups: includeGroups.value,
    includeArchive: includeArchive.value,
    includeBin: includeBin.value,
    encrypt: encrypt.value,
    password: encrypt.value ? password.value : null,
  })
}
</script>
