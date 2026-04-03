<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen"
            class="bg-white dark:bg-gray-925 rounded-lg max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div class="flex items-center gap-2">
                <button v-if="activeSection !== 'main'" @click="activeSection = 'main'"
                  class="flex items-center gap-1 px-2 py-1 -ml-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                  <Icon name="mdi:arrow-left" class="block w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
                  {{ activeSection === 'main' ? 'Profile' : sectionTitle }}
                </h2>
              </div>
              <button @click="$emit('close')"
                class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-5 py-4">

              <!-- Feedback message -->
              <div v-if="feedback" class="mb-3 px-3 py-2 rounded-lg text-xs"
                :class="feedbackType === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'">
                {{ feedback }}
              </div>

              <!-- ═══ Main section ═══ -->
              <div v-if="activeSection === 'main'" class="space-y-4">

                <!-- Avatar + name -->
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="user?.avatarUrl" :src="user.avatarUrl" class="w-full h-full object-cover" alt="Avatar" />
                    <Icon v-else name="mdi:account" class="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ user?.name || 'No name set' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500 truncate">{{ user?.email }}</p>
                  </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 gap-2">
                  <div class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-200">{{ user?.stats?.notesCount ?? '—' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">Cloud notes</p>
                  </div>
                  <div class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-200">{{ user?.stats?.sharedCount ?? '—' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">Shared notes</p>
                  </div>
                </div>

                <!-- Sync status -->
                <div class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div class="flex items-center gap-2">
                    <Icon name="mdi:cloud-sync-outline" class="w-4 h-4 text-gray-500" />
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                      {{ lastSyncedAt ? `Last synced ${formatDate(lastSyncedAt)}` : 'Never synced' }}
                    </span>
                  </div>
                </div>

                <!-- Deletion requested warning -->
                <div v-if="user?.deletionRequestedAt"
                  class="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ Account deletion requested. Contact support to cancel.
                </div>

                <!-- Menu items -->
                <div class="space-y-1">
                  <button @click="activeSection = 'edit'"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Icon name="mdi:account-edit-outline" class="w-5 h-5 text-gray-400" />
                    Edit Profile
                  </button>
                  <button @click="openSharedSection"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Icon name="mdi:share-variant-outline" class="w-5 h-5 text-gray-400" />
                    Shared Notes
                    <span v-if="user?.stats?.sharedCount" class="ml-auto text-xs text-gray-400">{{ user.stats.sharedCount }}</span>
                  </button>
                  <button @click="activeSection = 'password'"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Icon name="mdi:lock-outline" class="w-5 h-5 text-gray-400" />
                    Change Password
                  </button>
                  <button @click="activeSection = 'danger'"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Icon name="mdi:alert-outline" class="w-5 h-5" />
                    Data &amp; Account Deletion
                  </button>
                </div>

                <!-- Privacy toggle -->
                <div class="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Icon name="mdi:shield-account-outline" class="w-4 h-4 text-gray-500" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Privacy protection</span>
                      <div class="relative group">
                        <Icon name="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                          <p class="font-medium mb-1">Privacy Protection</p>
                          <p>Controls what data others can collect when you view their shared notes.</p>
                          <p class="mt-1.5 font-medium">When enabled (default):</p>
                          <ul class="list-disc pl-3 mt-0.5 space-y-0.5">
                            <li>Your name will not be visible to the note sharer</li>
                            <li>Your device and browser information won't be recorded</li>
                            <li>You will appear as "Unknown" in their analytics</li>
                            <li>Only the fact that someone viewed the note is recorded</li>
                          </ul>
                          <p class="mt-1.5 font-medium">When disabled:</p>
                          <ul class="list-disc pl-3 mt-0.5 space-y-0.5">
                            <li>Your display name may be shown to the note sharer</li>
                            <li>Your browser and device info may be recorded</li>
                          </ul>
                          <p class="mt-1.5 text-gray-300">Your email is never shared regardless of this setting.</p>
                          <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      </div>
                    </div>
                    <button @click="togglePrivacy" :disabled="savingPrivacy"
                      class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="privacyNoTracking ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                      role="switch" :aria-checked="privacyNoTracking">
                      <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="privacyNoTracking ? 'translate-x-4' : 'translate-x-0'" />
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    {{ privacyNoTracking ? 'Your identity is hidden when viewing shared notes' : 'Note sharers can see your name and device info' }}
                  </p>
                </div>

                <!-- Member since -->
                <p class="text-xs text-gray-400 dark:text-gray-600 text-center pt-2">
                  Member since {{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' }}
                </p>
              </div>

              <!-- ═══ Edit Profile ═══ -->
              <div v-else-if="activeSection === 'edit'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
                  <input v-model="editName" type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Your name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email</label>
                  <input v-model="editEmail" type="email"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Avatar URL</label>
                  <input v-model="editAvatarUrl" type="url"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="https://example.com/avatar.jpg" />
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Link to an image hosted elsewhere</p>
                </div>
                <button @click="saveProfile" :disabled="saving"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                  Save Changes
                </button>
              </div>

              <!-- ═══ Change Password ═══ -->
              <div v-else-if="activeSection === 'password'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Current Password</label>
                  <input v-model="currentPassword" type="password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">New Password</label>
                  <input v-model="newPassword" type="password" minlength="8"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">At least 8 characters</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm New Password</label>
                  <input v-model="confirmNewPassword" type="password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                  <p v-if="confirmNewPassword && newPassword !== confirmNewPassword" class="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match</p>
                </div>
                <button @click="savePassword" :disabled="saving || !currentPassword || !newPassword || newPassword !== confirmNewPassword"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                  Update Password
                </button>
              </div>

              <!-- ═══ Danger Zone ═══ -->
              <div v-else-if="activeSection === 'danger'" class="space-y-4">
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  These actions are irreversible. Your password is required to confirm.
                </p>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm Password</label>
                  <input v-model="dangerPassword" type="password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                </div>

                <div class="space-y-2">
                  <button @click="handleDeleteData" :disabled="saving || !dangerPassword"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                    <Icon v-else name="mdi:database-remove-outline" class="w-4 h-4" />
                    Delete All Cloud Data
                  </button>
                  <p class="text-xs text-gray-500 dark:text-gray-500">Removes all synced notes and shared notes from the server. Your account stays active. Local notes are not affected.</p>

                  <button @click="handleDeleteAccount" :disabled="saving || !dangerPassword"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                    <Icon v-else name="mdi:account-remove-outline" class="w-4 h-4" />
                    Request Account Deletion
                  </button>
                  <p class="text-xs text-gray-500 dark:text-gray-500">Marks your account for permanent deletion. All data will be removed. You will be signed out.</p>
                </div>
              </div>

              <!-- ═══ Shared Notes ═══ -->
              <div v-else-if="activeSection === 'shared'" class="space-y-3">
                <div v-if="loadingShared" class="flex items-center justify-center py-8">
                  <Icon name="mdi:loading" class="w-6 h-6 text-gray-400 animate-spin" />
                </div>
                <template v-else-if="sharedNotes.length">
                  <div v-for="sn in sharedNotes" :key="sn.hash"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ sn.title || 'Untitled' }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-500">
                        {{ sn.anonymous ? 'Anonymous' : '' }}
                        {{ sn.anonymous && sn.expiresAt ? ' · ' : '' }}
                        {{ formatExpiry(sn.expiresAt) }}
                      </p>
                    </div>
                    <button @click="copySharedLink(sn.hash)"
                      class="flex-shrink-0 p-1.5 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                      title="Copy link">
                      <Icon :name="copiedHash === sn.hash ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
                    </button>
                    <button @click="handleUnshare(sn.hash)"
                      class="flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Stop sharing">
                      <Icon name="mdi:link-variant-off" class="w-4 h-4" />
                    </button>
                  </div>
                </template>
                <div v-else class="text-center py-8">
                  <Icon name="mdi:share-variant-outline" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p class="text-sm text-gray-500 dark:text-gray-500">No shared notes</p>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  user: { type: Object, default: null },
  lastSyncedAt: { type: String, default: null }
})

const emit = defineEmits(['close', 'update-profile', 'change-password', 'delete-data', 'delete-account', 'logout', 'unshare'])

const activeSection = ref('main')
const feedback = ref(null)
const feedbackType = ref('success')
const saving = ref(false)

// Edit profile fields
const editName = ref('')
const editEmail = ref('')
const editAvatarUrl = ref('')

// Password fields
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

// Danger zone
const dangerPassword = ref('')

// Shared notes
const sharedNotes = ref([])
const loadingShared = ref(false)
const { apiFetch, apiUrl } = useApi()

// Privacy
const privacyNoTracking = ref(true)
const savingPrivacy = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) {
    privacyNoTracking.value = props.user?.privacyNoTracking !== false
    activeSection.value = 'main'
    feedback.value = null
    editName.value = props.user?.name || ''
    editEmail.value = props.user?.email || ''
    editAvatarUrl.value = props.user?.avatarUrl || ''
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    dangerPassword.value = ''
  }
})

const sectionTitle = computed(() => {
  const titles = { edit: 'Edit Profile', password: 'Change Password', danger: 'Data & Account', shared: 'Shared Notes' }
  return titles[activeSection.value] || 'Profile'
})

const showFeedback = (msg, type = 'success') => {
  feedback.value = msg
  feedbackType.value = type
  if (type === 'success') setTimeout(() => { feedback.value = null }, 3000)
}

const formatDate = (iso) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

const saveProfile = async () => {
  saving.value = true
  feedback.value = null
  try {
    await emit('update-profile', { name: editName.value, email: editEmail.value, avatarUrl: editAvatarUrl.value })
    showFeedback('Profile updated')
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update profile', 'error')
  } finally {
    saving.value = false
  }
}

const savePassword = async () => {
  saving.value = true
  feedback.value = null
  try {
    await emit('change-password', { currentPassword: currentPassword.value, newPassword: newPassword.value })
    showFeedback('Password updated')
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to change password', 'error')
  } finally {
    saving.value = false
  }
}

const handleDeleteData = async () => {
  if (!confirm('This will permanently delete all your cloud notes and shared notes. Continue?')) return
  saving.value = true
  feedback.value = null
  try {
    await emit('delete-data', dangerPassword.value)
    showFeedback('All cloud data deleted')
    dangerPassword.value = ''
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to delete data', 'error')
  } finally {
    saving.value = false
  }
}

const handleDeleteAccount = async () => {
  if (!confirm('This will permanently delete your account and all associated data. This cannot be undone. Continue?')) return
  saving.value = true
  feedback.value = null
  try {
    await emit('delete-account', dangerPassword.value)
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to request deletion', 'error')
    saving.value = false
  }
}

const loadSharedNotes = async () => {
  loadingShared.value = true
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    sharedNotes.value = await apiFetch('/api/share/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch {
    sharedNotes.value = []
  } finally {
    loadingShared.value = false
  }
}

const { copy: clipboardCopy } = useClipboard()
const copiedHash = ref(null)

const copySharedLink = async (hash) => {
  const url = apiUrl(`/shared/${hash}`)
  await clipboardCopy(url)
  copiedHash.value = hash
  setTimeout(() => { copiedHash.value = null }, 2000)
}

const handleUnshare = async (hash) => {
  try {
    const token = localStorage.getItem('auth_token')
    await apiFetch(`/api/share/${hash}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    sharedNotes.value = sharedNotes.value.filter(n => n.hash !== hash)
    showFeedback('Shared note removed')
    emit('unshare', hash)
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to remove shared note', 'error')
  }
}

const openSharedSection = () => {
  activeSection.value = 'shared'
  loadSharedNotes()
}

const togglePrivacy = async () => {
  savingPrivacy.value = true
  const newVal = !privacyNoTracking.value
  try {
    const token = localStorage.getItem('auth_token')
    await apiFetch('/api/auth/privacy', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: { noTracking: newVal }
    })
    privacyNoTracking.value = newVal
    showFeedback(newVal ? 'Privacy protection enabled' : 'Privacy protection disabled')
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update privacy setting', 'error')
  } finally {
    savingPrivacy.value = false
  }
}

const formatExpiry = (iso) => {
  if (!iso) return 'No expiry'
  const d = new Date(iso)
  const now = new Date()
  if (d < now) return 'Expired'
  const diff = d - now
  const days = Math.ceil(diff / 86400000)
  return days === 1 ? '1 day left' : `${days} days left`
}
</script>

<style scoped>
.modal-backdrop-enter-active,
.modal-backdrop-leave-active { transition: opacity 0.2s ease; }
.modal-backdrop-enter-from,
.modal-backdrop-leave-to { opacity: 0; }
.modal-panel-enter-active { transition: all 0.2s ease-out; }
.modal-panel-leave-active { transition: all 0.15s ease-in; }
.modal-panel-enter-from,
.modal-panel-leave-to { opacity: 0; transform: scale(0.95); }
</style>
