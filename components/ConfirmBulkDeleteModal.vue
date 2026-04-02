<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-sm w-full p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
                Delete {{ count }} {{ count === 1 ? 'Note' : 'Notes' }}
              </h2>
              <button @click="$emit('close')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete {{ count }} {{ count === 1 ? 'note' : 'notes' }}? This cannot be undone.
            </p>

            <div class="flex justify-end gap-2">
              <button @click="$emit('close')"
                class="px-4 py-2 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors text-sm">
                Cancel
              </button>
              <button @click="$emit('confirm')"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md text-sm">
                Delete {{ count }} {{ count === 1 ? 'Note' : 'Notes' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  count: { type: Number, default: 0 }
})

defineEmits(['close', 'confirm'])
</script>
