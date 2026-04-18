<template>
  <UiModal :show="isOpen" max-width="sm" @close="$emit('close')">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
          {{ editingGroupId ? 'Edit Group' : 'New Group' }}
        </h2>
        <UiButton variant="ghost" color="gray" icon-only size="sm" @click="$emit('close')">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <div class="space-y-4">
        <UiFormField label="Name">
          <UiInput
ref="nameInput" v-model="localName" type="text" placeholder="Group name" :validate="false"
            @keydown.enter="save" />
        </UiFormField>
        <UiFormField label="Internal Name" hint="Auto-generated from name. Edit to customise.">
          <UiInput
v-model="localInternalName" type="text" placeholder="group_name" :validate="false"
            @update:model-value="internalNameManuallyEdited = true" />
        </UiFormField>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <UiButton variant="ghost" color="gray" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton :disabled="!localName.trim()" @click="save">
          {{ editingGroupId ? 'Save' : 'Create' }}
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
import { normaliseName, uniqueInternalName } from '~/utils/normaliseName.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  editingGroupId: { type: String, default: null },
  initialName: { type: String, default: '' },
  initialInternalName: { type: String, default: '' },
  allGroups: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const localName = ref('')
const localInternalName = ref('')
const internalNameManuallyEdited = ref(false)
const nameInput = ref(null)

watch(localName, (val) => {
  internalNameManuallyEdited.value = false
  localInternalName.value = uniqueInternalName(val, [], 'new_group', props.editingGroupId, props.allGroups)
})

watch(() => props.isOpen, (open) => {
  if (open) {
    localName.value = props.initialName
    localInternalName.value = props.initialInternalName || uniqueInternalName(props.initialName, [], 'new_group', props.editingGroupId, props.allGroups)
    internalNameManuallyEdited.value = false
    nextTick(() => nameInput.value?.focus())
  }
})

const save = () => {
  if (!localName.value.trim()) return
  const rawName = internalNameManuallyEdited.value
    ? normaliseName(localInternalName.value)
    : normaliseName(localName.value)
  const finalInternalName = uniqueInternalName(rawName, [], 'new_group', props.editingGroupId, props.allGroups)
  emit('save', {
    id: props.editingGroupId,
    name: localName.value.trim(),
    internalName: finalInternalName,
  })
  emit('close')
}
</script>
