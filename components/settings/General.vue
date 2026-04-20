<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="p-5 md:p-8">
    <div class="max-w-2xl mx-auto">
      <SettingsSectionHeader icon="mdi:tune-variant" title="General" description="Miscellaneous application settings" />
      <UiListMenu label="Setup" preset="settings">
        <UiListMenuItem icon="mdi:wizard-hat" hint="Show the first-time setup wizard again" clickable @click="emit('relaunch-wizard')">Relaunch Welcome Wizard</UiListMenuItem>
      </UiListMenu>
      <UiListMenu label="Deletion" preset="settings" class="mt-5">
        <UiListMenuItem icon="mdi:delete-outline" hint="Move deleted notes to bin instead of permanently deleting them" :toggle="preferences.binEnabled !== false" @update:toggle="preferences.binEnabled = $event; onSettingChange()">
          Bin (Trash)
          <template #suffix><UiToggle :model-value="preferences.binEnabled !== false" readonly /></template>
        </UiListMenuItem>
      </UiListMenu>
      <UiListMenu label="Updates" preset="settings" class="mt-5">
        <UiListMenuItem icon="mdi:update" hint="How often to check for new versions" :select-ref="selectUpdateInterval">
          Check Interval
          <template #suffix>
            <UiSelect ref="selectUpdateInterval" :model-value="preferences.updateCheckInterval" :options="updateIntervalOptions" @update:model-value="preferences.updateCheckInterval = $event; onSettingChange()" />
          </template>
        </UiListMenuItem>
      </UiListMenu>
      <UiListMenu v-if="isElectron" label="Window Controls" preset="settings" class="mt-5">
        <UiListMenuItem icon="mdi:swap-horizontal" hint="Place window controls on the left or right side" :select-ref="selectWindowPosition">
          Position
          <template #suffix>
            <UiSelect ref="selectWindowPosition" :model-value="preferences.windowControlPosition || 'left'" :options="windowPositionOptions" @update:model-value="preferences.windowControlPosition = $event; onSettingChange()" />
          </template>
        </UiListMenuItem>
        <UiListMenuItem icon="mdi:close-circle" hint="Show the close button in the title bar" :toggle="preferences.windowControlClose !== false" @update:toggle="preferences.windowControlClose = $event; onSettingChange()">
          Close Button
          <template #suffix><UiToggle :model-value="preferences.windowControlClose !== false" readonly /></template>
        </UiListMenuItem>
        <UiListMenuItem icon="mdi:minus-circle" hint="Show the minimize button in the title bar" :toggle="preferences.windowControlMinimize !== false" @update:toggle="preferences.windowControlMinimize = $event; onSettingChange()">
          Minimize Button
          <template #suffix><UiToggle :model-value="preferences.windowControlMinimize !== false" readonly /></template>
        </UiListMenuItem>
        <UiListMenuItem icon="mdi:arrow-expand" hint="Show the maximize button in the title bar" :toggle="preferences.windowControlMaximize !== false" @update:toggle="preferences.windowControlMaximize = $event; onSettingChange()">
          Maximize Button
          <template #suffix><UiToggle :model-value="preferences.windowControlMaximize !== false" readonly /></template>
        </UiListMenuItem>
      </UiListMenu>
    </div>
  </div>
</template>

<script setup>
const { isElectron } = usePlatform()

defineProps({
  preferences: { type: Object, required: true },
  onSettingChange: { type: Function, required: true },
})

const emit = defineEmits(['relaunch-wizard'])

const selectUpdateInterval = ref(null)
const selectWindowPosition = ref(null)

const updateIntervalOptions = [
  { value: 5, label: 'Every 5 min' },
  { value: 15, label: 'Every 15 min' },
  { value: 30, label: 'Every 30 min' },
  { value: 60, label: 'Every hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 0, label: 'Manual only' },
]

const windowPositionOptions = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]
</script>
