<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-925 overscroll-none">
    <!-- Alpha Warning Banner -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-20"
      leave-to-class="opacity-0 max-h-0">
      <div v-if="showAlphaWarning"
        class="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between gap-3 text-sm text-amber-800 dark:text-amber-200 overflow-hidden"
        :style="{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top, 0px))', paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))', paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))' }">
        <p class="flex-1 text-center">
          ⚠️ This is very early alpha. Expect bugs, partially implemented features, and missing functionality.
        </p>
        <button @click="dismissAlphaWarning"
          class="flex-shrink-0 p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
          aria-label="Dismiss warning">
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- Mobile-friendly Toolbar -->
    <AppHeader :current-note="currentNote" :show-inline="showInlineResults" :show-markdown-preview="showMarkdownPreview"
      :hide-alpha="localePrefs.preferences.dismissAlphaWarning" :mod-label="modLabel"
      :selection-count="selectedNoteIds.length"
      :is-logged-in="auth.isLoggedIn.value"
      :syncing="syncing"
      @toggle-sidebar="showSidebar = !showSidebar"
      @show-meta="currentNote && (showMetaModal = true)" @apply-format="applyFormat"
      @toggle-inline="showInlineResults = !showInlineResults"
      @toggle-markdown-preview="showMarkdownPreview = !showMarkdownPreview"
      @show-templates="showTemplates = true"
      @share-note="showShareModal = true"
      @sync="sync"
      @file-new="addNote"
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

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar - Notes List (desktop) -->
      <aside class="flex-shrink-0 hidden lg:block overflow-hidden transition-[width] duration-300 ease-in-out"
        :class="showSidebar ? 'w-80' : 'w-0'">
        <div class="w-80 h-full">
          <MainSidebar :notes="notes" :current-note-id="currentNoteId" :all-tags="allTags" :is-logged-in="auth.isLoggedIn.value" :user="auth.user.value" @new-note="addNote" @select-note="selectNote"
            @delete-note="confirmDelete" @edit-note="openEditModal"
            @bulk-delete="confirmBulkDelete" @selection-change="onSelectionChange"
            @show-help="showHelp = true"
            @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true"
            @show-auth="showAuthModal = true" @logout="handleLogout" @edit-profile="handleShowProfile" />
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
            <MainSidebar :notes="notes" :current-note-id="currentNoteId" :all-tags="allTags" :is-logged-in="auth.isLoggedIn.value" :user="auth.user.value" @new-note="addNote" @select-note="selectNote"
              @delete-note="confirmDelete" @edit-note="openEditModal"
              @bulk-delete="confirmBulkDelete" @selection-change="onSelectionChange"
              @show-help="showHelp = true"
              @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true"
              @show-auth="showAuthModal = true" @logout="handleLogout" @edit-profile="handleShowProfile" />
          </aside>
        </Transition>
      </Teleport>

      <!-- Editor Area -->
      <main class="flex-1 overflow-hidden flex flex-col isolate">
        <NoteEditor v-if="currentNote" ref="editorRef" :content="currentNote.content" :show-inline="showInlineResults"
          :locale-preferences="localePrefs.preferences"
          :show-markdown-preview="showMarkdownPreview"
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
              <button @click="addNote"
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

    <!-- Mobile: toggle button (always visible) + collapsible formatting toolbar -->
    <div v-if="currentNote" class="lg:hidden fixed left-0 right-0 z-10 transition-[bottom] duration-150 ease-out"
      :style="{ bottom: mobileKeyboardOffset + 'px' }">
      <!-- Toggle chevron — absolutely positioned above the toolbar so it doesn't push content -->
      <button @mousedown.prevent @click="showMobileToolbar = !showMobileToolbar"
        class="absolute right-2 bottom-full px-1.5 pt-1 pb-0.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-950 rounded-t-lg transition-colors z-50"
        :title="showMobileToolbar ? 'Hide formatting toolbar' : 'Show formatting toolbar'">
        <Icon :name="showMobileToolbar ? 'mdi:chevron-down' : 'mdi:chevron-up'" class="w-5 h-5 block" />
      </button>
      <!-- Collapsible toolbar -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-16 opacity-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="max-h-16 opacity-100"
        leave-to-class="max-h-0 opacity-0">
        <div v-if="showMobileToolbar" class="overflow-hidden bg-gray-50 dark:bg-gray-900"
          :style="{ paddingBottom: mobileKeyboardOffset === 0 ? 'env(safe-area-inset-bottom, 0px)' : '0px', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }">
          <FormattingToolbar container-class="px-2 py-1.5" @apply-format="applyFormat" />
        </div>
      </Transition>
    </div>

    <!-- Modals -->
    <NoteMetaModal :is-open="showMetaModal" :title="currentNote?.title || ''"
      :description="currentNote?.description || ''"
      :tags="currentNote?.tags || []"
      :all-tags="allTags"
      :note-id="currentNote?.id" @close="showMetaModal = false"
      @save="updateMeta" @delete="confirmDelete" />

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
      @close="showShareModal = false" />

    <ProfileModal :is-open="showProfileModal"
      :user="auth.user.value"
      :last-synced-at="lastSyncedAt"
      @close="showProfileModal = false"
      @update-profile="handleUpdateProfile"
      @change-password="handleChangePassword"
      @delete-data="handleDeleteData"
      @delete-account="handleDeleteAccount"
      @logout="handleLogout" />
  </div>
</template>

<script setup>
const { notes, currentNoteId, currentNote, allTags, deletedIds, addNote, deleteNote, updateNoteContent, updateNoteMeta, saveNotes, clearDeletedIds } = useNotes()
const { exportNoteAsText, exportNoteAsJson, exportNoteAsMarkdown, exportNoteAsPdf, exportAllNotes, openFile, importNotes, duplicateNote, copyToClipboard, printNote } = useFileActions()
const { evaluateLines } = useCalculator()
const localePrefs = useLocalePreferences()
const welcomeWizard = useWelcomeWizard()
const auth = useAuth()
const { syncing, lastSyncedAt, sync } = useSync(auth, notes, saveNotes, deletedIds, clearDeletedIds)

// Keyboard shortcuts — must be declared before refs so handlers can reference them
const { isMac, modLabel, handlers: shortcutHandlers } = useKeyboardShortcuts({
  save: () => {
    // Notes auto-save, but we still intercept to prevent browser save dialog
  },
  newNote: () => addNote(),
  openFile: () => handleOpenFile(),
  print: () => handlePrint(),
  duplicate: () => handleDuplicate(),
  exportText: () => handleExportText(),
  help: () => { showHelp.value = true },
  exportAll: () => handleExportAll(),
})

const showSidebar = ref(true) // Default to true for better UX
const showMetaModal = ref(false)
const showHelp = ref(false)
const showTemplates = ref(false)
const showLanguageModal = ref(false)
const showLocaleSettings = ref(false)
const showAbout = ref(false)
const showInlineResults = ref(true)
const showMobileToolbar = ref(true)
const showMarkdownPreview = ref(false)
const editorRef = ref(null)
const showAlphaWarning = ref(false)
const mobileKeyboardOffset = ref(0)
const showAuthModal = ref(false)
const showShareModal = ref(false)
const showProfileModal = ref(false)

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

// Hide sidebar on mobile by default + check alpha warning + welcome wizard
onMounted(() => {
  if (window.innerWidth < 1024) {
    showSidebar.value = false
  }
  showAlphaWarning.value = !localStorage.getItem('alpha-warning-dismissed') && !localePrefs.preferences.dismissAlphaWarning
  welcomeWizard.showIfFirstTime()
})

// Watch for the preference being toggled in settings
watch(() => localePrefs.preferences.dismissAlphaWarning, (dismissed) => {
  if (dismissed) {
    showAlphaWarning.value = false
    localStorage.setItem('alpha-warning-dismissed', '1')
  }
})

const dismissAlphaWarning = () => {
  showAlphaWarning.value = false
  localStorage.setItem('alpha-warning-dismissed', '1')
}

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

const handleLogout = () => {
  auth.logout()
}

const handleShowProfile = () => {
  auth.refreshUser()
  showProfileModal.value = true
}

const handleUpdateProfile = async (data) => {
  await auth.updateProfile(data)
}

const handleChangePassword = async ({ currentPassword, newPassword }) => {
  await auth.changePassword(currentPassword, newPassword)
}

const handleDeleteData = async (password) => {
  await auth.requestDeletion('data', password)
  await auth.refreshUser()
}

const handleDeleteAccount = async (password) => {
  await auth.requestDeletion('account', password)
  showProfileModal.value = false
}

// Check for pending import from shared note page
onMounted(() => {
  const pending = localStorage.getItem('pending_import')
  if (pending) {
    localStorage.removeItem('pending_import')
    try {
      const data = JSON.parse(pending)
      const newNote = addNote()
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
  }
}

const updateMeta = ({ title, description, tags }) => {
  if (currentNote.value) {
    updateNoteMeta(currentNote.value.id, { title, description, tags })
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
    const newNote = addNote()
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
    const newNote = addNote()
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
      const newNote = addNote()
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
</script>
