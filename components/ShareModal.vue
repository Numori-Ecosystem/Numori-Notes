<template>
  <UiModal :show="isOpen" max-width="sm" @close="$emit('close')" panel-class="max-h-[85vh]">
    <div class="p-4 sm:p-5 overflow-y-auto overflow-x-hidden">

            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">Share Note</h2>
              <UiButton variant="ghost" color="gray" icon-only @click="$emit('close')">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </UiButton>
            </div>

            <!-- Already shared / just shared state -->
            <div v-if="activeHash" class="space-y-3">
              <p class="text-sm text-gray-700 dark:text-gray-400">Your note is shared. Anyone with this link can view it:</p>
              <div class="flex items-center gap-2">
                <UiInput :model-value="activeShareUrl" readonly :validate="false" />
                <UiButton icon-only class="flex-shrink-0" @click="copyLink">
                  <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4 block" />
                </UiButton>
              </div>

              <!-- Password hint for password-protected shares -->
              <p v-if="usedSharePassword && sharePasswordMode === 'custom'" class="text-xs text-amber-600 dark:text-amber-400">
                <Icon name="mdi:lock-outline" class="w-3 h-3 inline" />
                This note is password-protected. Share the password separately with the recipient.
              </p>

              <!-- Analytics link -->
              <UiButton v-if="isLoggedIn" variant="ghost" color="primary" size="sm" block @click="$emit('open-analytics', activeHash)">
                <Icon name="mdi:chart-bar" class="w-4 h-4" />
                View analytics
              </UiButton>

              <div class="flex gap-2">
                <UiButton variant="solid" color="gray" class="flex-1" @click="$emit('close')">
                  Done
                </UiButton>
                <UiButton variant="ghost" color="red" class="flex-1" @click="handleUnshare">
                  Stop sharing
                </UiButton>
              </div>
            </div>

            <!-- Share form -->
            <div v-else class="space-y-3">
              <p class="text-xs text-gray-500 dark:text-gray-500">
                No account needed. Share with a unique link.
              </p>

              <!-- Error -->
              <UiAlert v-if="error" color="red">{{ error }}</UiAlert>

              <!-- Anonymous toggle -->
              <label class="flex items-center gap-2 cursor-pointer">
                <UiCheckbox v-model="anonymous" />
                <span class="text-sm text-gray-700 dark:text-gray-400">Share anonymously</span>
              </label>

              <!-- Sharer details (if not logged in and not anonymous) -->
              <template v-if="!isLoggedIn && !anonymous">
                <UiFormField label="Your name">
                  <UiInput v-model="sharerName" type="text" placeholder="Optional" :validate="false" />
                </UiFormField>
                <UiFormField label="Your email">
                  <UiInput v-model="sharerEmail" type="email" placeholder="Optional" />
                </UiFormField>
              </template>

              <!-- Logged in but not anonymous: show who it'll be shared as -->
              <p v-if="isLoggedIn && !anonymous" class="text-xs text-gray-500 dark:text-gray-500">
                Shared as {{ userName || userEmail }}
              </p>

              <!-- Share password mode -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400">Encryption</label>
                <div class="flex gap-2">
                  <UiButton variant="outline" size="xs" class="flex-1" @click="sharePasswordMode = 'none'"
                    :class="sharePasswordMode === 'none'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'">
                    Link only
                  </UiButton>
                  <UiButton variant="outline" size="xs" class="flex-1" @click="sharePasswordMode = 'custom'"
                    :class="sharePasswordMode === 'custom'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'">
                    <Icon name="mdi:lock-outline" class="w-3 h-3 inline" /> Password
                  </UiButton>
                </div>
                <p class="text-xs text-gray-400 dark:text-gray-600">
                  <template v-if="sharePasswordMode === 'custom'">
                    Recipient needs this password to view the note. Share it separately.
                  </template>
                  <template v-else>
                    <!-- Passwordless sharing: key is embedded in the URL. Encrypted in transit
                         but the server can see the key in the URL query parameter.
                         This provides light obfuscation, not confidentiality against the server. -->
                    A random key is embedded in the link. Encrypted in transit but not hidden from the server.
                  </template>
                </p>
              </div>

              <!-- Custom password input -->
              <div v-if="sharePasswordMode === 'custom'" class="space-y-2">
                <UiFormField label="Share password">
                  <UiInput v-model="sharePassword" type="password" placeholder="Enter a password for this share" :validate="false" />
                </UiFormField>
                <UiFormField label="Password hint" optional>
                  <UiInput v-model="passwordHint" type="text" :maxlength="255" :validate="false"
                    placeholder="A hint to help the recipient remember the password" />
                </UiFormField>
              </div>

              <!-- Expiration -->
              <UiFormField label="Expires after">
                <UiSelect v-model="expiresInDays"
                  :options="[
                    { value: 1, label: '1 day' },
                    { value: 7, label: '7 days' },
                    { value: 14, label: '14 days' },
                    { value: 30, label: '30 days' },
                  ]" />
              </UiFormField>

              <!-- Analytics toggle with tooltip -->
              <div class="relative">
                <label class="flex items-center gap-2 cursor-pointer">
                  <UiCheckbox v-model="collectAnalytics" />
                  <span class="text-sm text-gray-700 dark:text-gray-400">Enable view analytics</span>
                  <UiTooltip width="w-56 sm:w-64">
                    <Icon name="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                    <template #content>
                      <p class="font-medium mb-1">View Analytics</p>
                      <p>When enabled, the following data is collected each time someone opens or imports your shared note:</p>
                      <ul class="list-disc pl-3 mt-1 space-y-0.5">
                        <li>View and import counts</li>
                        <li>Viewer's display name (if signed in and they allow tracking)</li>
                        <li>Device, OS, and browser info via user agent</li>
                        <li>IP address and referrer URL</li>
                        <li>Language preferences (Accept-Language)</li>
                        <li>Browser client hints (Sec-CH-UA)</li>
                        <li>Do Not Track (DNT) preference</li>
                        <li>Timestamp of each event</li>
                      </ul>
                      <p class="mt-1.5 text-gray-300">Emails are never collected. Signed-in users with privacy protection will appear as "Unknown" with no device or IP data. Analytics persist even after you stop sharing.</p>
                    </template>
                  </UiTooltip>
                </label>
              </div>

              <UiButton block :loading="sharing" :disabled="sharePasswordMode === 'custom' && !sharePassword" @click="handleShare">
                <Icon name="mdi:share-variant-outline" class="w-4 h-4" />
                Share Note
              </UiButton>
            </div>
    </div>
  </UiModal>
</template>

<script setup>
import { encryptSharedNote, deriveShareKey, generateSharePassword } from '~/utils/crypto.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  note: { type: Object, default: null },
  isLoggedIn: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  authHeaders: { type: Object, default: () => ({}) },
  existingHash: { type: String, default: null }
})

const emit = defineEmits(['close', 'unshare', 'open-analytics'])

const { copy: clipboardCopy } = useClipboard()
const { apiFetch, apiUrl } = useApi()

const anonymous = ref(false)
const sharerName = ref('')
const sharerEmail = ref('')
const expiresInDays = ref(7)
const collectAnalytics = ref(false)
const sharing = ref(false)
const error = ref(null)
const newShareHash = ref(null)
const copied = ref(false)

// Encryption mode for shared notes
const sharePasswordMode = ref('none') // 'none' = passwordless (random key in URL), 'custom' = user-set password
const sharePassword = ref('')
const passwordHint = ref('')
const usedSharePassword = ref(false)

const activeHash = computed(() => newShareHash.value || props.existingHash)

const activeShareUrl = computed(() => {
  if (!activeHash.value) return ''
  let url = apiUrl(`/shared/${activeHash.value}`)
  // For passwordless shares, include the key in the URL
  if (sharePassword.value && sharePasswordMode.value === 'none') {
    url += `?key=${encodeURIComponent(sharePassword.value)}`
  }
  return url
})

watch(() => props.isOpen, (open) => {
  if (open) {
    anonymous.value = false
    sharerName.value = ''
    sharerEmail.value = ''
    expiresInDays.value = 7
    collectAnalytics.value = false
    sharing.value = false
    error.value = null
    newShareHash.value = null
    copied.value = false
    sharePasswordMode.value = 'none'
    sharePassword.value = ''
    passwordHint.value = ''
    usedSharePassword.value = false
  }
})

const handleShare = async () => {
  if (!props.note) return
  sharing.value = true
  error.value = null

  try {
    // Determine the share password
    let effectivePassword
    if (sharePasswordMode.value === 'custom') {
      effectivePassword = sharePassword.value
    } else {
      // Passwordless sharing: generate a random password.
      // The key is appended to the URL as a query parameter.
      // The encryption/decryption flow is identical to password-protected sharing,
      // but since the password travels in the URL, the server can see it.
      // The intent here is light obfuscation in transit, NOT security against
      // a server-side observer.
      effectivePassword = generateSharePassword()
    }

    // Derive the share encryption key (independent from user's personal encKey)
    const shareKey = await deriveShareKey(effectivePassword)

    // Encrypt the note data with the share key
    const noteData = {
      title: props.note.title,
      description: props.note.description,
      tags: props.note.tags,
      content: props.note.content
    }
    const encryptedData = await encryptSharedNote(noteData, shareKey)

    const body = {
      title: encryptedData.title,
      description: encryptedData.description,
      tags: encryptedData.tags,
      content: encryptedData.content,
      encrypted: true,
      anonymous: anonymous.value,
      expiresInDays: expiresInDays.value,
      collectAnalytics: collectAnalytics.value,
      sourceClientId: props.note.id,
      passwordHint: sharePasswordMode.value === 'custom' && passwordHint.value ? passwordHint.value : undefined
    }

    if (!props.isLoggedIn && !anonymous.value) {
      body.sharerName = sharerName.value || undefined
      body.sharerEmail = sharerEmail.value || undefined
    }

    const data = await apiFetch('/api/share', {
      method: 'POST',
      headers: props.authHeaders,
      body
    })

    newShareHash.value = data.hash
    usedSharePassword.value = sharePasswordMode.value === 'custom'

    // For passwordless sharing, append the random password to the URL
    // so the recipient can derive the decryption key from it.
    if (sharePasswordMode.value === 'none') {
      // Store the password so the URL includes it
      sharePassword.value = effectivePassword
    }
  } catch (err) {
    error.value = err.data?.statusMessage || err.message || 'Failed to share'
  } finally {
    sharing.value = false
  }
}

const handleUnshare = async () => {
  if (!activeHash.value) return
  try {
    await apiFetch(`/api/share/${activeHash.value}`, {
      method: 'DELETE',
      headers: props.authHeaders
    })
    emit('unshare')
    emit('close')
  } catch (err) {
    error.value = err.data?.statusMessage || err.message || 'Failed to stop sharing'
  }
}

const copyLink = async () => {
  await clipboardCopy(activeShareUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>


