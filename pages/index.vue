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
          ⚠️ This app is in very early alpha. Expect bugs, partially implemented features, and missing functionality.
        </p>
        <button @click="dismissAlphaWarning"
          class="flex-shrink-0 p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
          aria-label="Dismiss warning">
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- Mobile-friendly Toolbar -->
    <AppHeader :current-note="currentNote" :show-results="showResults" :show-mobile-toolbar="showMobileToolbar"
      @toggle-sidebar="showSidebar = !showSidebar"
      @show-meta="currentNote && (showMetaModal = true)" @apply-format="applyFormat"
      @toggle-results="showResults = !showResults" @toggle-mobile-toolbar="showMobileToolbar = !showMobileToolbar" />

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar - Notes List -->
      <aside class="w-80 flex-shrink-0 hidden lg:block">
        <NotesList :notes="notes" :current-note-id="currentNoteId" @new-note="addNote" @select-note="selectNote"
          @delete-note="confirmDelete" @edit-note="openEditModal"
          @show-templates="showTemplates = true" @show-help="showHelp = true"
          @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true" />
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
            <NotesList :notes="notes" :current-note-id="currentNoteId" @new-note="addNote" @select-note="selectNote"
              @delete-note="confirmDelete" @edit-note="openEditModal"
              @show-templates="showTemplates = true" @show-help="showHelp = true"
              @show-language="showLanguageModal = true" @show-locale-settings="showLocaleSettings = true" />
          </aside>
        </Transition>
      </Teleport>

      <!-- Editor Area -->
      <main class="flex-1 overflow-hidden flex flex-col">
        <NoteEditor v-if="currentNote" ref="editorRef" :content="currentNote.content" :show-results="showResults"
          :locale-preferences="localePrefs.preferences"
          @update:content="updateContent"
          :placeholder="'Start typing... Try: 10 + 20, or use # for headers, // for comments'" />
        <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>Select a note or create a new one</p>
        </div>
      </main>
    </div>

    <!-- Mobile bottom formatting toolbar -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0">
      <div v-if="currentNote && showMobileToolbar" class="lg:hidden sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
      <div class="flex items-center justify-center gap-1 px-2 py-1.5 overflow-x-auto">
        <button @click="applyFormat('**', '**')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Bold">
          <Icon name="mdi:format-bold" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('*', '*')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Italic">
          <Icon name="mdi:format-italic" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('~~', '~~')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Strikethrough">
          <Icon name="mdi:format-strikethrough" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('# ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Heading">
          <Icon name="mdi:format-header-1" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('- ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="List">
          <Icon name="mdi:format-list-bulleted" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('- [ ] ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Checklist">
          <Icon name="mdi:checkbox-marked-outline" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('> ', '')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Quote">
          <Icon name="mdi:format-quote-close" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('`', '`')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Code">
          <Icon name="mdi:code-tags" class="w-5 h-5 block" />
        </button>
        <button @click="applyFormat('[', '](url)')"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors flex-shrink-0 leading-none"
          title="Link">
          <Icon name="mdi:link-variant" class="w-5 h-5 block" />
        </button>
      </div>
    </div>
    </Transition>

    <!-- Modals -->
    <NoteMetaModal :is-open="showMetaModal" :title="currentNote?.title || ''"
      :description="currentNote?.description || ''" :note-id="currentNote?.id" @close="showMetaModal = false"
      @save="updateMeta" @delete="confirmDelete" />

    <HelpModal :is-open="showHelp" @close="showHelp = false" />
    <TemplatesModal :is-open="showTemplates" @close="showTemplates = false" @insert="insertTemplate" />
    <LanguageSwitcher :is-open="showLanguageModal" @close="showLanguageModal = false" />
    <LocaleSettingsModal :is-open="showLocaleSettings"
      :preferences="localePrefs.preferences"
      :apply-preset="localePrefs.applyPreset"
      :set-preference="localePrefs.setPreference"
      :get-active-preset="localePrefs.getActivePreset"
      :save="localePrefs.save"
      :reset="localePrefs.reset"
      @close="showLocaleSettings = false" />
  </div>
</template>

<script setup>
const { notes, currentNoteId, currentNote, addNote, deleteNote, updateNoteContent, updateNoteMeta } = useNotes()
const localePrefs = useLocalePreferences()

const showSidebar = ref(true) // Default to true for better UX
const showMetaModal = ref(false)
const showHelp = ref(false)
const showTemplates = ref(false)
const showLanguageModal = ref(false)
const showLocaleSettings = ref(false)
const showResults = ref(true)
const showMobileToolbar = ref(true)
const editorRef = ref(null)
const showAlphaWarning = ref(false)

// Hide sidebar on mobile by default + check alpha warning
onMounted(() => {
  if (window.innerWidth < 1024) {
    showSidebar.value = false
  }
  showAlphaWarning.value = !localStorage.getItem('alpha-warning-dismissed')
})

const dismissAlphaWarning = () => {
  showAlphaWarning.value = false
  localStorage.setItem('alpha-warning-dismissed', '1')
}

const selectNote = (id) => {
  currentNoteId.value = id
  showSidebar.value = false // Close sidebar on mobile after selection
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

const updateMeta = ({ title, description }) => {
  if (currentNote.value) {
    updateNoteMeta(currentNote.value.id, { title, description })
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
</script>
