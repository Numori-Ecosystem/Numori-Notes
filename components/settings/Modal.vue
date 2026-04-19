<!-- eslint-disable vue/no-mutating-props -->
<template>
  <UiModal
    :show="isOpen"
    max-width="5xl"
    padding="md:p-4"
    panel-class="h-screen md:h-[90vh] safe-area-modal rounded-none md:rounded-lg"
    @close="closeModal"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
      >
        <div class="flex items-center gap-2">
          <UiButton
            variant="ghost"
            color="gray"
            icon-only
            class="md:hidden"
            :title="activeSection ? 'Back' : 'Close'"
            @click="mobileBack"
          >
            <Icon :name="activeSection && isMobile ? 'mdi:arrow-left' : 'mdi:close'" class="block w-5 h-5" />
          </UiButton>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-200 leading-none">
            {{ activeSection && isMobile ? activeSectionLabel : 'Settings' }}
          </h2>
        </div>
        <UiButton variant="ghost" color="gray" icon-only class="hidden md:flex" @click="closeModal">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <!-- Body: sidebar + content -->
      <div class="flex flex-1 overflow-hidden min-h-0">
        <!-- Sidebar navigation -->
        <nav
          v-show="!isMobile || (!activeSection && transitionState !== 'leaving')"
          class="flex-shrink-0 w-full md:w-60 h-full bg-gray-50 dark:bg-gray-900 md:border-r border-gray-200 dark:border-gray-800 flex flex-col"
        >
          <div class="p-3 pb-2 flex-shrink-0">
            <div class="relative">
              <Icon
                name="mdi:magnify"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search settings..."
                class="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                @keydown.escape="searchQuery = ''"
              >
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="searchQuery = ''"
              >
                <Icon name="mdi:close" class="block w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <ul class="px-2 pb-3 space-y-0.5 overflow-y-auto flex-1 min-h-0">
            <template v-for="(section, idx) in filteredSections" :key="section.id">
              <!-- Separator between app settings and account sections -->
              <li v-if="section.id === 'profile' && idx > 0" class="py-1.5 px-3">
                <div class="border-t border-gray-200 dark:border-gray-700/50" />
              </li>
              <li>
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
                  :class="
                    activeSection === section.id
                      ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850'
                  "
                  @click="selectSection(section.id)"
                >
                  <Icon :name="section.icon" class="w-5 h-5 flex-shrink-0 opacity-70" />
                  <div class="min-w-0">
                    <span class="block truncate">{{ section.label }}</span>
                    <span class="block text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {{ section.description }}
                    </span>
                  </div>
                </button>
              </li>
            </template>
            <li
              v-if="searchQuery && filteredSections.length === 0"
              class="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-500"
            >
              <Icon name="mdi:magnify" class="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No results for "{{ searchQuery }}"</p>
            </li>
          </ul>
        </nav>

        <!-- Content panel -->
        <div v-show="!isMobile || activeSection || transitionState === 'leaving'" ref="contentPanelRef" class="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-925">
          <!-- No section selected (desktop placeholder) -->
          <div
            v-if="!activeSection && !isMobile"
            class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500"
          >
            <div class="text-center">
              <Icon name="mdi:cog-outline" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p class="text-sm">Select a category</p>
            </div>
          </div>

          <!-- Section content with slide transition -->
          <div v-if="displayedSection" :class="sectionTransitionClasses">
            <SettingsLocales v-if="displayedSection === 'locales'" :preferences="preferences" :apply-preset="applyPreset" :get-active-preset="getActivePreset" :save="save" :on-setting-change="onSettingChange" />
            <SettingsTypography v-else-if="displayedSection === 'typography'" :preferences="preferences" :on-setting-change="onSettingChange" />
            <SettingsLayout v-else-if="displayedSection === 'layout'" :preferences="preferences" :on-setting-change="onSettingChange" />
            <SettingsCursor v-else-if="displayedSection === 'cursor'" :preferences="preferences" :on-setting-change="onSettingChange" />
            <SettingsBehaviour v-else-if="displayedSection === 'behaviour'" :preferences="preferences" :on-setting-change="onSettingChange" />
            <SettingsResults v-else-if="displayedSection === 'results'" :preferences="preferences" :on-setting-change="onSettingChange" />
            <SettingsGeneral v-else-if="displayedSection === 'general'" :preferences="preferences" :on-setting-change="onSettingChange" @relaunch-wizard="emit('relaunch-wizard')" />
            <SettingsProfile v-else-if="displayedSection === 'profile'" ref="profileRef" :user="user" :last-synced-at="lastSyncedAt" :auth-headers="authHeaders" @update-profile="emit('update-profile', $event)" @change-password="emit('change-password', $event)" @logout="emit('logout'); closeModal()" @sync-now="emit('sync-now')" @show-notes="emit('show-notes')" @navigate-section="selectSection" />
            <SettingsSecurity v-else-if="displayedSection === 'security'" :user="user" :auth-headers="authHeaders" />
            <SettingsSessions v-else-if="displayedSection === 'sessions'" :auth-headers="authHeaders" />
            <SettingsSharedNotes v-else-if="displayedSection === 'shared'" :auth-headers="authHeaders" @unshare="emit('unshare', $event)" @open-analytics="emit('open-analytics', $event)" @close-modal="closeModal" />
            <SettingsDangerZone v-else-if="displayedSection === 'danger'" :on-delete-data="onDeleteData" :on-delete-account="onDeleteAccount" />
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialSection: { type: String, default: null },
  // Locale preferences
  preferences: { type: Object, required: true },
  applyPreset: { type: Function, required: true },
  setPreference: { type: Function, required: true },
  getActivePreset: { type: Function, required: true },
  save: { type: Function, required: true },
  reset: { type: Function, required: true },
  // Profile
  user: { type: Object, default: null },
  lastSyncedAt: { type: String, default: null },
  authHeaders: { type: Object, default: () => ({}) },
  onDeleteData: { type: Function, default: null },
  onDeleteAccount: { type: Function, default: null },
})

const emit = defineEmits([
  'close',
  'relaunch-wizard',
  'update-profile',
  'change-password',
  'logout',
  'unshare',
  'open-analytics',
  'sync-now',
  'show-notes',
])

// ── Child refs ──
const profileRef = ref(null)

// ── Navigation state ──
const activeSection = ref(null)
const displayedSection = ref(null)
const slideDirection = ref('down')
const searchQuery = ref('')
const isMobile = ref(false)
const contentPanelRef = ref(null)

const checkMobile = () => { isMobile.value = window.innerWidth < 768 }

const sections = [
  { id: 'locales', label: 'Locales', icon: 'mdi:earth', description: 'Region & formats', keywords: 'locale language preset volume fuel economy distance temperature date time number format region' },
  { id: 'typography', label: 'Typography', icon: 'mdi:format-font', description: 'Font & sizing', keywords: 'font family size line height ligatures typography text' },
  { id: 'layout', label: 'Layout', icon: 'mdi:page-layout-body', description: 'Gutters & visual aids', keywords: 'layout line numbers word wrap folding highlight gutter' },
  { id: 'cursor', label: 'Cursor & Scrolling', icon: 'mdi:cursor-text', description: 'Cursor & scroll', keywords: 'cursor style scroll past end' },
  { id: 'behaviour', label: 'Behaviour', icon: 'mdi:cog-outline', description: 'Editing defaults', keywords: 'behaviour auto close brackets tab size indentation' },
  { id: 'results', label: 'Results & Display', icon: 'mdi:calculator-variant-outline', description: 'Precision & output', keywords: 'results display precision decimal significant copy animation code blocks' },
  { id: 'general', label: 'General', icon: 'mdi:tune-variant', description: 'App settings', keywords: 'general welcome wizard relaunch setup update check interval version' },
  // Account sections (separated visually in sidebar)
  { id: 'profile', label: 'Profile', icon: 'mdi:account-circle-outline', description: 'Account info', keywords: 'profile account name email avatar photo' },
  { id: 'security', label: 'Security', icon: 'mdi:shield-lock-outline', description: 'Lock & recovery', keywords: 'security session app lock pin password biometrics recovery privacy screen' },
  { id: 'sessions', label: 'Sessions', icon: 'mdi:devices', description: 'Active devices', keywords: 'sessions devices logged in active' },
  { id: 'shared', label: 'Shared Notes', icon: 'mdi:share-variant-outline', description: 'Manage shares', keywords: 'shared notes links sharing analytics' },
  { id: 'danger', label: 'Danger Zone', icon: 'mdi:alert-outline', description: 'Delete data', keywords: 'danger delete account data reset destroy' },
]

const onSettingChange = () => props.save()

const activeSectionLabel = computed(() => {
  const s = sections.find((s) => s.id === activeSection.value)
  return s ? s.label : 'Settings'
})

// ── Search & filtering ──
const filteredSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sections
  return sections.filter((s) => s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q))
})

watch(filteredSections, (filtered) => {
  if (searchQuery.value && filtered.length === 1) activeSection.value = filtered[0].id
})

const selectSection = (id) => {
  if (id === activeSection.value) return
  if (profileRef.value?.subSection) profileRef.value.subSection = null

  // On mobile, switching between sections should also slide horizontally
  if (isMobile.value && activeSection.value) {
    slideDirection.value = sectionIndex(id) > sectionIndex(activeSection.value) ? 'right' : 'left'
    transitionState.value = 'leaving'
    const enterDir = slideDirection.value
    setTimeout(() => {
      activeSection.value = id
      displayedSection.value = id
      if (contentPanelRef.value) contentPanelRef.value.scrollTop = 0
      slideDirection.value = enterDir
      transitionState.value = 'entering-start'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          transitionState.value = 'entering'
          setTimeout(() => { transitionState.value = 'idle' }, 200)
        })
      })
    }, 200)
  } else {
    activeSection.value = id
  }

  searchQuery.value = ''
}

const sectionIndex = (id) => sections.findIndex((s) => s.id === id)

// ── Transition ──
const transitionState = ref('idle')
const mobileGoingBack = ref(false)

watch(activeSection, (newId, oldId) => {
  const mobile = isMobile.value

  // Mobile: entering a section (from sidebar) or going back (to sidebar)
  if (mobile) {
    const goingBack = mobileGoingBack.value
    mobileGoingBack.value = false

    if (!oldId && newId) {
      slideDirection.value = 'right'
      displayedSection.value = newId
      transitionState.value = 'entering-start'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          transitionState.value = 'entering'
          setTimeout(() => { transitionState.value = 'idle' }, 200)
        })
      })
      return
    }
    if (oldId && !newId && goingBack) {
      slideDirection.value = 'left'
      transitionState.value = 'leaving'
      setTimeout(() => {
        displayedSection.value = null
        transitionState.value = 'idle'
      }, 200)
      return
    }
  }

  // Desktop or section-to-section switch
  if (!oldId || !newId) {
    displayedSection.value = newId
    transitionState.value = 'idle'
    return
  }
  slideDirection.value = sectionIndex(newId) > sectionIndex(oldId) ? 'down' : 'up'
  transitionState.value = 'leaving'
  setTimeout(() => {
    displayedSection.value = newId
    if (contentPanelRef.value) contentPanelRef.value.scrollTop = 0
    transitionState.value = 'entering-start'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionState.value = 'entering'
        setTimeout(() => { transitionState.value = 'idle' }, 200)
      })
    })
  }, 150)
}, { immediate: true })

const sectionTransitionClasses = computed(() => {
  const dir = slideDirection.value
  const mobile = isMobile.value

  if (mobile && (dir === 'right' || dir === 'left')) {
    switch (transitionState.value) {
      case 'leaving': return dir === 'left'
        ? 'transition-all duration-200 ease-in opacity-0 translate-x-8'
        : 'transition-all duration-200 ease-in opacity-0 -translate-x-8'
      case 'entering-start': return dir === 'right'
        ? 'opacity-0 translate-x-8'
        : 'opacity-0 -translate-x-8'
      case 'entering': return 'transition-all duration-200 ease-out opacity-100 translate-x-0'
      default: return 'opacity-100 translate-x-0'
    }
  }

  switch (transitionState.value) {
    case 'leaving': return dir === 'down' ? 'transition-all duration-150 ease-in opacity-0 -translate-y-4' : 'transition-all duration-150 ease-in opacity-0 translate-y-4'
    case 'entering-start': return dir === 'down' ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-4'
    case 'entering': return 'transition-all duration-200 ease-out opacity-100 translate-y-0'
    default: return 'opacity-100 translate-y-0'
  }
})

const mobileBack = () => {
  if (profileRef.value?.subSection) { profileRef.value.subSection = null; return }
  if (activeSection.value && isMobile.value) { mobileGoingBack.value = true; activeSection.value = null } else { closeModal() }
}

// ── Lifecycle ──
const closeModal = () => {
  activeSection.value = null; displayedSection.value = null; transitionState.value = 'idle'
  searchQuery.value = ''
  emit('close')
}

const handleEscape = (e) => { if (e.key === 'Escape' && props.isOpen) closeModal() }

onMounted(() => {
  checkMobile(); window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', checkMobile)
})

watch(() => props.isOpen, (open) => {
  if (open) {
    checkMobile()
    const target = props.initialSection || (isMobile.value ? null : 'locales')
    activeSection.value = target
  }
})
</script>
