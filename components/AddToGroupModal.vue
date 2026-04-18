<template>
  <UiModal :show="isOpen" max-width="sm" @close="$emit('close')">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-400 leading-none">
          Add to Group
        </h2>
        <UiButton variant="ghost" color="gray" icon-only size="sm" @click="$emit('close')">
          <Icon name="mdi:close" class="block w-5 h-5" />
        </UiButton>
      </div>

      <div class="space-y-1 max-h-60 overflow-y-auto">
        <!-- Create new group option -->
        <UiButton variant="ghost" color="primary" block @click="$emit('create-new')">
          <Icon name="mdi:folder-plus-outline" class="w-4.5 h-4.5 flex-shrink-0" />
          Create new group
        </UiButton>

        <div v-if="groups.length">
          <UiDivider color="medium" class="my-2" />
        </div>

        <!-- Existing groups -->
        <UiButton
          v-for="group in groups"
          :key="group.id"
          variant="ghost"
          block
          :class="
            currentGroupId === group.id
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          "
          @click="$emit('select', group.id)"
        >
          <Icon
            name="mdi:folder-outline"
            class="w-4.5 h-4.5 flex-shrink-0"
            :class="currentGroupId === group.id ? 'text-primary-500' : 'text-gray-400'"
          />
          <span class="truncate">{{ group.name }}</span>
          <Icon
            v-if="currentGroupId === group.id"
            name="mdi:check"
            class="w-4 h-4 ml-auto text-primary-500 flex-shrink-0"
          />
        </UiButton>

        <!-- Remove from group option -->
        <template v-if="currentGroupId">
          <UiDivider color="medium" class="my-2" />
          <UiButton variant="ghost" color="gray" block @click="$emit('select', null)">
            <Icon name="mdi:folder-remove-outline" class="w-4.5 h-4.5 flex-shrink-0" />
            Remove from group
          </UiButton>
        </template>
      </div>

      <div class="flex justify-end mt-4">
        <UiButton variant="ghost" color="gray" @click="$emit('close')"> Cancel </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
  currentGroupId: { type: String, default: null },
})

defineEmits(['close', 'select', 'create-new'])
</script>
