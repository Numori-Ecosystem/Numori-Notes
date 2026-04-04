<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen" class="bg-white dark:bg-gray-925 rounded-lg max-w-sm w-full p-5">

            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
                {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
              </h2>
              <button @click="$emit('close')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Signing up is optional. It enables cloud sync across devices.
            </p>

            <!-- Error -->
            <div v-if="error" class="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-3">
              <!-- Name (register only) -->
              <div v-if="mode === 'register'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
                <input v-model="name" type="text" autocomplete="name"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  placeholder="Your name (optional)" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email</label>
                <input v-model="email" type="email" required autocomplete="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  placeholder="you@example.com" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Password</label>
                <div class="relative">
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" required autocomplete="current-password"
                    :minlength="mode === 'register' ? 8 : undefined"
                    class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="••••••••" />
                  <button type="button" @click="showPassword = !showPassword" tabindex="-1"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'">
                    <Icon :name="showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="mode === 'register'" class="text-xs text-gray-500 dark:text-gray-500 mt-1">At least 8 characters</p>
              </div>

              <!-- Confirm password (register only) -->
              <div v-if="mode === 'register'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm Password</label>
                <div class="relative">
                  <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" required autocomplete="new-password" minlength="8"
                    class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="••••••••" />
                  <button type="button" @click="showConfirmPassword = !showConfirmPassword" tabindex="-1"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'">
                    <Icon :name="showConfirmPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="passwordMismatch" class="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match</p>
              </div>

              <button type="submit" :disabled="loading"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Icon v-if="loading" name="mdi:loading" class="w-4 h-4 animate-spin" />
                {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
              </button>
            </form>

            <!-- Toggle mode -->
            <p class="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
              <template v-if="mode === 'login'">
                Don't have an account?
                <button @click="switchMode('register')" class="text-primary-600 dark:text-primary-400 hover:underline">Sign up</button>
              </template>
              <template v-else>
                Already have an account?
                <button @click="switchMode('login')" class="text-primary-600 dark:text-primary-400 hover:underline">Sign in</button>
              </template>
            </p>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

const emit = defineEmits(['close', 'login', 'register'])

const mode = ref('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordMismatch = computed(() => {
  return mode.value === 'register' && confirmPassword.value && password.value !== confirmPassword.value
})

const switchMode = (m) => {
  mode.value = m
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  name.value = ''
}

watch(() => props.isOpen, (open) => {
  if (open) {
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    name.value = ''
  }
})

const handleSubmit = () => {
  if (mode.value === 'register' && password.value !== confirmPassword.value) return
  if (mode.value === 'login') {
    emit('login', { email: email.value, password: password.value })
  } else {
    emit('register', { email: email.value, password: password.value, name: name.value })
  }
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
