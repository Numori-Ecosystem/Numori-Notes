<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-925 overscroll-none">
    <!-- Mobile-friendly Toolbar -->
    <div class="transition-all duration-300 ease-in-out flex-shrink-0 relative z-30"
      :class="focusMode ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-40 opacity-100'">
      <AppHeader :current-note="currentNote" :inline-mode="showInlineResults" :markdown-mode="markdownMode"
      :mod-label="modLabel"
      :selection-count="selectedNoteIds.length"
      :is-logged-in="auth.isLoggedIn.value"
      :can-undo="editorRef?.canUndo ?? false"
      :can-redo="editorRef?.canRedo ?? false"
      :editor-font-size="localePrefs.preferences.editorFontSize ?? 16"
      @toggle-sidebar="showSidebar = !showSidebar"
      @show-meta="currentNote && (showMetaModal = true)" @apply-format="applyFormat"
      @indent="editorRef?.indentLine()" @outdent="editorRef?.outdentLine()"
      @undo="editorRef?.undo()" @redo="editorRef?.redo()"
      @update:inline-mode="showInlineResults = $event"
      @update:markdown-mode="markdownMode = $event"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @zoom-reset="handleZoomReset"
      @toggle-focus="focusMode = true"
      @show-templates="showTemplates = true"
      @show-help="showHelp = true"
      @file-new="createNote"
      @file-open="handleOpenFile"
      @file-duplicate="handleDuplicate"
      @file-export-text="handleExportText"
      @file-export-markdown="handleExportMarkdown"
      @file-export-pdf="handleExportPdf"
      @file-export-json="handleExportJson"
      @file-export-all="handleExportAll"
      @file-import="handleImport"
      @file-copy="handleCopy"
      @file-print="handlePrint"
      @file-about="showAbout = true" />
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar - Notes List (desktop) -->
      <aside class="flex-shrink-0 hidden lg:block overflow-hidden transition-all duration-300 ease-in-out"
        :class="!focusMode && showSidebar ? 'w-80 opacity-100' : 'w-0 opacity-0'">
        <div class="w-80 h-full relative">
          <Transition
            enter-active-class="transition-opacity duration-500"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-500"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div v-if="sidebarGlow" class="absolute inset-0 z-10 pointer-events-none bg-primary-500/25 dark:bg-primary-400/20" />
          </Transition>
          <MainSidebar :notes="notes" :current-note-id="currentNoteId" :all-tags="allTags" :is-logged-in="auth.isLoggedIn.value" :user="auth.user.value" :shared-note-ids="sharedNoteIds" :shared-notes-map="sharedNotesMap" :analytics-notes-map="analyticsNotesMap" @new-note="createNote" @select-note="selectNote"
            @delete-note="confirmDelete" @edit-note="openEditModal"
            @bulk-delete="confirmBulkDelete" @selection-change="onSelectionChange"
            @show-help="showHelp = true"
            @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true"
            @show-auth="showAuthModal = true" @logout="handleLogout" @edit-profile="handleShowProfile"
            @share-note="handleShareNote" @show-properties="handleShowProperties"
            @unshare-note="handleUnshareNote"
            @open-analytics="handleOpenAnalytics"
            @reorder="handleReorder"
            @duplicate-note="handleDuplicateById"
            @export-note="handleExportById"
            @copy-to-clipboard="handleCopyById"
            @print-note="handlePrintById" />
        </div>
        </aside>

      <!-- Mobile sidebar with slide transition -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0">
          <div v-if="showSidebar" @click="showSidebar = false" class="fixed inset-0 bg-black/50 z-20 lg:hidden" />
        </Transition>
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full">
          <aside v-if="showSidebar" class="fixed inset-y-0 left-0 z-30 w-80 shadow-xl lg:hidden"
            :style="{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)' }">
            <div class="h-full relative">
              <Transition
                enter-active-class="transition-opacity duration-500"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-500"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0">
                <div v-if="sidebarGlow" class="absolute inset-0 z-10 pointer-events-none bg-primary-500/25 dark:bg-primary-400/20" />
              </Transition>
              <MainSidebar :notes="notes" :current-note-id="currentNoteId" :all-tags="allTags" :is-logged-in="auth.isLoggedIn.value" :user="auth.user.value" :shared-note-ids="sharedNoteIds" :shared-notes-map="sharedNotesMap" :analytics-notes-map="analyticsNotesMap" @new-note="createNote" @select-note="selectNote"
              @delete-note="confirmDelete" @edit-note="openEditModal"
              @bulk-delete="confirmBulkDelete" @selection-change="onSelectionChange"
              @show-help="showHelp = true"
              @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true"
              @show-auth="showAuthModal = true" @logout="handleLogout" @edit-profile="handleShowProfile"
              @share-note="handleShareNote" @show-properties="handleShowProperties"
              @unshare-note="handleUnshareNote"
              @open-analytics="handleOpenAnalytics"
              @reorder="handleReorder"
              @duplicate-note="handleDuplicateById"
              @export-note="handleExportById"
              @copy-to-clipboard="handleCopyById"
              @print-note="handlePrintById" />
            </div>
          </aside>
        </Transition>
      </Teleport>

      <!-- Editor Area -->
      <main class="flex-1 overflow-hidden flex flex-col isolate transition-[padding] duration-300"
        :style="focusMode ? { paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' } : {}">
        <NoteEditor v-if="currentNote" ref="editorRef" :content="currentNote.content" :show-inline="showInlineResults !== 'off'"
          :inline-align="showInlineResults === 'off' ? 'left' : showInlineResults"
          :locale-preferences="localePrefs.preferences"
          :markdown-mode="markdownMode"
          :shortcut-handlers="shortcutHandlers"
          @update:content="updateContent"
          :placeholder="'Start typing... Try: 10 + 20, or use # for headers, // for comments'" />
        <div v-else class="flex items-center justify-center h-full px-6">
          <div class="text-center max-w-sm space-y-6">
            <!-- Icon -->
            <div class="mx-auto w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <Icon name="mdi:file-document-outline" class="w-8 h-8 text-primary-500 dark:text-primary-400" />
            </div>

            <!-- Heading + subtext -->
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">No note selected</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Pick an existing note from the sidebar or start fresh with a new one.</p>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button @click="createNote"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md">
                <Icon name="mdi:plus" class="w-5 h-5" />
                Create new note
              </button>
              <button @click="showSidebar = true"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Icon name="mdi:menu" class="w-5 h-5" />
                Browse notes
              </button>
            </div>

            <!-- Note count hint -->
            <p v-if="notes.length" class="text-xs text-gray-400 dark:text-gray-500">
              {{ notes.length }} {{ notes.length === 1 ? 'note' : 'notes' }} in your library
            </p>
          </div>
        </div>
      </main>
    </div>

    <!-- Mobile: formatting toolbar (hidden on native apps where native keyboard toolbar is used) -->
    <div v-if="currentNote && !isNativeApp" class="lg:hidden fixed left-0 right-0 z-10 transition-[bottom] duration-150 ease-out px-1.5 pb-1.5"
      :style="{ bottom: mobileKeyboardOffset + 'px' }">
      <div class="overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-xl"
        :style="{ paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }">
        <FormattingToolbar container-class="px-2 py-1.5"
          :show-dismiss="hasVirtualKeyboard"
          :can-undo="editorRef?.canUndo ?? false"
          :can-redo="editorRef?.canRedo ?? false"
          @apply-format="applyFormat"
          @indent="editorRef?.indentLine()"
          @outdent="editorRef?.outdentLine()"
          @undo="editorRef?.undo()"
          @redo="editorRef?.redo()"
          @dismiss-keyboard="editorRef?.blur()" />
      </div>
    </div>

    <!-- Modals -->
    <NoteMetaModal :is-open="showMetaModal" :title="currentNote?.title || ''"
      :description="currentNote?.description || ''"
      :tags="currentNote?.tags || []"
      :all-tags="allTags"
      :note-id="currentNote?.id"
      :shared="currentNote ? sharedNoteIds.includes(currentNote.id) : false"
      :share-hash="currentNote ? (sharedNotesMap.get(currentNote.id) || null) : null"
      :analytics-hash="currentNote ? (analyticsNotesMap.get(currentNote.id) || null) : null"
      @close="showMetaModal = false"
      @save="updateMeta" @delete="confirmDelete"
      @share="handleShareNote"
      @unshare="handleUnshareNote"
      @open-analytics="handleOpenAnalytics" />

    <HelpModal :is-open="showHelp" :mod-label="modLabel" @close="showHelp = false" />
    <AboutModal :is-open="showAbout" @close="showAbout = false" />
    <TemplatesModal :is-open="showTemplates" @close="showTemplates = false" @insert="insertTemplate" />
    <LanguageSwitcher :is-open="showLanguageModal" @close="showLanguageModal = false" />
    <SettingsModal :is-open="showLocaleSettings"
      :preferences="localePrefs.preferences"
      :apply-preset="localePrefs.applyPreset"
      :set-preference="localePrefs.setPreference"
      :get-active-preset="localePrefs.getActivePreset"
      :save="localePrefs.save"
      :reset="localePrefs.reset"
      @close="showLocaleSettings = false"
      @relaunch-wizard="showLocaleSettings = false; welcomeWizard.isOpen.value = true" />

    <ExportOptionsModal :is-open="showExportOptions"
      @close="showExportOptions = false"
      @confirm="handleExportConfirm" />

    <ConfirmDeleteModal :is-open="showDeleteConfirm"
      @close="showDeleteConfirm = false"
      @confirm="handleDeleteConfirm" />

    <ConfirmBulkDeleteModal :is-open="showBulkDeleteConfirm"
      :count="pendingBulkDeleteIds.length"
      @close="showBulkDeleteConfirm = false"
      @confirm="handleBulkDeleteConfirm" />

    <WelcomeWizard :is-open="welcomeWizard.isOpen.value"
      :preferences="localePrefs.preferences"
      :apply-preset="localePrefs.applyPreset"
      :save-preferences="localePrefs.save"
      @complete="welcomeWizard.complete()" />

    <!-- Auth & Share modals -->
    <AuthModal :is-open="showAuthModal"
      :loading="auth.loading.value"
      :error="auth.error.value"
      @close="showAuthModal = false"
      @login="handleLogin"
      @register="handleRegister" />

    <ShareModal :is-open="showShareModal"
      :note="currentNote"
      :is-logged-in="auth.isLoggedIn.value"
      :user-name="auth.user.value?.name || ''"
      :user-email="auth.user.value?.email || ''"
      :auth-headers="auth.authHeaders.value"
      :existing-hash="currentNote ? (sharedNotesMap.get(currentNote.id) || null) : null"
      @close="handleShareModalClose"
      @unshare="handleShareModalUnshare"
      @open-analytics="handleOpenAnalytics" />

    <ShareAnalyticsModal :is-open="showAnalyticsModal"
      :hash="analyticsHash"
      :auth-headers="auth.authHeaders.value"
      @close="showAnalyticsModal = false" />

    <ProfileModal :is-open="showProfileModal"
      :user="auth.user.value"
      :last-synced-at="lastSyncedAt"
      :auth-headers="auth.authHeaders.value"
      @close="showProfileModal = false"
      @update-profile="handleUpdateProfile"
      @change-password="handleChangePassword"
      @delete-data="handleDeleteData"
      @delete-account="handleDeleteAccount"
      @logout="handleLogout"
      @unshare="handleProfileUnshare"
      @open-analytics="handleOpenAnalytics"
      @sync-now="syncNow"
      @show-notes="handleShowNotes" />

    <SyncIndicator :syncing="syncing" />

    <!-- Focus mode exit button -->
    <button v-if="focusMode" @click="focusMode = false"
      class="fixed z-50 pl-2.5 pb-2.5 rounded-bl-xl text-gray-400 dark:text-gray-500 hover:bg-black/15 dark:hover:bg-white/15 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus-exit-enter"
      :style="{ top: 'env(safe-area-inset-top, 0px)', right: 'env(safe-area-inset-right, 0px)', paddingRight: '4px', paddingTop: '4px' }"
      title="Exit focus mode">
      <Icon name="mdi:fullscreen-exit" class="w-4 h-4 block" />
    </button>
  </div>
</template>

<script setup>
import db from '~/db.js'

const { notes, currentNoteId, currentNote, allTags, deletedIds, addNote, deleteNote, updateNoteContent, updateNoteMeta, saveNotes, clearDeletedIds, reorderNotes } = useNotes()
const { exportNoteAsText, exportNoteAsJson, exportNoteAsMarkdown, exportNoteAsPdf, exportAllNotes, openFile, importNotes, duplicateNote, copyToClipboard, printNote } = useFileActions()
const { evaluateLines } = useCalculator()
const localePrefs = useLocalePreferences()
const welcomeWizard = useWelcomeWizard()
const auth = useAuth()
const { apiFetch } = useApi()
const { syncing, lastSyncedAt, syncError, sync, syncNow, debouncedSync } = useSync(auth, notes, saveNotes, deletedIds, clearDeletedIds)

// Wrapper: create note + instant sync
const createNote = () => {
  const note = addNote()
  syncNow()
  return note
}

const handleReorder = (orderedIds) => {
  reorderNotes(orderedIds)
  syncNow()
}

// Keyboard shortcuts — must be declared before refs so handlers can reference them
const { isMac, modLabel, handlers: shortcutHandlers } = useKeyboardShortcuts({
  save: () => {
    // Notes auto-save, but we still intercept to prevent browser save dialog
  },
  newNote: () => createNote(),
  openFile: () => handleOpenFile(),
  print: () => handlePrint(),
  duplicate: () => handleDuplicate(),
  exportText: () => handleExportText(),
  help: () => { showHelp.value = true },
  exportAll: () => handleExportAll(),
})

const showSidebar = ref(true) // Default to true for better UX
const focusMode = ref(false)
const showMetaModal = ref(false)
const showHelp = ref(false)
const showTemplates = ref(false)
const showLanguageModal = ref(false)
const showLocaleSettings = ref(false)
const showAbout = ref(false)
const showInlineResults = computed({
  get: () => localePrefs.preferences.inlineMode ?? 'left',
  set: (v) => { localePrefs.preferences.inlineMode = v; localePrefs.save() }
})
const markdownMode = computed({
  get: () => localePrefs.preferences.markdownMode ?? 'full',
  set: (v) => { localePrefs.preferences.markdownMode = v; localePrefs.save() }
})

const handleZoomIn = () => {
  const cur = localePrefs.preferences.editorFontSize ?? 16
  localePrefs.preferences.editorFontSize = Math.min(cur + 2, 28)
  localePrefs.save()
}
const handleZoomOut = () => {
  const cur = localePrefs.preferences.editorFontSize ?? 16
  localePrefs.preferences.editorFontSize = Math.max(cur - 2, 10)
  localePrefs.save()
}
const handleZoomReset = () => {
  localePrefs.preferences.editorFontSize = 16
  localePrefs.save()
}

const editorRef = ref(null)
const mobileKeyboardOffset = ref(0)
const showAuthModal = ref(false)
const showShareModal = ref(false)

// On native apps (iOS / Android), hide the HTML toolbar — native keyboard toolbar is used instead
const { platform, isNative: isNativePlatform } = usePlatform()
const isNativeApp = platform === 'ios' || platform === 'android'
const { hasVirtualKeyboard } = useHasVirtualKeyboard()

// Browser: sync focus mode with fullscreen
if (import.meta.client && platform === 'web') {
  watch(focusMode, async (on) => {
    try {
      if (on && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else if (!on && document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch { /* fullscreen not supported or denied */ }
  })

  useEventListener(document, 'fullscreenchange', () => {
    if (!document.fullscreenElement) {
      focusMode.value = false
    }
  })
}

// Set up native keyboard toolbar on iOS / Android
if (import.meta.client && isNativeApp) {
  useNativeKeyboardToolbar({
    onFormat: (before, after) => editorRef.value?.wrapSelection(before, after),
    onUndo: () => editorRef.value?.undo(),
    onRedo: () => editorRef.value?.redo(),
    onIndent: () => editorRef.value?.indentLine(),
    onOutdent: () => editorRef.value?.outdentLine(),
    canUndo: () => editorRef.value?.canUndo ?? false,
    canRedo: () => editorRef.value?.canRedo ?? false,
  })
}
const showProfileModal = ref(false)
const showAnalyticsModal = ref(false)
const analyticsHash = ref(null)

// Track which notes are currently shared (by note title match from /api/share/my)
const sharedNoteIds = ref([])
const sharedNotesMap = ref(new Map()) // noteId -> hash (active shares only)
const analyticsNotesMap = ref(new Map()) // noteId -> hash (any share with analytics, including unshared)

const loadSharedNotes = async () => {
  if (!auth.isLoggedIn.value) { sharedNoteIds.value = []; sharedNotesMap.value = new Map(); analyticsNotesMap.value = new Map(); return }
  try {
    const shared = await apiFetch('/api/share/my', { headers: auth.authHeaders.value })
    const map = new Map()
    const analyticsMap = new Map()
    const ids = []
    for (const sn of shared) {
      // Match by sourceClientId (E2E-safe) or fall back to title match (legacy)
      const match = sn.sourceClientId
        ? notes.value.find(n => n.id === sn.sourceClientId)
        : notes.value.find(n => n.title === sn.title)
      if (match) {
        if (sn.isActive) {
          ids.push(match.id)
          map.set(match.id, sn.hash)
        }
        if (sn.collectAnalytics) {
          analyticsMap.set(match.id, sn.hash)
        }
      }
    }
    sharedNoteIds.value = ids
    sharedNotesMap.value = map
    analyticsNotesMap.value = analyticsMap
  } catch {
    sharedNoteIds.value = []
    sharedNotesMap.value = new Map()
    analyticsNotesMap.value = new Map()
  }
}

// Reload shared notes when auth changes or after sharing
watch(() => auth.isLoggedIn.value, (loggedIn) => {
  if (loggedIn) loadSharedNotes()
  else { sharedNoteIds.value = []; sharedNotesMap.value = new Map(); analyticsNotesMap.value = new Map() }
})

onMounted(() => {
  if (auth.isLoggedIn.value) loadSharedNotes()
})

// Track virtual keyboard via visualViewport API
let vvCleanup = null
onMounted(() => {
  const vv = window.visualViewport
  if (vv) {
    const update = () => {
      // The difference between the layout viewport and the visual viewport
      // tells us how much the keyboard is covering.
      mobileKeyboardOffset.value = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    vvCleanup = () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }
})

onBeforeUnmount(() => {
  if (vvCleanup) vvCleanup()
})

// Hide sidebar on mobile by default + welcome wizard
onMounted(async () => {
  if (window.innerWidth < 1024) {
    showSidebar.value = false
  }
  await welcomeWizard.showIfFirstTime()
})

// Auth handlers
const handleLogin = async ({ email, password }) => {
  try {
    await auth.login(email, password)
    showAuthModal.value = false
  } catch { /* error shown in modal */ }
}

const handleRegister = async ({ email, password, name }) => {
  try {
    await auth.register(email, password, name)
    showAuthModal.value = false
  } catch { /* error shown in modal */ }
}

/** Clear all local notes from IndexedDB — called on logout, password change, account deletion.
 *  Logs out first to ensure no sync can fire while we wipe local data. */
const clearLocalData = async () => {
  // Logout first so sync guards (isLoggedIn / encKey checks) block any
  // in-flight or queued sync from pushing an empty notes array to the server.
  auth.logout()
  notes.value = []
  currentNoteId.value = null
  await db.notes.clear()
  await db.appState.delete('deleted_note_ids')
}

const handleLogout = async () => {
  await clearLocalData()
}

const handleShowProfile = () => {
  auth.refreshUser()
  showProfileModal.value = true
}

const handleUpdateProfile = async (data) => {
  await auth.updateProfile(data)
}

const handleChangePassword = async ({ currentPassword, newPassword, onProgress }) => {
  // Fetch all server-side notes for re-encryption during password change.
  // The auth.changePassword method will decrypt each with the old key
  // and re-encrypt with the new key, then send them atomically.
  const serverNotes = notes.value.map(n => ({
    clientId: n.id,
    title: n.title,
    description: n.description,
    tags: n.tags || [],
    content: n.content,
    sortOrder: n.sortOrder ?? 0,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  }))
  await auth.changePassword(currentPassword, newPassword, serverNotes, onProgress)
  // changePassword calls logout() internally — clear local data and show login
  await clearLocalData()
  showProfileModal.value = false
  showAuthModal.value = true
}

const handleDeleteData = async (password) => {
  await auth.requestDeletion('data', password)
  await auth.refreshUser()
}

const handleDeleteAccount = async (password) => {
  await auth.requestDeletion('account', password)
  await clearLocalData()
  showProfileModal.value = false
}

// Share a specific note by opening the share modal with that note selected
const handleShareNote = (noteId) => {
  currentNoteId.value = noteId
  showShareModal.value = true
}

// Unshare from NoteMetaModal
const handleUnshareNote = async (noteId) => {
  const hash = sharedNotesMap.value.get(noteId)
  if (!hash) return
  try {
    await apiFetch(`/api/share/${hash}`, {
      method: 'DELETE',
      headers: auth.authHeaders.value
    })
    await loadSharedNotes()
  } catch { /* ignore */ }
}

// Show properties (open meta modal for a specific note)
const handleShowProperties = (noteId) => {
  currentNoteId.value = noteId
  showMetaModal.value = true
}

// Reload shared notes when share modal closes
const handleShareModalClose = () => {
  showShareModal.value = false
  if (auth.isLoggedIn.value) loadSharedNotes()
}

// Handle unshare from share modal
const handleShareModalUnshare = () => {
  showShareModal.value = false
  if (auth.isLoggedIn.value) loadSharedNotes()
}

// Open analytics modal
const handleOpenAnalytics = (hash) => {
  analyticsHash.value = hash
  showAnalyticsModal.value = true
}

// Handle unshare from profile modal
const handleProfileUnshare = () => {
  loadSharedNotes()
}

// Handle "Notes" card tap from profile modal
const sidebarGlow = ref(false)

const handleShowNotes = () => {
  showProfileModal.value = false
  showSidebar.value = true
  // Small delay to let sidebar open, then glow
  setTimeout(() => {
    sidebarGlow.value = true
  }, 400)
  setTimeout(() => {
    sidebarGlow.value = false
  }, 1400)
}

// Check for pending import from shared note page
onMounted(async () => {
  const { default: db } = await import('~/db.js')
  const row = await db.appState.get('pending_import')
  if (row?.value) {
    await db.appState.delete('pending_import')
    try {
      const data = JSON.parse(row.value)
      const newNote = createNote()
      updateNoteMeta(newNote.id, { title: data.title, description: data.description, tags: data.tags })
      updateNoteContent(newNote.id, data.content)
    } catch { /* ignore bad data */ }
  }
})

const selectNote = (id) => {
  currentNoteId.value = id
  if (window.innerWidth < 1024) {
    showSidebar.value = false // Close sidebar on mobile after selection
  }
}

const openEditModal = (id) => {
  currentNoteId.value = id
  showMetaModal.value = true
}

const updateContent = (content) => {
  if (currentNote.value) {
    updateNoteContent(currentNote.value.id, content)
    debouncedSync()
  }
}

const updateMeta = ({ title, description, tags }) => {
  if (currentNote.value) {
    updateNoteMeta(currentNote.value.id, { title, description, tags })
    debouncedSync()
  }
}

const confirmDelete = (id) => {
  pendingDeleteId.value = id
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = () => {
  showDeleteConfirm.value = false
  if (pendingDeleteId.value) {
    deleteNote(pendingDeleteId.value)
    pendingDeleteId.value = null
    syncNow()
  }
}

const applyFormat = (before, after) => {
  if (editorRef.value) {
    editorRef.value.wrapSelection(before, after)
  }
}

const insertTemplate = (templateContent) => {
  if (currentNote.value && editorRef.value) {
    let content = currentNote.value.content
    if (content && !content.endsWith('\n')) {
      content += '\n\n'
    }
    content += templateContent
    updateContent(content)
  }
}

// File menu handlers — export options modal
const showExportOptions = ref(false)
const pendingExportAction = ref(null)

// Delete confirmation modal
const showDeleteConfirm = ref(false)
const pendingDeleteId = ref(null)

// Bulk delete confirmation
const showBulkDeleteConfirm = ref(false)
const pendingBulkDeleteIds = ref([])

// Selection tracking from sidebar
const selectedNoteIds = ref([])

const onSelectionChange = (ids) => {
  selectedNoteIds.value = ids
}

const confirmBulkDelete = (ids) => {
  pendingBulkDeleteIds.value = ids
  showBulkDeleteConfirm.value = true
}

const handleBulkDeleteConfirm = () => {
  showBulkDeleteConfirm.value = false
  for (const id of pendingBulkDeleteIds.value) {
    deleteNote(id)
  }
  pendingBulkDeleteIds.value = []
  syncNow()
}

const askExportOptions = (action) => {
  pendingExportAction.value = action
  showExportOptions.value = true
}

const handleExportConfirm = (withResults) => {
  showExportOptions.value = false
  const calc = withResults ? evaluateLines : null
  const note = currentNote.value
  switch (pendingExportAction.value) {
    case 'text': exportNoteAsText(note, calc); break
    case 'markdown': exportNoteAsMarkdown(note, calc); break
    case 'pdf': exportNoteAsPdf(note, calc); break
    case 'print': printNote(note, calc); break
  }
  pendingExportAction.value = null
}

const handleOpenFile = async () => {
  try {
    const data = await openFile()
    const newNote = createNote()
    updateNoteMeta(newNote.id, { title: data.title, description: data.description, tags: data.tags })
    updateNoteContent(newNote.id, data.content)
  } catch {
    // User cancelled or file read failed
  }
}

const handleDuplicate = () => {
  if (!currentNote.value) return
  const data = duplicateNote(currentNote.value)
  if (data) {
    const newNote = createNote()
    updateNoteMeta(newNote.id, { title: data.title, description: data.description, tags: data.tags })
    updateNoteContent(newNote.id, data.content)
  }
}

const handleExportText = () => {
  if (selectedNoteIds.value.length > 0) {
    // Bulk: export selected as JSON backup
    const selected = notes.value.filter(n => selectedNoteIds.value.includes(n.id))
    exportAllNotes(selected)
  } else {
    askExportOptions('text')
  }
}
const handleExportMarkdown = () => {
  if (selectedNoteIds.value.length > 0) {
    const selected = notes.value.filter(n => selectedNoteIds.value.includes(n.id))
    exportAllNotes(selected)
  } else {
    askExportOptions('markdown')
  }
}
const handleExportPdf = () => {
  if (selectedNoteIds.value.length > 0) {
    const selected = notes.value.filter(n => selectedNoteIds.value.includes(n.id))
    exportAllNotes(selected)
  } else {
    askExportOptions('pdf')
  }
}
const handleExportJson = () => {
  if (selectedNoteIds.value.length > 0) {
    const selected = notes.value.filter(n => selectedNoteIds.value.includes(n.id))
    exportAllNotes(selected)
  } else {
    exportNoteAsJson(currentNote.value)
  }
}
const handleExportAll = () => {
  if (selectedNoteIds.value.length > 0) {
    const selected = notes.value.filter(n => selectedNoteIds.value.includes(n.id))
    exportAllNotes(selected)
  } else {
    exportAllNotes(notes.value)
  }
}

const handleImport = async () => {
  try {
    const result = await importNotes()
    for (const noteData of result.notes) {
      const newNote = createNote()
      updateNoteMeta(newNote.id, { title: noteData.title, description: noteData.description, tags: noteData.tags })
      updateNoteContent(newNote.id, noteData.content)
    }
  } catch {
    // User cancelled or file read failed — silently ignore
  }
}

const handleCopy = async () => {
  try {
    await copyToClipboard(currentNote.value)
  } catch {
    // Clipboard API not available
  }
}

const handlePrint = () => askExportOptions('print')

// Sidebar per-note action handlers (receive note ID)
const findNote = (id) => notes.value.find(n => n.id === id)

const handleDuplicateById = (id) => {
  const note = findNote(id)
  if (!note) return
  const data = duplicateNote(note)
  if (data) {
    const newNote = createNote()
    updateNoteMeta(newNote.id, { title: data.title, description: data.description, tags: data.tags })
    updateNoteContent(newNote.id, data.content)
  }
}

const handleExportById = (id) => {
  const note = findNote(id)
  if (!note) return
  exportNoteAsJson(note)
}

const handleCopyById = async (id) => {
  const note = findNote(id)
  if (!note) return
  try { await copyToClipboard(note) } catch {}
}

const handlePrintById = (id) => {
  const note = findNote(id)
  if (!note) return
  printNote(note)
}
</script>


<style scoped>
.focus-exit-enter {
  animation: focus-enter 1.5s ease-out forwards;
}

@keyframes focus-enter {
  0% {
    opacity: 0;
    background: rgba(239, 68, 68, 0.35);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }
  40% {
    opacity: 1;
    background: rgba(239, 68, 68, 0.25);
    box-shadow: 0 0 14px rgba(239, 68, 68, 0.4);
  }
  100% {
    opacity: 1;
    background: rgba(0, 0, 0, 0.05);
    box-shadow: none;
  }
}

@media (prefers-color-scheme: dark) {
  @keyframes focus-enter {
    0% {
      opacity: 0;
      background: rgba(248, 113, 113, 0.3);
      box-shadow: 0 0 20px rgba(248, 113, 113, 0.45);
    }
    40% {
      opacity: 1;
      background: rgba(248, 113, 113, 0.2);
      box-shadow: 0 0 14px rgba(248, 113, 113, 0.35);
    }
    100% {
      opacity: 1;
      background: rgba(255, 255, 255, 0.05);
      box-shadow: none;
    }
  }
}
</style>
