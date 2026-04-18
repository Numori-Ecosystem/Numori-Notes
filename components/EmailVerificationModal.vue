<template>
  <UiModal :show="isOpen" max-width="sm" @close="$emit('close')">
    <div class="p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">Verify Email</h2>
        <UiButton variant="ghost" color="gray" icon-only @click="$emit('close')">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">
        Enter the 6-digit code sent to your email address.
      </p>

      <div v-if="error" class="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
        {{ error }}
      </div>

      <div v-if="success" class="mb-3 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs">
        {{ success }}
      </div>

      <form @submit.prevent="handleVerify" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Verification Code</label>
          <UiInput v-model="code" type="text" required :maxlength="6" pattern="[0-9]{6}"
            validation-pattern="^[0-9]{6}$" validation-message="Enter a 6-digit code"
            placeholder="000000" />
        </div>
        <UiButton native-type="submit" block :loading="loading" :disabled="loading || code.length !== 6">
          Verify
        </UiButton>
      </form>

      <p class="text-center text-xs text-gray-500 dark:text-gray-500 mt-3">
        Didn't receive a code?
        <UiButton variant="link" color="primary" @click="handleResend" :disabled="loading || resendCooldown > 0">
          {{ resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code' }}
        </UiButton>
      </p>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

const emit = defineEmits(['close', 'verify', 'resend'])

const code = ref('')
const success = ref(null)
const resendCooldown = ref(0)
let cooldownTimer = null

watch(() => props.isOpen, (open) => {
  if (open) {
    code.value = ''
    success.value = null
  }
})

const handleVerify = () => {
  emit('verify', code.value)
}

const handleResend = () => {
  emit('resend')
  success.value = 'A new code has been sent to your email.'
  resendCooldown.value = 60
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

onBeforeUnmount(() => clearInterval(cooldownTimer))
</script>
