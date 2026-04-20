<template>
  <UiPrompt
    :show="isOpen"
    title="Print Note"
    icon="mdi:printer"
    :confirm-on-enter="false"
    @close="$emit('close')"
  >
    <div class="space-y-5">
      <!-- Note indicator -->
      <div v-if="noteTitle" class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Note
        </p>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center gap-3 px-3 py-2.5">
            <Icon name="mdi:note-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ noteTitle }}</span>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="space-y-2.5">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Options
        </p>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
          <label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <UiCheckbox v-model="includeResults" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Include results</span>
            </div>
            <Icon name="mdi:calculator-variant-outline" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
          <label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <UiCheckbox v-model="blackAndWhite" />
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-800 dark:text-gray-200">Black &amp; white</span>
            </div>
            <Icon name="mdi:invert-colors-off" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </label>
        </div>
      </div>
    </div>

    <template #actions>
      <UiButton variant="ghost" color="gray" @click="$emit('close')">Cancel</UiButton>
      <UiButton @click="handleConfirm">
        <Icon name="mdi:printer" class="w-4 h-4" />
        Print
      </UiButton>
    </template>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  noteTitle: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const includeResults = ref(false)
const blackAndWhite = ref(false)

const handleConfirm = () => {
  emit('confirm', {
    withResults: includeResults.value,
    blackAndWhite: blackAndWhite.value,
  })
}
</script>
