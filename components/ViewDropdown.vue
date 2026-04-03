<template>
  <div class="relative" ref="dropdownRef">
    <button @click="open = !open"
      class="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title="View menu">
      <Icon name="mdi:eye-outline" class="w-4.5 h-4.5 block" />
      <span class="hidden sm:inline text-sm">View</span>
      <Icon name="mdi:chevron-down" class="w-3 h-3 block transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="open"
        class="absolute left-0 mt-1 w-48 sm:w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">

        <DropdownItem icon="mdi:language-markdown" label="Markdown Preview" @click="action('toggle-markdown-preview')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <DropdownItem icon="mdi:file-document-outline" label="Templates" @click="action('templates')" />

        <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <DropdownItem icon="mdi:information-outline" label="About" @click="action('about')" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
const emit = defineEmits([
  'toggle-markdown-preview',
  'templates',
  'about',
])

const open = ref(false)
const dropdownRef = ref(null)

const action = (name) => {
  open.value = false
  emit(name)
}

onClickOutside(dropdownRef, () => {
  open.value = false
})

useEventListener(document, 'keydown', (e) => {
  if (e.key === 'Escape') open.value = false
})
</script>
