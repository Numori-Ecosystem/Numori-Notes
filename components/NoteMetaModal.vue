<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-md w-full p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
              Note Details
            </h2>
            <button @click="$emit('close')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <Icon name="mdi:close" class="block w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                Title
              </label>
              <input v-model="localTitle" type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Untitled Note" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                Description
              </label>
              <textarea v-model="localDescription" rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                placeholder="Add a description..." />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                Tags
              </label>
              <div class="flex flex-wrap gap-1.5 mb-2" v-if="localTags.length">
                <span v-for="(tag, i) in localTags" :key="i"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  {{ tag }}
                  <button @click="removeTag(i)" type="button"
                    class="hover:text-primary-900 dark:hover:text-primary-100 transition-colors">
                    <Icon name="mdi:close" class="w-3 h-3" />
                  </button>
                </span>
              </div>
              <div class="relative">
                <input v-model="tagInput" type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="e.g. work, ideas, urgent"
                  @keydown.enter.prevent="addTags"
                  @keydown.backspace="tagInput === '' && localTags.length && removeTag(localTags.length - 1)"
                  @input="onTagInput" />
                <div v-if="tagSuggestions.length" class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  <button v-for="s in tagSuggestions" :key="s" @mousedown.prevent="selectSuggestion(s)"
                    class="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {{ s }}
                  </button>
                </div>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Press Enter to add. Separate multiple tags with commas.
              </p>
            </div>
          </div>

          <!-- Share status -->
          <div v-if="noteId" class="mt-4 px-3 py-2.5 rounded-lg border"
            :class="props.shared
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon :name="props.shared ? 'mdi:link-variant' : 'mdi:link-variant-off'"
                  class="w-4 h-4"
                  :class="props.shared ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'" />
                <span class="text-sm" :class="props.shared ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'">
                  {{ props.shared ? 'This note is shared' : 'Not shared' }}
                </span>
              </div>
              <button v-if="props.shared" @click="emit('unshare', props.noteId)"
                class="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                Stop sharing
              </button>
              <button v-else @click="emit('share', props.noteId)"
                class="text-xs px-2 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors">
                Share
              </button>
            </div>
          </div>

          <div class="flex justify-between gap-2 mt-6">
            <button v-if="noteId" @click="handleDelete"
              class="px-4 py-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors">
              Delete
            </button>
            <div class="flex-1"></div>
            <button @click="$emit('close')"
              class="px-4 py-2 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors">
              Cancel
            </button>
            <button @click="save"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md">
              Save
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
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
  allTags: { type: Array, default: () => [] },
  noteId: { type: String, default: null },
  shared: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save', 'delete', 'share', 'unshare'])

const localTitle = ref(props.title)
const localDescription = ref(props.description)
const localTags = ref([...props.tags])
const tagInput = ref('')
const tagSuggestions = ref([])

watch(() => props.isOpen, (open) => {
  if (open) {
    localTitle.value = props.title
    localDescription.value = props.description
    localTags.value = [...props.tags]
    tagInput.value = ''
    tagSuggestions.value = []
  }
})

const addTags = () => {
  tagInput.value.split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t && !localTags.value.includes(t))
    .forEach(t => localTags.value.push(t))
  tagInput.value = ''
  tagSuggestions.value = []
}

const removeTag = (index) => {
  localTags.value.splice(index, 1)
}

const selectSuggestion = (tag) => {
  if (!localTags.value.includes(tag)) {
    localTags.value.push(tag)
  }
  tagInput.value = ''
  tagSuggestions.value = []
}

const onTagInput = () => {
  const q = tagInput.value.trim().toLowerCase()
  if (!q) { tagSuggestions.value = []; return }
  tagSuggestions.value = props.allTags.filter(t => t.includes(q) && !localTags.value.includes(t))
}

const save = () => {
  emit('save', {
    title: localTitle.value,
    description: localDescription.value,
    tags: [...localTags.value]
  })
  emit('close')
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this note?')) {
    emit('delete', props.noteId)
    emit('close')
  }
}
</script>

<style scoped>
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-panel-enter-active {
  transition: all 0.2s ease-out;
}
.modal-panel-leave-active {
  transition: all 0.15s ease-in;
}
.modal-panel-enter-from,
.modal-panel-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
