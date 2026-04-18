<template>
  <UiModal :show="isOpen" max-width="md" @close="$emit('close')" padding="p-2 sm:p-4" panel-class="max-h-[85vh]">

            <!-- Header -->
            <div class="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div class="flex items-center gap-2 min-w-0">
                <UiButton v-if="activeSection !== 'main'" variant="ghost" color="primary" size="sm" @click="goBack"
                  class="flex-shrink-0 -ml-2">
                  <Icon name="mdi:arrow-left" class="block w-4 h-4" />
                  <span class="hidden sm:inline">Back</span>
                </UiButton>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none truncate">
                  {{ activeSection === 'main' ? 'Profile' : sectionTitle }}
                </h2>
              </div>
              <UiButton variant="ghost" color="gray" icon-only @click="$emit('close')"
                class="flex-shrink-0">
                <Icon name="mdi:close" class="block w-5 h-5" />
              </UiButton>
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
                    <UiButton variant="ghost" @click="activeSection = 'avatar'" class="relative group flex-shrink-0" title="Change avatar">
                      <UiAvatar :src="user?.avatarUrl" size="xl" ring />
                      <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="mdi:camera" class="w-4 h-4 text-white" />
                      </div>
                    </UiButton>
                    <div class="flex-1 min-w-0">
                      <UiButton variant="ghost" @click="activeSection = 'edit'" class="flex items-center gap-1.5 group rounded px-1 -mx-1 hover:bg-primary-200/40 dark:hover:bg-primary-800/30" title="Edit profile">
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ user?.name || 'No name set' }}</p>
                        <Icon name="mdi:pencil-outline" class="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </UiButton>
                      <UiButton variant="ghost" @click="activeSection = 'edit'" class="flex items-center gap-1.5 group rounded px-1 -mx-1 hover:bg-primary-200/40 dark:hover:bg-primary-800/30 mt-0.5" title="Edit profile">
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
                        <Icon name="mdi:pencil-outline" class="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </UiButton>
                      <p class="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                        Member since {{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Quick stats -->
                <div class="grid grid-cols-3 gap-2">
                  <UiButton variant="ghost" color="gray" @click="$emit('show-notes')" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700">
                    <Icon name="mdi:note-multiple-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-none">{{ user?.stats?.notesCount ?? '—' }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Notes</p>
                  </UiButton>
                  <UiButton variant="ghost" color="gray" @click="openSharedSection" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700">
                    <Icon name="mdi:share-variant-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-none">{{ user?.stats?.sharedCount ?? '—' }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Shared</p>
                  </UiButton>
                  <UiButton variant="ghost" color="gray" @click="$emit('sync-now')" class="group flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-300 dark:hover:border-primary-700">
                    <Icon name="mdi:cloud-sync-outline" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-200 leading-snug break-words capitalize">{{ lastSyncedAt ? formatDate(lastSyncedAt) : '—' }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Synced</p>
                  </UiButton>
                </div>

                <!-- Account section -->
                <!-- Account section -->
                <UiButtonsList label="Account">
                  <UiButtonsListItem icon="mdi:account-edit-outline" @click="activeSection = 'edit'">Edit Profile</UiButtonsListItem>
                  <UiButtonsListItem icon="mdi:lock-outline" @click="activeSection = 'password'">Change Password</UiButtonsListItem>
                </UiButtonsList>

                <!-- Security & Privacy section -->
                <UiButtonsList label="Security & Privacy">
                  <UiButtonsListItem icon="mdi:shield-lock-outline" @click="activeSection = 'security'">Security</UiButtonsListItem>
                  <UiButtonsListItem icon="mdi:devices" @click="openSessionsSection">Active Sessions</UiButtonsListItem>
                    <!-- Privacy toggle inline -->
                    <UiButtonsListItem icon="mdi:shield-account-outline" :chevron="false"
                      :disabled="savingPrivacy" @click="togglePrivacy">
                      <div class="flex-1 min-w-0">
                        <span>Privacy protection</span>
                        <p class="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                          {{ privacyNoTracking ? 'Identity hidden on shared notes' : 'Sharers can see your name & device' }}
                        </p>
                      </div>
                      <template #suffix>
                        <UiToggle :model-value="privacyNoTracking" :disabled="savingPrivacy" size="sm" readonly />
                      </template>
                    </UiButtonsListItem>
                </UiButtonsList>

                <!-- Danger zone -->
                <UiButtonsList label="Danger Zone" danger>
                  <UiButtonsListItem icon="mdi:alert-outline" danger @click="activeSection = 'danger'">Delete Data or Account</UiButtonsListItem>
                </UiButtonsList>

                <!-- Sign out -->
                <div class="flex justify-center pt-1 pb-1">
                  <UiButton variant="ghost" color="red" @click="$emit('logout'); $emit('close')">
                    <Icon name="mdi:logout-variant" class="w-4 h-4" />
                    Sign out
                  </UiButton>
                </div>
              </div>

              <!-- ═══ Avatar Editor ═══ -->
              <div v-else-if="activeSection === 'avatar'" class="space-y-4">
                <div v-if="!avatarImageSrc" class="text-center space-y-3">
                  <div class="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Icon name="mdi:image-plus" class="w-10 h-10 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Choose an image for your avatar</p>
                  <UiFileInput accept="image/*" @select="onFileSelect"
                    class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg">
                    <Icon name="mdi:upload" class="w-4 h-4" />
                    Upload Image
                  </UiFileInput>
                  <UiButton v-if="user?.avatarUrl" variant="ghost" color="red" size="xs" @click="removeAvatar"
                    class="block mx-auto mt-2">
                    Remove current avatar
                  </UiButton>
                </div>

                <div v-else class="space-y-3">
                  <AvatarEditor :image-source="avatarImageSrc" :canvas-size="editorCanvasSize" @update="onAvatarCropped" />
                  <div class="flex gap-2">
                    <UiButton variant="solid" color="gray" @click="avatarImageSrc = null"
                      class="flex-1">
                      Choose Different
                    </UiButton>
                    <UiButton variant="solid" color="primary" :loading="saving" @click="saveAvatar"
                      class="flex-1">
                      Save Avatar
                    </UiButton>
                  </div>
                </div>
              </div>

              <!-- ═══ Edit Profile ═══ -->
              <div v-else-if="activeSection === 'edit'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
                  <UiInput v-model="editName" type="text" placeholder="Your name" :validate="false" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email</label>
                  <UiInput v-model="editEmail" type="email" placeholder="you@example.com" />
                </div>
                <UiButton variant="solid" color="primary" block :loading="saving" @click="saveProfile">
                  Save Changes
                </UiButton>
              </div>

              <!-- ═══ Change Password ═══ -->
              <div v-else-if="activeSection === 'password'" class="space-y-4">
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  Changing your password will re-encrypt all your notes. This may take a moment.
                </p>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Current Password</label>
                  <UiInput v-model="currentPassword" type="password" :validate="false" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">New Password</label>
                  <UiInput v-model="newPassword" type="password" :minlength="8" :validate="false" />
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">At least 8 characters</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm New Password</label>
                  <UiInput v-model="confirmNewPassword" type="password" :validate="false" />
                  <p v-if="confirmNewPassword && newPassword !== confirmNewPassword" class="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match</p>
                </div>

                <UiProgressBar v-if="reEncryptProgress" label="Re-encrypting notes…" show-value
                  :current="reEncryptProgress.current" :total="reEncryptProgress.total" />

                <UiButton variant="solid" color="primary" block :loading="saving" :disabled="!currentPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 8" @click="savePassword">
                  Update Password
                </UiButton>
              </div>

              <!-- ═══ Security ═══ -->
              <div v-else-if="activeSection === 'security'" class="space-y-4">
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  Manage security settings for your account.
                </p>

                <!-- Password recovery toggle -->
                <div class="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2">
                  <UiButton variant="ghost" block :disabled="savingSecurity"
                    class="px-0 py-0 justify-between"
                    @click="togglePasswordRecovery">
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon name="mdi:email-lock-outline" class="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span class="text-sm text-gray-700 dark:text-gray-300 truncate">Password recovery by email</span>
                    </div>
                    <UiToggle :model-value="passwordRecoveryEnabled" :disabled="savingSecurity" size="sm" readonly />
                  </UiButton>
                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    {{ passwordRecoveryEnabled ? 'You can recover your account via email if you forget your password.' : 'Password recovery is disabled. If you forget your password, your account and notes cannot be recovered.' }}
                  </p>
                </div>

                <!-- Session duration selector -->
                <div class="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon name="mdi:timer-outline" class="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span class="text-sm text-gray-700 dark:text-gray-300 truncate">Session duration</span>
                    </div>
                    <UiSelect
                      :model-value="sessionDuration"
                      @update:model-value="sessionDuration = $event; saveSessionDuration()"
                      :disabled="savingSessionDuration"
                      :block="false" size="sm"
                      aria-label="Session duration"
                      :options="[
                        { value: 3600, label: '1 hour' },
                        { value: 86400, label: '1 day' },
                        { value: 604800, label: '7 days' },
                        { value: 2592000, label: '30 days' },
                      ]" />
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    How long you stay logged in. Shorter sessions are more secure. Changes apply on next login.
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
                  <UiInput v-model="dangerPassword" type="password" :validate="false" />
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
                      <UiButton variant="outline" color="gray" @click="confirmingAction = null"
                        class="flex-1">
                        Cancel
                      </UiButton>
                      <UiButton variant="solid" :color="confirmingAction === 'data' ? 'amber' : 'red'" :loading="saving" @click="executeConfirmedAction"
                        class="flex-1">
                        {{ confirmingAction === 'data' ? 'Delete All Data' : 'Delete Account' }}
                      </UiButton>
                    </div>
                </div>

                <div v-if="!confirmingAction" class="space-y-2">
                  <UiButton variant="solid" color="amber" block :loading="saving" :disabled="!dangerPassword" @click="confirmingAction = 'data'">
                    <Icon v-if="!saving" name="mdi:database-remove-outline" class="w-4 h-4" />
                    Delete All Data
                  </UiButton>
                  <p class="text-xs text-gray-500 dark:text-gray-500">Resets your account as if newly created. All notes, shared notes, and related data are permanently deleted with no possibility of recovery.</p>
                  <UiButton variant="solid" color="red" block :loading="saving" :disabled="!dangerPassword" @click="confirmingAction = 'account'">
                    <Icon v-if="!saving" name="mdi:account-remove-outline" class="w-4 h-4" />
                    Delete Account
                  </UiButton>
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
                  <UiButton v-if="sessions.length > 1" variant="ghost" color="red" block :loading="savingSessions" @click="closeOtherSessions">
                    <Icon v-if="!savingSessions" name="mdi:logout-variant" class="w-4 h-4" />
                    Close all other sessions
                  </UiButton>

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
                            Last active {{ formatSessionDate(s.lastUsedAt) }} · Opened {{ formatSessionDate(s.createdAt) }}
                          </p>
                          <p v-if="s.expiresAt" class="text-xs text-gray-400 dark:text-gray-600">
                            Expires {{ formatSessionDate(s.expiresAt) }}
                          </p>
                        </div>
                      </div>
                      <UiButton v-if="!s.isCurrent" variant="ghost" color="red" size="xs" icon-only :disabled="savingSessions" @click="closeSession(s.id)"
                        class="flex-shrink-0"
                        title="Close session">
                        <Icon name="mdi:close" class="w-4 h-4" />
                      </UiButton>
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
                      <UiButton v-if="sn.collectAnalytics" variant="ghost" color="primary" size="xs" icon-only @click="openAnalytics(sn.hash)"
                        title="View analytics">
                        <Icon name="mdi:chart-bar" class="w-4 h-4" />
                      </UiButton>
                      <UiButton variant="ghost" color="primary" size="xs" icon-only @click="copySharedLink(sn.hash)"
                        title="Copy link">
                        <Icon :name="copiedHash === sn.hash ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
                      </UiButton>
                      <UiButton variant="ghost" color="red" size="xs" icon-only :disabled="!sn.isActive" @click="handleUnshare(sn.hash)"
                        :class="!sn.isActive ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : ''"
                        :title="sn.isActive ? 'Stop sharing' : 'Already unshared'">
                        <Icon name="mdi:link-variant-off" class="w-4 h-4" />
                      </UiButton>
                      <UiButton variant="ghost" color="red" size="xs" icon-only @click="handlePurge(sn.hash)"
                        title="Delete permanently">
                        <Icon name="mdi:delete-outline" class="w-4 h-4" />
                      </UiButton>
                    </div>
                  </div>
                </template>
                <div v-else class="text-center py-8">
                  <Icon name="mdi:share-variant-outline" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p class="text-sm text-gray-500 dark:text-gray-500">No shared notes</p>
                </div>
              </div>
            </div>
  </UiModal>
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

// Danger zone
const dangerPassword = ref('')
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
const sessionDuration = ref(604800)
const savingSessionDuration = ref(false)

// Sessions
const sessions = ref([])
const loadingSessions = ref(false)
const savingSessions = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) {
    privacyNoTracking.value = props.user?.privacyNoTracking !== false
    passwordRecoveryEnabled.value = props.user?.passwordRecoveryEnabled === true
    sessionDuration.value = props.user?.sessionDuration || 604800
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
const onFileSelect = (file) => {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { avatarImageSrc.value = reader.result }
  reader.readAsDataURL(file)
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

const saveSessionDuration = async () => {
  savingSessionDuration.value = true
  try {
    await apiFetch('/api/auth/session-duration', {
      method: 'PUT',
      headers: props.authHeaders,
      body: { duration: Number(sessionDuration.value) }
    })
    showFeedback('Session duration updated — takes effect on next login')
  } catch (err) {
    showFeedback(err?.data?.statusMessage || 'Failed to update session duration', 'error')
  } finally {
    savingSessionDuration.value = false
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

  // Future date (for expires_at)
  if (diff < 0) {
    const ahead = -diff
    if (ahead < 3600000) return `in ${Math.ceil(ahead / 60000)}m`
    if (ahead < 86400000) return `in ${Math.floor(ahead / 3600000)}h`
    if (ahead < 7 * 86400000) return `in ${Math.floor(ahead / 86400000)}d`
    return d.toLocaleDateString()
  }

  // Past date
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


