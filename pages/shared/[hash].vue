<template>
  <div class="h-screen bg-white dark:bg-gray-925 flex flex-col overflow-hidden">
    <!-- Fixed top area: header -->
    <header class="flex-shrink-0 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3"
      :style="{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }">
      <div class="max-w-5xl mx-auto flex items-center justify-between relative">
        <a href="/" class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Numori
        </a>
        <span class="text-xs text-gray-500 dark:text-gray-500 absolute left-1/2 -translate-x-1/2">Shared Note</span>
        <ThemeSwitcher />
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
          Go to Numori
        </a>
      </div>
    </div>

    <!-- Password prompt for encrypted notes without a key in the URL -->
    <div v-else-if="needsPassword" class="flex-1 flex items-center justify-center px-6">
      <div class="max-w-sm w-full space-y-4 text-center">
        <Icon name="mdi:lock-outline" class="w-12 h-12 text-gray-400 mx-auto" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">This note is password-protected</h2>
        <p class="text-sm text-gray-500 dark:text-gray-500">Enter the password to view this shared note.</p>
        <p v-if="passwordHint" class="text-sm text-amber-600 dark:text-amber-400">
          <Icon name="mdi:lightbulb-outline" class="w-3.5 h-3.5 inline" />
          Hint: {{ passwordHint }}
        </p>
        <div v-if="decryptError" class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
          {{ decryptError }}
        </div>
        <UiInput v-model="passwordInput" type="password" placeholder="Share password"
          :validate="false" @keyup.enter="decryptWithPassword" />
        <UiButton @click="decryptWithPassword" :disabled="!passwordInput" :loading="decrypting"
          variant="solid" color="primary" block>
          <Icon name="mdi:lock-open-outline" class="w-4 h-4" />
          Decrypt
        </UiButton>
      </div>
    </div>

    <!-- Shared note content -->
    <template v-else-if="note">
      <!-- Fixed top: note info + toolbar -->
      <div class="flex-shrink-0 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700"
        :style="{ paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }">
        <div class="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <!-- Note meta -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base font-semibold text-gray-900 dark:text-gray-200 truncate">{{ note.title }}</h1>
              <div v-if="note.tags?.length" class="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                <UiBadge v-for="tag in note.tags" :key="tag" color="gray">
                  {{ tag }}
                </UiBadge>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span v-if="note.description" class="truncate">{{ note.description }}</span>
              <span v-if="note.description && note.sharer" class="flex-shrink-0">&middot;</span>
              <span v-if="note.sharer" class="flex-shrink-0">{{ note.sharer.name || note.sharer.email || 'someone' }}</span>
            </div>
          </div>

          <!-- Toolbar -->
          <SharedNoteToolbar
            :render-markdown="renderMarkdown"
            :results-position="resultsPosition"
            :copied="copied"
            @update:render-markdown="renderMarkdown = $event"
            @update:results-position="resultsPosition = $event"
            @copy="copyNoteToClipboard"
            @export="handleExport"
            @print="askExportOptions('print')"
            @import="importNote"
          />
        </div>
      </div>

      <!-- Editor fills remaining height, only CM scrolls -->
      <div class="flex-1 overflow-hidden shared-gutter-pattern"
        :style="{ paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }">
        <main class="h-full flex flex-col max-w-5xl mx-auto w-full bg-white dark:bg-gray-925 relative z-0 shared-editor-shadow">
          <NoteEditor
            :content="note.content"
            :editable="false"
            :show-inline="resultsPosition !== 'off'"
            :inline-align="resultsPosition === 'off' ? 'left' : resultsPosition"
            :markdown-mode="renderMarkdown ? 'full' : 'off'"
            :bordered="false"
            placeholder=""
          />
        </main>
      </div>

      <ExportOptionsModal :is-open="showExportOptionsModal"
        @close="showExportOptionsModal = false"
        @confirm="handleExportConfirm" />
    </template>
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
const rawEncryptedData = ref(null)
const needsPassword = ref(false)
const passwordInput = ref('')
const passwordHint = ref(null)
const decryptError = ref(null)
const decrypting = ref(false)
const showPasswordInput = ref(false)

// View options
const renderMarkdown = ref(true)
const resultsPosition = ref('left')
const copied = ref(false)
const showExportOptionsModal = ref(false)
const pendingExportAction = ref(null)

const { exportNoteAsText, exportNoteAsJson, exportNoteAsMarkdown, exportNoteAsPdf, copyToClipboard, printNote } = useFileActions()
const { evaluateLines } = useCalculator()

const copyNoteToClipboard = async () => {
  if (!note.value) return
  await copyToClipboard(note.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

const handleExport = (format) => {
  if (format === 'json') {
    if (note.value) exportNoteAsJson(note.value)
  } else {
    askExportOptions(format)
  }
}

const askExportOptions = (action) => {
  pendingExportAction.value = action
  showExportOptionsModal.value = true
}

const handleExportConfirm = (withResults) => {
  showExportOptionsModal.value = false
  if (!note.value) return
  const calc = withResults ? evaluateLines : null
  switch (pendingExportAction.value) {
    case 'text': exportNoteAsText(note.value, calc); break
    case 'markdown': exportNoteAsMarkdown(note.value, calc); break
    case 'pdf': exportNoteAsPdf(note.value, calc); break
    case 'print': printNote(note.value, calc); break
  }
  pendingExportAction.value = null
}

onMounted(async () => {
  try {
    const data = await apiFetch(`/api/share/${hash}`)

    if (data.encrypted && isEncrypted(data.content)) {
      const urlKey = route.query.key
      if (urlKey) {
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
        rawEncryptedData.value = data
        passwordHint.value = data.passwordHint || null
        needsPassword.value = true
      }
    } else {
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

<style scoped>
.shared-gutter-pattern {
  background-color: #f5f0f1;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 24px,
    #cc2d5620 24px,
    #cc2d5620 25px
  );
}

:root.dark .shared-gutter-pattern,
.dark .shared-gutter-pattern {
  background-color: #141218;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 24px,
    #ff618810 24px,
    #ff618810 25px
  );
}

.shared-editor-shadow {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

:root.dark .shared-editor-shadow,
.dark .shared-editor-shadow {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
}
</style>