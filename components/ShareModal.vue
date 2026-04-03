<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-sm w-full p-5">

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
const sharing = ref(false)
const error = ref(null)
const newShareHash = ref(null)
const copied = ref(false)

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
    sharing.value = false
    error.value = null
    newShareHash.value = null
    copied.value = false
  }
})

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
      expiresInDays: expiresInDays.value
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
