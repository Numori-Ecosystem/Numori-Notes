<template>
  <Button variant="menu-item" :color="color" :disabled="disabled" @click="!disabled && $emit('click')">
    <Icon :name="icon" class="w-4 h-4 block flex-shrink-0" />
    <span class="flex-1 text-left">{{ label }}</span>
    <span v-if="shortcut" class="text-xs text-gray-400 dark:text-gray-500">{{ shortcut }}</span>
  </Button>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  shortcut: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  /** Colour: 'gray' (default) or 'red' for destructive items */
  color: { type: String, default: 'gray' },
})

defineEmits(['click'])
</script>
