<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-925">
    <!-- Alpha Warning Banner -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-20"
      leave-to-class="opacity-0 max-h-0">
      <div v-if="showAlphaWarning"
        class="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between gap-3 text-sm text-amber-800 dark:text-amber-200 overflow-hidden">
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
      :hide-alpha="localePrefs.preferences.dismissAlphaWarning"
      @toggle-sidebar="showSidebar = !showSidebar"
      @show-meta="currentNote && (showMetaModal = true)" @apply-format="applyFormat"
      @toggle-inline="showInlineResults = !showInlineResults"
      @toggle-markdown-preview="showMarkdownPreview = !showMarkdownPreview"
      @show-templates="showTemplates = true"
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
          <MainSidebar :notes="notes" :current-note-id="currentNoteId" :all-tags="allTags" @new-note="addNote" @select-note="selectNote"
            @delete-note="confirmDelete" @edit-note="openEditModal"
            @show-help="showHelp = true"
            @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true" />
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
          <aside v-if="showSidebar" class="fixed inset-y-0 left-0 z-30 w-80 shadow-xl lg:hidden">
            <MainSidebar :notes="notes" :current-note-id="currentNoteId" :all-tags="allTags" @new-note="addNote" @select-note="selectNote"
              @delete-note="confirmDelete" @edit-note="openEditModal"
              @show-help="showHelp = true"
              @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true" />
          </aside>
        </Transition>
      </Teleport>

      <!-- Editor Area -->
      <main class="flex-1 overflow-hidden flex flex-col isolate">
        <NoteEditor v-if="currentNote" ref="editorRef" :content="currentNote.content" :show-inline="showInlineResults"
          :locale-preferences="localePrefs.preferences"
          :show-markdown-preview="showMarkdownPreview"
          @update:content="updateContent"
          :placeholder="'Start typing... Try: 10 + 20, or use # for headers, // for comments'" />
        <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>Select a note or create a new one</p>
        </div>
      </main>
    </div>

    <!-- Mobile: toggle button (always visible) + collapsible formatting toolbar -->
    <div v-if="currentNote" class="lg:hidden sticky bottom-0 z-10 relative">
      <!-- Toggle chevron — absolutely positioned above the toolbar so it doesn't push content -->
      <button @click="showMobileToolbar = !showMobileToolbar"
        class="absolute right-2 bottom-full px-1.5 pt-1 pb-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg transition-colors shadow-sm z-50"
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
        <div v-if="showMobileToolbar" class="overflow-hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
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

    <HelpModal :is-open="showHelp" @close="showHelp = false" />
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

    <WelcomeWizard :is-open="welcomeWizard.isOpen.value"
      :preferences="localePrefs.preferences"
      :apply-preset="localePrefs.applyPreset"
      :save-preferences="localePrefs.save"
      @complete="welcomeWizard.complete()" />
  </div>
</template>

<script setup>
const { notes, currentNoteId, currentNote, allTags, addNote, deleteNote, updateNoteContent, updateNoteMeta } = useNotes()
const { exportNoteAsText, exportNoteAsJson, exportNoteAsMarkdown, exportNoteAsPdf, exportAllNotes, openFile, importNotes, duplicateNote, copyToClipboard, printNote } = useFileActions()
const { evaluateLines } = useCalculator()
const localePrefs = useLocalePreferences()
const welcomeWizard = useWelcomeWizard()

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
  if (confirm('Are you sure you want to delete this note?')) {
    deleteNote(id)
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

const handleExportText = () => askExportOptions('text')
const handleExportMarkdown = () => askExportOptions('markdown')
const handleExportPdf = () => askExportOptions('pdf')
const handleExportJson = () => exportNoteAsJson(currentNote.value)
const handleExportAll = () => exportAllNotes(notes.value)

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
