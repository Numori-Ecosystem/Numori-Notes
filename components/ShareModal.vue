<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-sm w-full p-5 max-h-[85vh] overflow-y-auto">

            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">Share Note</h2>
              <button @click="$emit('close')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <!-- Already shared / just shared state -->
            <div v-if="activeHash" class="space-y-3">
              <p class="text-sm text-gray-700 dark:text-gray-400">Your note is shared. Anyone with this link can view it:</p>
              <div class="flex items-center gap-2">
                <input :value="activeShareUrl" readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-400 text-xs font-mono outline-none" />
                <button @click="copyLink"
                  class="flex-shrink-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4 block" />
                </button>
              </div>

              <!-- Analytics summary -->
              <div v-if="analyticsData && analyticsData.enabled" class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button @click="showAnalyticsDetail = !showAnalyticsDetail"
                  class="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors">
                  <div class="flex items-center gap-2">
                    <Icon name="mdi:chart-bar" class="w-4 h-4 text-primary-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ analyticsData.totalViews }} {{ analyticsData.totalViews === 1 ? 'view' : 'views' }}
                    </span>
                  </div>
                  <Icon :name="showAnalyticsDetail ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-4 h-4 text-gray-400" />
                </button>
                <div v-if="showAnalyticsDetail" class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Known viewers</span>
                    <span class="font-medium">{{ analyticsData.knownViewers }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Anonymous views</span>
                    <span class="font-medium">{{ analyticsData.anonymousViews }}</span>
                  </div>
                  <div v-if="analyticsData.views.length" class="pt-1 space-y-1.5">
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-500">Recent views</p>
                    <div v-for="(v, i) in analyticsData.views" :key="i"
                      class="flex items-center justify-between text-xs py-1 border-t border-gray-100 dark:border-gray-800">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <Icon :name="v.viewerName ? 'mdi:account' : 'mdi:incognito'" class="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                        <span class="text-gray-700 dark:text-gray-300 truncate">{{ v.viewerName || 'Unknown' }}</span>
                        <span v-if="v.device" class="text-gray-400 truncate hidden sm:inline">· {{ v.device }}</span>
                      </div>
                      <span class="text-gray-400 flex-shrink-0 ml-2">{{ formatTimeAgo(v.viewedAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="analyticsData && !analyticsData.enabled"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <Icon name="mdi:chart-bar" class="w-4 h-4 text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-500">Analytics not enabled for this share</span>
              </div>
              <div v-else-if="loadingAnalytics" class="flex items-center justify-center py-3">
                <Icon name="mdi:loading" class="w-5 h-5 text-gray-400 animate-spin" />
              </div>

              <div class="flex gap-2">
                <button @click="$emit('close')"
                  class="flex-1 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                  Done
                </button>
                <button @click="handleUnshare"
                  class="flex-1 px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                  Stop sharing
                </button>
              </div>
            </div>

            <!-- Share form -->
            <div v-else class="space-y-3">
              <p class="text-xs text-gray-500 dark:text-gray-500">
                No account needed. Share with a unique link.
              </p>

              <!-- Error -->
              <div v-if="error" class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
                {{ error }}
              </div>

              <!-- Anonymous toggle -->
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="anonymous" type="checkbox"
                  class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                <span class="text-sm text-gray-700 dark:text-gray-400">Share anonymously</span>
              </label>

              <!-- Sharer details (if not logged in and not anonymous) -->
              <template v-if="!isLoggedIn && !anonymous">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Your name</label>
                  <input v-model="sharerName" type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Optional" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Your email</label>
                  <input v-model="sharerEmail" type="email"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Optional" />
                </div>
              </template>

              <!-- Logged in but not anonymous: show who it'll be shared as -->
              <p v-if="isLoggedIn && !anonymous" class="text-xs text-gray-500 dark:text-gray-500">
                Shared as {{ userName || userEmail }}
              </p>

              <!-- Expiration -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Expires after</label>
                <select v-model="expiresInDays"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm">
                  <option :value="1">1 day</option>
                  <option :value="7">7 days</option>
                  <option :value="14">14 days</option>
                  <option :value="30">30 days</option>
                </select>
              </div>

              <!-- Analytics toggle with tooltip -->
              <div class="relative">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="collectAnalytics" type="checkbox"
                    class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                  <span class="text-sm text-gray-700 dark:text-gray-400">Enable view analytics</span>
                  <div class="relative group">
                    <Icon name="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <p class="font-medium mb-1">View Analytics</p>
                      <p>When enabled, the following data is collected each time someone opens your shared note:</p>
                      <ul class="list-disc pl-3 mt-1 space-y-0.5">
                        <li>Total number of views</li>
                        <li>Viewer's display name (if signed in and they allow tracking)</li>
                        <li>Device and browser info via user agent (if viewer allows it)</li>
                        <li>Referrer URL (where they came from)</li>
                        <li>Timestamp of each view</li>
                      </ul>
                      <p class="mt-1.5 text-gray-300">Emails are never collected. Signed-in users who have privacy protection enabled will appear as "Unknown" and their device info won't be recorded.</p>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                </label>
              </div>

              <button @click="handleShare" :disabled="sharing"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Icon v-if="sharing" name="mdi:loading" class="w-4 h-4 animate-spin" />
                <Icon v-else name="mdi:share-variant-outline" class="w-4 h-4" />
                Share Note
              </button>
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
  note: { type: Object, default: null },
  isLoggedIn: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  authHeaders: { type: Object, default: () => ({}) },
  existingHash: { type: String, default: null }
})

const emit = defineEmits(['close', 'unshare'])

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

// Analytics
const analyticsData = ref(null)
const loadingAnalytics = ref(false)
const showAnalyticsDetail = ref(false)

// Use existing hash if note is already shared, or the newly created one
const activeHash = computed(() => newShareHash.value || props.existingHash)

const activeShareUrl = computed(() => {
  if (!activeHash.value) return ''
  return apiUrl(`/shared/${activeHash.value}`)
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
    analyticsData.value = null
    showAnalyticsDetail.value = false
    // Load analytics if already shared
    if (props.existingHash && props.isLoggedIn) {
      loadAnalytics(props.existingHash)
    }
  }
})

const loadAnalytics = async (hash) => {
  loadingAnalytics.value = true
  try {
    analyticsData.value = await apiFetch(`/api/share/${hash}/analytics`, {
      headers: props.authHeaders
    })
  } catch {
    analyticsData.value = null
  } finally {
    loadingAnalytics.value = false
  }
}

const handleShare = async () => {
  if (!props.note) return
  sharing.value = true
  error.value = null

  try {
    const body = {
      title: props.note.title,
      description: props.note.description,
      tags: props.note.tags,
      content: props.note.content,
      anonymous: anonymous.value,
      expiresInDays: expiresInDays.value,
      collectAnalytics: collectAnalytics.value
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
    if (collectAnalytics.value && props.isLoggedIn) {
      loadAnalytics(data.hash)
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

const formatTimeAgo = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString()
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
