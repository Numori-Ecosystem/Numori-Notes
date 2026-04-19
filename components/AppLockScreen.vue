<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50 dark:bg-gray-950 overflow-hidden"
      >
        <!-- Subtle background decoration -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            class="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary-400/5 dark:bg-primary-400/3 blur-3xl"
          />
          <div
            class="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-primary-600/5 dark:bg-primary-600/3 blur-3xl"
          />
        </div>

        <div class="relative w-full max-w-sm px-8 text-center">
          <!-- App icon / lock icon -->
          <div class="flex flex-col items-center gap-4 mb-8">
            <div
              class="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20"
            >
              <Icon name="mdi:lock" class="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
                Numori Notes
              </h1>
              <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {{ unlockLabel }}
              </p>
            </div>
          </div>

          <!-- Biometric prompt (shown first for biometrics method) -->
          <div v-if="showBiometricPrompt" class="space-y-4">
            <UiButton
              variant="solid"
              color="primary"
              block
              size="lg"
              shape="pill"
              @click="attemptBiometrics"
            >
              <Icon name="mdi:fingerprint" class="w-5 h-5" />
              Unlock with biometrics
            </UiButton>
            <UiButton
              variant="ghost"
              color="gray"
              block
              size="sm"
              @click="showBiometricPrompt = false"
            >
              Use {{ fallbackLabel }} instead
            </UiButton>
          </div>

          <!-- PIN input -->
          <div v-else-if="activeMethod === 'pin'" class="space-y-6">
            <!-- PIN dots -->
            <div class="flex justify-center gap-3">
              <div
                v-for="i in pinLength"
                :key="i"
                class="w-3.5 h-3.5 rounded-full transition-all duration-200"
                :class="[
                  i <= enteredPin.length
                    ? 'bg-primary-500 dark:bg-primary-400 scale-110 shadow-sm shadow-primary-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600',
                  shake && i <= enteredPin.length ? 'animate-shake' : '',
                ]"
              />
            </div>

            <!-- Number pad -->
            <UiNumpad
              :can-delete="enteredPin.length > 0"
              capture-keyboard
              @digit="enterDigit"
              @delete="deleteDigit"
            >
              <template v-if="hasBiometrics" #bottom-left>
                <button
                  class="h-16 w-full rounded-2xl transition-all duration-150 flex items-center justify-center text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95"
                  @click="showBiometricPrompt = true"
                >
                  <Icon name="mdi:fingerprint" class="w-6 h-6" />
                </button>
              </template>
            </UiNumpad>
          </div>

          <!-- Password input -->
          <div v-else-if="activeMethod === 'password'" class="space-y-4">
            <UiInput
              ref="passwordInputRef"
              v-model="enteredPassword"
              type="password"
              placeholder="Enter password"
              :validate="false"
              @keydown.enter="submitPassword"
            />
            <UiButton
              variant="solid"
              color="primary"
              block
              size="lg"
              shape="pill"
              :disabled="!enteredPassword"
              @click="submitPassword"
            >
              Unlock
            </UiButton>

            <!-- Biometrics shortcut -->
            <UiButton
              v-if="hasBiometrics"
              variant="ghost"
              color="primary"
              size="sm"
              @click="showBiometricPrompt = true"
            >
              <Icon name="mdi:fingerprint" class="w-4 h-4" />
              Use biometrics
            </UiButton>
          </div>

          <!-- Error message -->
          <Transition
            enter-active-class="transition duration-200"
            enter-from-class="opacity-0 -translate-y-1"
            leave-active-class="transition duration-150"
            leave-to-class="opacity-0"
          >
            <p v-if="error" class="mt-4 text-sm text-red-500 dark:text-red-400 font-medium">
              {{ error }}
            </p>
          </Transition>

          <!-- Logout -->
          <div class="mt-10">
            <UiButton
              variant="ghost"
              color="gray"
              size="sm"
              @click="$emit('logout')"
            >
              <Icon name="mdi:logout-variant" class="w-4 h-4" />
              Sign out
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
})

defineEmits(['logout'])

const { settings, biometricsEnrolled, unlock, unlockWithBiometrics } = useAppLock()

const pinLength = 4
const enteredPin = ref('')
const enteredPassword = ref('')
const error = ref('')
const shake = ref(false)
const showBiometricPrompt = ref(false)
const passwordInputRef = ref(null)

const hasBiometrics = computed(() => settings.method === 'biometrics' && biometricsEnrolled.value)

const activeMethod = computed(() => {
  if (settings.method === 'biometrics') {
    return showBiometricPrompt.value ? 'biometrics' : settings.biometricsFallback
  }
  return settings.method
})

const unlockLabel = computed(() => {
  if (settings.method === 'biometrics' && showBiometricPrompt.value) return 'Authenticate to continue'
  if (activeMethod.value === 'pin') return 'Enter your PIN to unlock'
  return 'Enter your password to unlock'
})

const fallbackLabel = computed(() => {
  return settings.biometricsFallback === 'pin' ? 'PIN' : 'password'
})

const enterDigit = (digit) => {
  if (enteredPin.value.length >= pinLength) return
  enteredPin.value += String(digit)
  error.value = ''

  if (enteredPin.value.length === pinLength) {
    const success = unlock(enteredPin.value)
    if (!success) {
      error.value = 'Incorrect PIN'
      shake.value = true
      setTimeout(() => {
        enteredPin.value = ''
        shake.value = false
      }, 400)
    }
  }
}

const deleteDigit = () => {
  enteredPin.value = enteredPin.value.slice(0, -1)
  error.value = ''
}

const submitPassword = () => {
  if (!enteredPassword.value) return
  const success = unlock(enteredPassword.value)
  if (!success) {
    error.value = 'Incorrect password'
  } else {
    enteredPassword.value = ''
  }
}

const attemptBiometrics = async () => {
  error.value = ''
  const success = await unlockWithBiometrics()
  if (!success) {
    error.value = 'Biometric authentication failed'
    showBiometricPrompt.value = false
  }
}

// Auto-trigger biometrics when lock screen appears & focus for keyboard input
watch(
  () => props.show,
  async (visible) => {
    if (!visible) {
      enteredPin.value = ''
      enteredPassword.value = ''
      error.value = ''
      shake.value = false
      return
    }
    if (hasBiometrics.value) {
      showBiometricPrompt.value = true
      await nextTick()
      attemptBiometrics()
    } else {
      showBiometricPrompt.value = false
      if (activeMethod.value === 'password') {
        await nextTick()
        passwordInputRef.value?.$el?.querySelector('input')?.focus()
      }
    }
  },
  { immediate: true },
)

// biometricsEnrolled may resolve after the lock screen is already visible,
// so watch it separately to auto-trigger when it becomes available.
watch(hasBiometrics, async (available) => {
  if (available && props.show && !showBiometricPrompt.value) {
    showBiometricPrompt.value = true
    await nextTick()
    attemptBiometrics()
  }
})
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
