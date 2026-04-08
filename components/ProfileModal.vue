<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50"
        @click.self="$emit('close')">
        <Transition name="modal-panel" appear>
          <div v-if="isOpen"
            class="bg-white dark:bg-gray-925 rounded-lg max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">

            <!-- Header -->
            <div class="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div class="flex items-center gap-2 min-w-0">
                <button v-if="activeSection !== 'main'" @click="goBack"
                  class="flex items-center gap-1 px-2 py-1 -ml-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors flex-shrink-0">
                  <Icon name="mdi:arrow-left" class="block w-4 h-4" />
                  <span class="hidden sm:inline">Back</span>
                </button>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none truncate">
                  {{ activeSection === 'main' ? 'Profile' : sectionTitle }}
                </h2>
              </div>
              <button @click="$emit('close')"
                class="flex-shrink-0 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4">

              <!-- Feedback message -->
              <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition duration-150" leave-to-class="opacity-0">
                <div v-if="feedback" class="mb-3 px-3 py-2 rounded-lg text-xs"
                  :class="feedbackType === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'">
                  {{ feedback }}
                </div>
              </Transition>

              <!-- ═══ Main section ═══ -->
              <div v-if="activeSection === 'main'" class="space-y-5">

                <!-- Profile card -->
                <div class="relative rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-100 dark:border-primary-900/30 px-4 py-5">
                  <div class="flex items-center gap-4">
                    <button @click="activeSection = 'avatar'" class="relative group flex-shrink-0" title="Change avatar">
                      <div class="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-primary-200 dark:ring-primary-800 shadow-sm">
                        <img v-if="user?.avatarUrl" :src="user.avatarUrl" class="w-full h-full object-cover" alt="Avatar" />
                        <Icon v-else name="mdi:account" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="mdi:camera" class="w-4 h-4 text-white" />
                      </div>
                    </button>
                    <div class="flex-1 min-w-0">
                      <button @click="activeSection = 'edit'" class="flex items-center gap-1.5 group rounded px-1 -mx-1 hover:bg-primary-200/40 dark:hover:bg-primary-800/30 transition-colors" title="Edit profile">
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ user?.name || 'No name set' }}</p>
                        <Icon name="mdi:pencil-outline" class="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                      <button @click="activeSection = 'edit'" class="flex items-center gap-1.5 group rounded px-1 -mx-1 hover:bg-primary-200/40 dark:hover:bg-primary-800/30 transition-colors mt-0.5" title="Edit profile">
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
                        <Icon name="mdi:pencil-outline" class="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                      <p class="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                        Member since {{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Quick stats -->
                <div class="grid grid-cols-3 gap-2">
                  <button @click="$emit('show-notes')" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                    <Icon name="mdi:note-multiple-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-none">{{ user?.stats?.notesCount ?? '—' }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Notes</p>
                  </button>
                  <button @click="openSharedSection" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                    <Icon name="mdi:share-variant-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-none">{{ user?.stats?.sharedCount ?? '—' }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Shared</p>
                  </button>
                  <button @click="$emit('sync-now')" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                    <Icon name="mdi:cloud-sync-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-200 leading-snug break-words capitalize">{{ lastSyncedAt ? formatDate(lastSyncedAt) : '—' }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Synced</p>
                  </button>
                </div>

                <!-- Account section -->
                <div>
                  <p class="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider px-1 mb-1.5">Account</p>
                  <div class="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                    <button @click="activeSection = 'edit'"
                      class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors">
                      <Icon name="mdi:account-edit-outline" class="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
                      <span class="flex-1 text-left truncate">Edit Profile</span>
                      <Icon name="mdi:chevron-right" class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </button>
                    <button @click="activeSection = 'password'"
                      class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors">
                      <Icon name="mdi:lock-outline" class="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
                      <span class="flex-1 text-left truncate">Change Password</span>
                      <Icon name="mdi:chevron-right" class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </button>
                  </div>
                </div>

                <!-- Security & Privacy section -->
                <div>
                  <p class="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider px-1 mb-1.5">Security & Privacy</p>
                  <div class="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                    <button @click="activeSection = 'security'"
                      class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors">
                      <Icon name="mdi:shield-lock-outline" class="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
                      <span class="flex-1 text-left truncate">Security</span>
                      <Icon name="mdi:chevron-right" class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </button>
                    <button @click="openSessionsSection"
                      class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors">
                      <Icon name="mdi:devices" class="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
                      <span class="flex-1 text-left truncate">Active Sessions</span>
                      <Icon name="mdi:chevron-right" class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </button>
                    <!-- Privacy toggle inline -->
                    <div class="px-3.5 py-2.5">
                      <div class="flex items-center gap-3">
                        <Icon name="mdi:shield-account-outline" class="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                          <span class="text-sm text-gray-700 dark:text-gray-300">Privacy protection</span>
                          <p class="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                            {{ privacyNoTracking ? 'Identity hidden on shared notes' : 'Sharers can see your name & device' }}
                          </p>
                        </div>
                        <button @click="togglePrivacy" :disabled="savingPrivacy"
                          class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                          :class="privacyNoTracking ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                          role="switch" :aria-checked="privacyNoTracking">
                          <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                            :class="privacyNoTracking ? 'translate-x-4' : 'translate-x-0'" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Danger zone -->
                <div>
                  <p class="text-[10px] font-medium text-red-400 dark:text-red-600 uppercase tracking-wider px-1 mb-1.5">Danger Zone</p>
                  <div class="rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <button @click="activeSection = 'danger'"
                      class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-800/30 transition-colors">
                      <Icon name="mdi:alert-outline" class="w-[18px] h-[18px] flex-shrink-0" />
                      <span class="flex-1 text-left truncate">Delete Data or Account</span>
                      <Icon name="mdi:chevron-right" class="w-4 h-4 text-red-300 dark:text-red-800 flex-shrink-0" />
                    </button>
                  </div>
                </div>

                <!-- Sign out -->
                <div class="flex justify-center pt-1 pb-1">
                  <button @click="$emit('logout'); $emit('close')"
                    class="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Icon name="mdi:logout-variant" class="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>

              <!-- ═══ Avatar Editor ═══ -->
              <div v-else-if="activeSection === 'avatar'" class="space-y-4">
                <div v-if="!avatarImageSrc" class="text-center space-y-3">
                  <div class="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Icon name="mdi:image-plus" class="w-10 h-10 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Choose an image for your avatar</p>
                  <label class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                    <Icon name="mdi:upload" class="w-4 h-4" />
                    Upload Image
                    <input type="file" accept="image/*" class="hidden" @change="onFileSelect" />
                  </label>
                  <button v-if="user?.avatarUrl" @click="removeAvatar"
                    class="block mx-auto text-xs text-red-500 hover:text-red-700 dark:text-red-400 transition-colors mt-2">
                    Remove current avatar
                  </button>
                </div>

                <div v-else class="space-y-3">
                  <AvatarEditor :image-source="avatarImageSrc" :canvas-size="editorCanvasSize" @update="onAvatarCropped" />
                  <div class="flex gap-2">
                    <button @click="avatarImageSrc = null"
                      class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                      Choose Different
                    </button>
                    <button @click="saveAvatar" :disabled="saving"
                      class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                      <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                      Save Avatar
                    </button>
                  </div>
                </div>
              </div>

              <!-- ═══ Edit Profile ═══ -->
              <div v-else-if="activeSection === 'edit'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
                  <input v-model="editName" type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Your name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email</label>
                  <input v-model="editEmail" type="email"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="you@example.com" />
                </div>
                <button @click="saveProfile" :disabled="saving"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                  Save Changes
                </button>
              </div>

              <!-- ═══ Change Password ═══ -->
              <div v-else-if="activeSection === 'password'" class="space-y-4">
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  Changing your password will re-encrypt all your notes. This may take a moment.
                </p>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Current Password</label>
                  <div class="relative">
                    <input v-model="currentPassword" :type="showCurrentPassword ? 'text' : 'password'"
                      class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                    <button type="button" @click="showCurrentPassword = !showCurrentPassword" tabindex="-1"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      :aria-label="showCurrentPassword ? 'Hide password' : 'Show password'">
                      <Icon :name="showCurrentPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">New Password</label>
                  <div class="relative">
                    <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" minlength="8"
                      class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                    <button type="button" @click="showNewPassword = !showNewPassword" tabindex="-1"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      :aria-label="showNewPassword ? 'Hide password' : 'Show password'">
                      <Icon :name="showNewPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-4 h-4" />
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">At least 8 characters</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm New Password</label>
                  <div class="relative">
                    <input v-model="confirmNewPassword" :type="showConfirmNewPassword ? 'text' : 'password'"
                      class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                    <button type="button" @click="showConfirmNewPassword = !showConfirmNewPassword" tabindex="-1"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      :aria-label="showConfirmNewPassword ? 'Hide password' : 'Show password'">
                      <Icon :name="showConfirmNewPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-4 h-4" />
                    </button>
                  </div>
                  <p v-if="confirmNewPassword && newPassword !== confirmNewPassword" class="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match</p>
                </div>

                <!-- Re-encryption progress bar -->
                <div v-if="reEncryptProgress" class="space-y-1">
                  <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>Re-encrypting notes…</span>
                    <span>{{ reEncryptProgress.current }} / {{ reEncryptProgress.total }}</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div class="bg-primary-600 h-2 rounded-full transition-all duration-200"
                      :style="{ width: `${(reEncryptProgress.current / reEncryptProgress.total) * 100}%` }" />
                  </div>
                </div>

                <button @click="savePassword" :disabled="saving || !currentPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 8"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                  Update Password
                </button>
              </div>

              <!-- ═══ Security ═══ -->
              <div v-else-if="activeSection === 'security'" class="space-y-4">
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  Manage security settings for your account.
                </p>

                <!-- Password recovery toggle -->
                <div class="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon name="mdi:email-lock-outline" class="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span class="text-sm text-gray-700 dark:text-gray-300 truncate">Password recovery by email</span>
                    </div>
                    <button @click="togglePasswordRecovery" :disabled="savingSecurity"
                      class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="passwordRecoveryEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                      role="switch" :aria-checked="passwordRecoveryEnabled">
                      <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="passwordRecoveryEnabled ? 'translate-x-4' : 'translate-x-0'" />
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    {{ passwordRecoveryEnabled ? 'You can recover your account via email if you forget your password.' : 'Password recovery is disabled. If you forget your password, your account and notes cannot be recovered.' }}
                  </p>
                </div>

                <!-- Warning about recovery -->
                <div class="space-y-2">
                  <!-- Account access risk -->
                  <div class="px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div class="flex gap-2.5">
                      <Icon name="mdi:shield-alert-outline" class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div class="text-xs space-y-1.5">
                        <p class="font-semibold text-amber-800 dark:text-amber-200">Account access risk</p>
                        <p class="text-amber-700 dark:text-amber-300 leading-relaxed">Anyone with access to your email inbox can trigger a password reset and take over your account. If your email is compromised, your Numori account is too.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Data destruction warning -->
                  <div class="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
                    <div class="flex gap-2.5">
                      <Icon name="mdi:database-remove-outline" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div class="text-xs space-y-1.5">
                        <p class="font-semibold text-red-800 dark:text-red-200">All notes destroyed on recovery</p>
                        <p class="text-red-700 dark:text-red-300 leading-relaxed">Your notes are end-to-end encrypted with your password. A password reset means the encryption key is lost forever — <span class="font-semibold">all notes will be permanently and irreversibly deleted</span>.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Recommendation -->
                  <p class="text-xs text-gray-500 dark:text-gray-500 px-1 leading-relaxed">
                    <Icon name="mdi:information-outline" class="w-3 h-3 inline -mt-0.5 mr-0.5" />
                    For maximum security, keep password recovery disabled and store your password in a password manager.
                  </p>
                </div>
              </div>

              <!-- ═══ Danger Zone ═══ -->
              <div v-else-if="activeSection === 'danger'" class="space-y-4">
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  These actions are irreversible. Your password is required to confirm.
                </p>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm Password</label>
                  <div class="relative">
                    <input v-model="dangerPassword" :type="showDangerPassword ? 'text' : 'password'"
                      class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                    <button type="button" @click="showDangerPassword = !showDangerPassword" tabindex="-1"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      :aria-label="showDangerPassword ? 'Hide password' : 'Show password'">
                      <Icon :name="showDangerPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Confirmation prompt -->
                <div v-if="confirmingAction" class="rounded-lg border p-4 space-y-3"
                    :class="confirmingAction === 'data'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'">
                    <div class="flex gap-2.5">
                      <Icon :name="confirmingAction === 'data' ? 'mdi:database-remove-outline' : 'mdi:account-remove-outline'"
                        class="w-5 h-5 flex-shrink-0 mt-0.5"
                        :class="confirmingAction === 'data' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'" />
                      <div class="text-xs space-y-1.5">
                        <p class="font-semibold" :class="confirmingAction === 'data' ? 'text-amber-800 dark:text-amber-200' : 'text-red-800 dark:text-red-200'">
                          {{ confirmingAction === 'data' ? 'Reset account data?' : 'Delete your account?' }}
                        </p>
                        <p :class="confirmingAction === 'data' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'" class="leading-relaxed">
                          {{ confirmingAction === 'data'
                            ? 'This will permanently delete all your notes, shared notes, and related data. Your account will be reset as if newly created. This cannot be undone.'
                            : 'This will permanently delete your account and all associated data. You will be logged out and will not be able to recover your account.' }}
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button @click="confirmingAction = null"
                        class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button @click="executeConfirmedAction" :disabled="saving"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                        :class="confirmingAction === 'data'
                          ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50'
                          : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'">
                        <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                        {{ confirmingAction === 'data' ? 'Delete All Data' : 'Delete Account' }}
                      </button>
                    </div>
                </div>

                <div v-if="!confirmingAction" class="space-y-2">
                  <button @click="confirmingAction = 'data'" :disabled="saving || !dangerPassword"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                    <Icon v-else name="mdi:database-remove-outline" class="w-4 h-4" />
                    Delete All Data
                  </button>
                  <p class="text-xs text-gray-500 dark:text-gray-500">Resets your account as if newly created. All notes, shared notes, and related data are permanently deleted with no possibility of recovery.</p>
                  <button @click="confirmingAction = 'account'" :disabled="saving || !dangerPassword"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    <Icon v-if="saving" name="mdi:loading" class="w-4 h-4 animate-spin" />
                    <Icon v-else name="mdi:account-remove-outline" class="w-4 h-4" />
                    Delete Account
                  </button>
                  <p class="text-xs text-gray-500 dark:text-gray-500">Permanently deletes your account and all associated data. This cannot be undone.</p>
                </div>
              </div>

              <!-- ═══ Active Sessions ═══ -->
              <div v-else-if="activeSection === 'sessions'" class="space-y-3">
                <div v-if="loadingSessions" class="flex items-center justify-center py-8">
                  <Icon name="mdi:loading" class="w-6 h-6 text-gray-400 animate-spin" />
                </div>
                <template v-else>
                  <!-- Close all other sessions -->
                  <button v-if="sessions.length > 1" @click="closeOtherSessions" :disabled="savingSessions"
                    class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50">
                    <Icon v-if="savingSessions" name="mdi:loading" class="w-4 h-4 animate-spin" />
                    <Icon v-else name="mdi:logout-variant" class="w-4 h-4" />
                    Close all other sessions
                  </button>

                  <div v-for="s in sessions" :key="s.id"
                    class="px-3 py-2.5 rounded-lg border"
                    :class="s.isCurrent
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5">
                          <Icon :name="getDeviceIcon(s.deviceName)" class="w-4 h-4 flex-shrink-0"
                            :class="s.isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'" />
                          <p class="text-sm font-medium truncate"
                            :class="s.isCurrent ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-200'">
                            {{ s.deviceName || 'Unknown device' }}
                          </p>
                          <span v-if="s.isCurrent"
                            class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex-shrink-0">
                            current
                          </span>
                        </div>
                        <div class="mt-1 space-y-0.5">
                          <p v-if="s.location || s.ipAddress" class="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {{ s.location || s.ipAddress }}
                          </p>
                          <p class="text-xs text-gray-400 dark:text-gray-600">
                            Opened {{ formatSessionDate(s.createdAt) }} · Last used {{ formatSessionDate(s.lastUsedAt) }}
                          </p>
                        </div>
                      </div>
                      <button v-if="!s.isCurrent" @click="closeSession(s.id)" :disabled="savingSessions"
                        class="flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        title="Close session">
                        <Icon name="mdi:close" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div v-if="!sessions.length" class="text-center py-8">
                    <Icon name="mdi:devices" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p class="text-sm text-gray-500 dark:text-gray-500">No active sessions</p>
                  </div>
                </template>
              </div>

              <!-- ═══ Shared Notes ═══ -->
              <div v-else-if="activeSection === 'shared'" class="space-y-3">
                <div v-if="loadingShared" class="flex items-center justify-center py-8">
                  <Icon name="mdi:loading" class="w-6 h-6 text-gray-400 animate-spin" />
                </div>
                <template v-else-if="sharedNotes.length">
                  <div v-for="sn in sharedNotes" :key="sn.hash"
                    class="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                    :class="sn.isActive
                      ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                      : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50 opacity-60'">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ sn.title || 'Untitled' }}</p>
                        <span v-if="!sn.isActive" class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                          unshared
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {{ sn.anonymous ? 'Anonymous' : '' }}
                        {{ sn.anonymous && sn.expiresAt ? ' · ' : '' }}
                        {{ formatExpiry(sn.expiresAt) }}
                        {{ sn.collectAnalytics ? ' · Analytics' : '' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-0.5 flex-shrink-0">
                      <button v-if="sn.collectAnalytics" @click="openAnalytics(sn.hash)"
                        class="p-1.5 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                        title="View analytics">
                        <Icon name="mdi:chart-bar" class="w-4 h-4" />
                      </button>
                      <button @click="copySharedLink(sn.hash)"
                        class="p-1.5 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                        title="Copy link">
                        <Icon :name="copiedHash === sn.hash ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
                      </button>
                      <button @click="handleUnshare(sn.hash)" :disabled="!sn.isActive"
                        class="p-1.5 rounded transition-colors"
                        :class="sn.isActive
                          ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'"
                        :title="sn.isActive ? 'Stop sharing' : 'Already unshared'">
                        <Icon name="mdi:link-variant-off" class="w-4 h-4" />
                      </button>
                      <button @click="handlePurge(sn.hash)"
                        class="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete permanently">
                        <Icon name="mdi:delete-outline" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>
                <div v-else class="text-center py-8">
                  <Icon name="mdi:share-variant-outline" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p class="text-sm text-gray-500 dark:text-gray-500">No shared notes</p>
                </div>
              </div>
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
  user: { type: Object, default: null },
  lastSyncedAt: { type: String, default: null },
  authHeaders: { type: Object, default: () => ({}) },
  onDeleteData: { type: Function, default: null },
  onDeleteAccount: { type: Function, default: null }
})

const emit = defineEmits(['close', 'update-profile', 'change-password', 'logout', 'unshare', 'open-analytics', 'sync-now', 'show-notes'])

const activeSection = ref('main')
const feedback = ref(null)
const feedbackType = ref('success')
const saving = ref(false)

// Edit profile fields
const editName = ref('')
const editEmail = ref('')

// Avatar editor
const avatarImageSrc = ref(null)
const croppedAvatarDataUrl = ref(null)
const editorCanvasSize = computed(() => {
  if (typeof window === 'undefined') return 220
  return Math.min(220, window.innerWidth - 80)
})

// Password fields
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const reEncryptProgress = ref(null)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmNewPassword = ref(false)

// Danger zone
const dangerPassword = ref('')
const showDangerPassword = ref(false)
const confirmingAction = ref(null)

// Shared notes
const sharedNotes = ref([])
const loadingShared = ref(false)
const { apiFetch, apiUrl } = useApi()

// Privacy
const privacyNoTracking = ref(true)
const savingPrivacy = ref(false)

// Security
const passwordRecoveryEnabled = ref(false)
const savingSecurity = ref(false)

// Sessions
const sessions = ref([])
const loadingSessions = ref(false)
const savingSessions = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) {
    privacyNoTracking.value = props.user?.privacyNoTracking !== false
    passwordRecoveryEnabled.value = props.user?.passwordRecoveryEnabled === true
    activeSection.value = 'main'
    feedback.value = null
    editName.value = props.user?.name || ''
    editEmail.value = props.user?.email || ''
    avatarImageSrc.value = null
    croppedAvatarDataUrl.value = null
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    dangerPassword.value = ''
    confirmingAction.value = null
  }
})

const sectionTitle = computed(() => {
  const titles = { edit: 'Edit Profile', password: 'Change Password', danger: 'Delete Data or Account', shared: 'Shared Notes', avatar: 'Change Avatar', security: 'Security', sessions: 'Active Sessions' }
  return titles[activeSection.value] || 'Profile'
})

const goBack = () => {
  activeSection.value = 'main'
  feedback.value = null
  confirmingAction.value = null
}

const showFeedback = (msg, type = 'success') => {
  feedback.value = msg
  feedbackType.value = type
  if (type === 'success') setTimeout(() => { feedback.value = null }, 3000)
}

const formatDate = (iso) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

// Avatar
const onFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { avatarImageSrc.value = reader.result }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const onAvatarCropped = (dataUrl) => {
  croppedAvatarDataUrl.value = dataUrl
}

const saveAvatar = async () => {
  if (!croppedAvatarDataUrl.value) return
  saving.value = true
  feedback.value = null
  try {
    await emit('update-profile', { avatarUrl: croppedAvatarDataUrl.value })
    showFeedback('Avatar updated')
    avatarImageSrc.value = null
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update avatar', 'error')
  } finally {
    saving.value = false
  }
}

const removeAvatar = async () => {
  saving.value = true
  try {
    await emit('update-profile', { avatarUrl: '' })
    showFeedback('Avatar removed')
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to remove avatar', 'error')
  } finally {
    saving.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  feedback.value = null
  try {
    await emit('update-profile', { name: editName.value, email: editEmail.value })
    showFeedback('Profile updated')
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update profile', 'error')
  } finally {
    saving.value = false
  }
}

const savePassword = async () => {
  saving.value = true
  feedback.value = null
  reEncryptProgress.value = null
  try {
    await emit('change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      onProgress: (current, total) => {
        reEncryptProgress.value = { current, total }
      }
    })
    showFeedback('Password updated. Please log in again.')
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to change password', 'error')
  } finally {
    saving.value = false
    reEncryptProgress.value = null
  }
}

const handleDeleteData = async () => {
  saving.value = true
  feedback.value = null
  try {
    await props.onDeleteData(dangerPassword.value)
    showFeedback('All data deleted — account reset')
    dangerPassword.value = ''
    confirmingAction.value = null
    activeSection.value = 'main'
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to delete data', 'error')
  } finally {
    saving.value = false
  }
}

const handleDeleteAccount = async () => {
  saving.value = true
  feedback.value = null
  try {
    await props.onDeleteAccount(dangerPassword.value)
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to delete account', 'error')
    saving.value = false
  }
}

const executeConfirmedAction = () => {
  if (confirmingAction.value === 'data') handleDeleteData()
  else if (confirmingAction.value === 'account') handleDeleteAccount()
}

const loadSharedNotes = async () => {
  loadingShared.value = true
  try {
    if (!props.authHeaders?.Authorization) return
    const notes = await apiFetch('/api/share/my', {
      headers: props.authHeaders
    })

    // Resolve encrypted titles from local notes using sourceClientId
    const { default: db } = await import('~/db.js')
    const localNotes = await db.notes.toArray()
    const localMap = new Map(localNotes.map(n => [n.id, n]))

    sharedNotes.value = notes.map(sn => {
      const local = sn.sourceClientId ? localMap.get(sn.sourceClientId) : null
      const isEncryptedTitle = sn.title && sn.title.startsWith('{') && sn.title.includes('"iv"')
      return {
        ...sn,
        title: isEncryptedTitle && local ? (local.title || 'Untitled') : sn.title
      }
    })
  } catch {
    sharedNotes.value = []
  } finally {
    loadingShared.value = false
  }
}

const { copy: clipboardCopy } = useClipboard()
const copiedHash = ref(null)

const copySharedLink = async (hash) => {
  const url = apiUrl(`/shared/${hash}`)
  await clipboardCopy(url)
  copiedHash.value = hash
  setTimeout(() => { copiedHash.value = null }, 2000)
}

const handleUnshare = async (hash) => {
  try {
    await apiFetch(`/api/share/${hash}`, {
      method: 'DELETE',
      headers: props.authHeaders
    })
    await loadSharedNotes()
    showFeedback('Sharing stopped')
    emit('unshare', hash)
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to remove shared note', 'error')
  }
}

const handlePurge = async (hash) => {
  if (!confirm('Permanently delete this shared note and all its analytics? This cannot be undone.')) return
  try {
    await apiFetch(`/api/share/${hash}?purge=true`, {
      method: 'DELETE',
      headers: props.authHeaders
    })
    await loadSharedNotes()
    showFeedback('Shared note deleted')
    emit('unshare', hash)
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to delete shared note', 'error')
  }
}

const openSharedSection = () => {
  activeSection.value = 'shared'
  loadSharedNotes()
}

const openAnalytics = (hash) => {
  emit('close')
  nextTick(() => {
    emit('open-analytics', hash)
  })
}

const togglePrivacy = async () => {
  savingPrivacy.value = true
  const newVal = !privacyNoTracking.value
  try {
    await apiFetch('/api/auth/privacy', {
      method: 'PUT',
      headers: props.authHeaders,
      body: { noTracking: newVal }
    })
    privacyNoTracking.value = newVal
    showFeedback(newVal ? 'Privacy protection enabled' : 'Privacy protection disabled')
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update privacy setting', 'error')
  } finally {
    savingPrivacy.value = false
  }
}

const togglePasswordRecovery = async () => {
  const newVal = !passwordRecoveryEnabled.value
  if (newVal && !confirm('Enabling password recovery makes your account recoverable via email, but also means anyone with access to your email could reset your password and delete your notes. Continue?')) {
    return
  }
  savingSecurity.value = true
  try {
    await apiFetch('/api/auth/security', {
      method: 'PUT',
      headers: props.authHeaders,
      body: { passwordRecoveryEnabled: newVal }
    })
    passwordRecoveryEnabled.value = newVal
    showFeedback(newVal ? 'Password recovery enabled' : 'Password recovery disabled')
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update security setting', 'error')
  } finally {
    savingSecurity.value = false
  }
}

const getDeviceIcon = (deviceName) => {
  if (!deviceName) return 'mdi:help-circle-outline'
  const d = deviceName.toLowerCase()
  if (d.includes('android')) return 'mdi:android'
  if (d.includes('ios') || d.includes('iphone') || d.includes('ipad')) return 'mdi:apple'
  if (d.includes('mobile') || d.includes('app')) return 'mdi:cellphone'
  if (d.includes('windows')) return 'mdi:microsoft-windows'
  if (d.includes('mac')) return 'mdi:apple'
  if (d.includes('linux')) return 'mdi:linux'
  return 'mdi:monitor'
}

const formatSessionDate = (iso) => {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString()
}

const loadSessions = async () => {
  loadingSessions.value = true
  try {
    if (!props.authHeaders?.Authorization) return
    sessions.value = await apiFetch('/api/auth/sessions', {
      headers: props.authHeaders
    })
  } catch {
    sessions.value = []
  } finally {
    loadingSessions.value = false
  }
}

const openSessionsSection = () => {
  activeSection.value = 'sessions'
  loadSessions()
}

const closeSession = async (sessionId) => {
  savingSessions.value = true
  try {
    await apiFetch(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: props.authHeaders
    })
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    showFeedback('Session closed')
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to close session', 'error')
  } finally {
    savingSessions.value = false
  }
}

const closeOtherSessions = async () => {
  savingSessions.value = true
  try {
    await apiFetch('/api/auth/sessions', {
      method: 'DELETE',
      headers: props.authHeaders
    })
    sessions.value = sessions.value.filter(s => s.isCurrent)
    showFeedback('All other sessions closed')
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to close sessions', 'error')
  } finally {
    savingSessions.value = false
  }
}

const formatExpiry = (iso) => {
  if (!iso) return 'No expiry'
  const d = new Date(iso)
  const now = new Date()
  if (d < now) return 'Expired'
  const diff = d - now
  const days = Math.ceil(diff / 86400000)
  return days === 1 ? '1 day left' : `${days} days left`
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
