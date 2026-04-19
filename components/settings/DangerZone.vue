<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <SettingsSectionHeader icon="mdi:alert-outline" title="Danger Zone" description="Irreversible account actions" />
      <UiListMenu preset="settings">
        <div class="p-4">
          <p class="text-xs text-gray-500 dark:text-gray-500 mb-3">These actions are irreversible. Your password is required to confirm.</p>
          <UiFormField label="Confirm Password"><UiInput v-model="dangerPassword" type="password" :validate="false" /></UiFormField>
          <div v-if="confirmingAction" class="rounded-lg border p-4 space-y-3 mt-3"
            :class="confirmingAction === 'data' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'">
            <div class="flex gap-2.5">
              <Icon :name="confirmingAction === 'data' ? 'mdi:database-remove-outline' : 'mdi:account-remove-outline'" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="confirmingAction === 'data' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'" />
              <div class="text-xs space-y-1.5">
                <p class="font-semibold" :class="confirmingAction === 'data' ? 'text-amber-800 dark:text-amber-200' : 'text-red-800 dark:text-red-200'">{{ confirmingAction === 'data' ? 'Reset account data?' : 'Delete your account?' }}</p>
                <p :class="confirmingAction === 'data' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'" class="leading-relaxed">{{ confirmingAction === 'data' ? 'This will permanently delete all your notes, shared notes, and related data. This cannot be undone.' : 'This will permanently delete your account and all associated data.' }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <UiButton variant="outline" color="gray" class="flex-1" @click="confirmingAction = null">Cancel</UiButton>
              <UiButton variant="solid" :color="confirmingAction === 'data' ? 'amber' : 'red'" :loading="saving" class="flex-1" @click="executeConfirmedAction">{{ confirmingAction === 'data' ? 'Delete All Data' : 'Delete Account' }}</UiButton>
            </div>
          </div>
          <div v-if="!confirmingAction" class="space-y-3 mt-3">
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
  </div>
</template>

<script setup>
const props = defineProps({
  onDeleteData: { type: Function, default: null },
  onDeleteAccount: { type: Function, default: null },
})

const toast = useToast()

const dangerPassword = ref('')
const confirmingAction = ref(null)
const saving = ref(false)

const showFeedback = (msg, type = 'success') => {
  toast.show(msg, { type: type === 'error' ? 'error' : 'success', icon: type === 'error' ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline' })
}

const handleDeleteData = async () => {
  saving.value = true
  try { await props.onDeleteData(dangerPassword.value); showFeedback('All data deleted — account reset'); dangerPassword.value = ''; confirmingAction.value = null }
  catch (err) { showFeedback(err?.data?.statusMessage || 'Failed to delete data', 'error') }
  finally { saving.value = false }
}

const handleDeleteAccount = async () => {
  saving.value = true
  try { await props.onDeleteAccount(dangerPassword.value) }
  catch (err) { showFeedback(err?.data?.statusMessage || 'Failed to delete account', 'error'); saving.value = false }
}

const executeConfirmedAction = () => {
  if (confirmingAction.value === 'data') handleDeleteData()
  else if (confirmingAction.value === 'account') handleDeleteAccount()
}

// Self-reset on mount (fresh state each time section is displayed)
onMounted(() => {
  dangerPassword.value = ''
  confirmingAction.value = null
})
</script>
