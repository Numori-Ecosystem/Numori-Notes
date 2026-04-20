<template>
  <UiPrompt
    :show="isOpen"
    title="Encrypted Back-up"
    icon="mdi:lock-outline"
    confirm-label="Decrypt"
    cancel-label="Cancel"
    :confirm-on-enter="true"
    :disabled="!password.trim()"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        This back-up is password protected. Enter the password used when it was created.
      </p>
      <UiInput
        ref="passwordInput"
        v-model="password"
        type="password"
        placeholder="Enter password"
        @keydown.enter="handleConfirm"
      />
      <p v-if="error" class="text-xs text-red-500 dark:text-red-400">
        {{ error }}
      </p>
    </div>
  </UiPrompt>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const password = ref('')
const passwordInput = ref(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    password.value = ''
    nextTick(() => passwordInput.value?.focus())
  }
})

const handleClose = () => emit('close')

const handleConfirm = () => {
  if (!password.value.trim()) return
  emit('confirm', password.value)
}
</script>
