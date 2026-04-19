<template>
  <UiPrompt :show="isOpen" title="Export Options" body="Include calculation results in the export?" @close="$emit('close')">
    <template #actions>
      <UiButton variant="ghost" color="gray" @click="$emit('confirm', false)">
        Without Results
      </UiButton>
      <UiButton @click="$emit('confirm', true)"> With Results </UiButton>
    </template>
  </UiPrompt>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>
