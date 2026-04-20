<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <SettingsSectionHeader icon="mdi:alert-outline" title="Danger Zone" description="Irreversible account actions" />
      <UiListMenu preset="settings">
        <div class="p-4">
          <!-- Backup suggestion -->
          <div class="flex items-start gap-3 p-3 mb-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40">
            <Icon name="mdi:shield-alert-outline" class="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-orange-700 dark:text-orange-300">It's recommend to create a backup before performing any destructive action.</p>
              <UiButton variant="ghost" color="gray" size="xs" class="mt-2 !text-orange-600 dark:!text-orange-400" @click="showBackupModal = true">
                <Icon name="mdi:backup-restore" class="w-3.5 h-3.5" /> Create Backup
              </UiButton>
            </div>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-500 mb-3">These actions are irreversible. Your password is required to confirm.</p>
          <UiFormField label="Confirm Password"><UiInput v-model="dangerPassword" type="password" :validate="false" /></UiFormField>
          <div class="space-y-3 mt-3">
            <UiButton variant="solid" color="amber" block :loading="saving" :disabled="!dangerPassword" @click="confirmingAction = 'data'">
              <Icon v-if="!saving" name="mdi:database-remove-outline" class="w-4 h-4" /> Delete All Data
            </UiButton>
            <p class="text-xs text-gray-500 dark:text-gray-500">Resets your account. All notes and data permanently deleted.</p>
            <UiButton variant="solid" color="red" block :loading="saving" :disabled="!dangerPassword" @click="confirmingAction = 'account'">
              <Icon v-if="!saving" name="mdi:account-remove-outline" class="w-4 h-4" /> Delete Account
            </UiButton>
            <p class="text-xs text-gray-500 dark:text-gray-500">Permanently deletes your account and all data. Cannot be undone.</p>
          </div>
        </div>
      </UiListMenu>
    </div>

    <SettingsConfirmModal
      :is-open="confirmingAction === 'data'"
      title="Reset account data?"
      icon="mdi:database-remove-outline"
      confirm-label="Delete All Data"
      confirm-color="amber"
      :loading="saving"
      @close="confirmingAction = null"
      @confirm="handleDeleteData"
    >
      This will permanently delete all your notes, shared notes, and related data. This cannot be undone.
    </SettingsConfirmModal>

    <SettingsConfirmModal
      :is-open="confirmingAction === 'account'"
      title="Delete your account?"
      icon="mdi:account-remove-outline"
      confirm-label="Delete Account"
      confirm-color="red"
      :loading="saving"
      @close="confirmingAction = null"
      @confirm="handleDeleteAccount"
    >
      This will permanently delete your account and all associated data.
    </SettingsConfirmModal>

    <BackupModal
      :is-open="showBackupModal"
      :has-note="false"
      @close="showBackupModal = false"
      @confirm="handleBackupConfirm"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  onDeleteData: { type: Function, default: null },
  onDeleteAccount: { type: Function, default: null },
  onBackup: { type: Function, default: null },
})

const toast = useToast()
const { register: registerBack, unregister: unregisterBack } = useBackButton()

const dangerPassword = ref('')
const confirmingAction = ref(null)
const saving = ref(false)
const showBackupModal = ref(false)

// Intercept back/escape when BackupModal is open so it closes before the settings modal
let backHandlerId = null

watch(showBackupModal, (open) => {
  if (open) {
    backHandlerId = registerBack(() => {
      showBackupModal.value = false
      return true
    }, 20) // higher than settings modal's priority (10)
  } else if (backHandlerId !== null) {
    unregisterBack(backHandlerId)
    backHandlerId = null
  }
})

onBeforeUnmount(() => {
  if (backHandlerId !== null) {
    unregisterBack(backHandlerId)
    backHandlerId = null
  }
})

const showFeedback = (msg, type = 'success') => {
  toast.show(msg, { type: type === 'error' ? 'error' : 'success', icon: type === 'error' ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline' })
}

const handleBackupConfirm = (options) => {
  showBackupModal.value = false
  if (props.onBackup) props.onBackup(options)
}

const handleDeleteData = async () => {
  saving.value = true
  try { await props.onDeleteData(dangerPassword.value); showFeedback('All data deleted — account reset'); dangerPassword.value = '' }
  catch (err) { showFeedback(err?.data?.statusMessage || 'Failed to delete data', 'error') }
  finally { saving.value = false; confirmingAction.value = null }
}

const handleDeleteAccount = async () => {
  saving.value = true
  try { await props.onDeleteAccount(dangerPassword.value) }
  catch (err) { showFeedback(err?.data?.statusMessage || 'Failed to delete account', 'error') }
  finally { saving.value = false; confirmingAction.value = null }
}

// Self-reset on mount (fresh state each time section is displayed)
onMounted(() => {
  dangerPassword.value = ''
  confirmingAction.value = null
})
</script>
