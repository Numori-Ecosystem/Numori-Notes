<template>
  <div class="min-h-screen bg-white dark:bg-gray-925 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <a href="/" class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Calc Notes
        </a>
        <span class="text-xs text-gray-500 dark:text-gray-500">Shared Note</span>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Icon name="mdi:loading" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center px-6">
      <div class="text-center space-y-3">
        <Icon name="mdi:alert-circle-outline" class="w-12 h-12 text-gray-400 mx-auto" />
        <p class="text-gray-700 dark:text-gray-400">{{ error }}</p>
        <a href="/"
          class="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">
          Go to Calc Notes
        </a>
      </div>
    </div>

    <!-- Password prompt for encrypted notes without a key in the URL -->
    <div v-else-if="needsPassword" class="flex-1 flex items-center justify-center px-6">
      <div class="max-w-sm w-full space-y-4 text-center">
        <Icon name="mdi:lock-outline" class="w-12 h-12 text-gray-400 mx-auto" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">This note is password-protected</h2>
        <p class="text-sm text-gray-500 dark:text-gray-500">Enter the password to view this shared note.</p>
        <div v-if="decryptError" class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
          {{ decryptError }}
        </div>
        <input v-model="passwordInput" type="password" placeholder="Share password"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          @keyup.enter="decryptWithPassword" />
        <button @click="decryptWithPassword" :disabled="!passwordInput || decrypting"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          <Icon v-if="decrypting" name="mdi:loading" class="w-4 h-4 animate-spin" />
          <Icon v-else name="mdi:lock-open-outline" class="w-4 h-4" />
          Decrypt
        </button>
      </div>
    </div>

    <!-- Shared note content -->
    <main v-else-if="note" class="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
      <div class="space-y-1">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-200">{{ note.title }}</h1>
        <p v-if="note.description" class="text-sm text-gray-500 dark:text-gray-500">{{ note.description }}</p>
        <div v-if="note.sharer" class="text-xs text-gray-500 dark:text-gray-500">
          Shared by {{ note.sharer.name || note.sharer.email || 'someone' }}
        </div>
        <div v-if="note.tags?.length" class="flex flex-wrap gap-1.5 pt-1">
          <span v-for="tag in note.tags" :key="tag"
            class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {{ tag }}
          </span>
        </div>
      </div>

      <pre class="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 overflow-x-auto">{{ note.content }}</pre>

      <!-- Import into own notes -->
      <button @click="importNote"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
        <Icon name="mdi:download" class="w-4 h-4" />
        Import to my notes
      </button>
    </main>
  </div>
</template>

<script setup>
import { deriveShareKey, decryptSharedNote, isEncrypted } from '~/utils/crypto.js'

const route = useRoute()
const hash = route.params.hash
const { apiFetch } = useApi()

const note = ref(null)
const loading = ref(true)
const error = ref(null)

// Encryption state
const rawEncryptedData = ref(null) // raw server response when encrypted
const needsPassword = ref(false)
const passwordInput = ref('')
const decryptError = ref(null)
const decrypting = ref(false)

onMounted(async () => {
  try {
    const data = await apiFetch(`/api/share/${hash}`)

    if (data.encrypted && isEncrypted(data.content)) {
      // Check if a key is provided in the URL query parameter (passwordless sharing)
      const urlKey = route.query.key
      if (urlKey) {
        // Passwordless sharing: the random password is in the URL.
        // The encryption/decryption flow is identical to password-protected sharing.
        // However, since the password travels in the URL, the server can see it —
        // the intent here is light obfuscation in transit, not security against
        // a server-side observer.
        try {
          const shareKey = await deriveShareKey(urlKey)
          const decrypted = await decryptSharedNote(data, shareKey)
          note.value = {
            ...data,
            title: decrypted.title,
            description: decrypted.description,
            tags: decrypted.tags,
            content: decrypted.content
          }
        } catch {
          error.value = 'Failed to decrypt this shared note. The link may be invalid.'
        }
      } else {
        // Password-protected sharing: prompt the user for the password
        rawEncryptedData.value = data
        needsPassword.value = true
      }
    } else {
      // Unencrypted (legacy) shared note
      note.value = data
    }
  } catch (err) {
    error.value = err.data?.statusMessage || 'This shared note could not be found.'
  } finally {
    loading.value = false
  }
})

const decryptWithPassword = async () => {
  if (!passwordInput.value || !rawEncryptedData.value) return
  decrypting.value = true
  decryptError.value = null
  try {
    const shareKey = await deriveShareKey(passwordInput.value)
    const decrypted = await decryptSharedNote(rawEncryptedData.value, shareKey)
    note.value = {
      ...rawEncryptedData.value,
      title: decrypted.title,
      description: decrypted.description,
      tags: decrypted.tags,
      content: decrypted.content
    }
    needsPassword.value = false
  } catch {
    decryptError.value = 'Incorrect password. Please try again.'
  } finally {
    decrypting.value = false
  }
}

const importNote = async () => {
  if (!note.value) return

  // Track the import (fire and forget)
  apiFetch(`/api/share/${hash}/import`, { method: 'POST' }).catch(() => {})

  const { default: db } = await import('~/db.js')
  const pending = {
    title: note.value.title,
    description: note.value.description || '',
    tags: note.value.tags || [],
    content: note.value.content
  }
  await db.appState.put({ key: 'pending_import', value: JSON.stringify(pending) })
  navigateTo('/')
}
</script>
