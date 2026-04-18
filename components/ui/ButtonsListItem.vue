<template>
  <!-- List row: icon + label + suffix (chevron or custom) -->
  <UiButton
    variant="list-item"
    :color="danger ? 'red' : 'primary'"
    :disabled="disabled"
    @click="!disabled && $emit('click')"
  >
    <Icon
v-if="icon" :name="icon" class="w-[18px] h-[18px] flex-shrink-0"
      :class="iconClass || (danger ? '' : 'text-gray-400')" />
    <span class="flex-1 text-left truncate">
      <slot />
    </span>
    <slot name="suffix">
      <Icon
v-if="chevron" name="mdi:chevron-right" class="w-4 h-4 flex-shrink-0"
        :class="danger ? 'text-red-300 dark:text-red-800' : 'text-gray-300 dark:text-gray-600'" />
    </slot>
  </UiButton>
</template>

<script setup>
/**
 * UiButtonsListItem — Single row item for use inside UiButtonsList.
 *
 * Renders a full-width UiButton with `variant="list-item"` containing an optional
 * leading icon, a label via the default slot, and a trailing suffix (chevron by default).
 * Supports danger (red) styling for destructive actions and a custom suffix slot.
 *
 * @example Basic list item
 * <UiButtonsListItem icon="mdi:account" @click="goProfile">Profile</UiButtonsListItem>
 *
 * @example Danger item without chevron
 * <UiButtonsListItem icon="mdi:trash-can" danger :chevron="false" @click="del">
 *   Delete Account
 * </UiButtonsListItem>
 *
 * @example Custom suffix slot
 * <UiButtonsListItem icon="mdi:bell">
 *   Notifications
 *   <template #suffix>
 *     <UiBadge color="red">3</UiBadge>
 *   </template>
 * </UiButtonsListItem>
 *
 * @emits {void} click — Emitted when the item is clicked (unless disabled)
 *
 * @slot default — Label text for the list item
 * @slot suffix — Custom trailing content (replaces the default chevron icon)
 *
 * @see UiButtonsList — Parent container for grouping list items
 */
defineProps({
  /**
   * MDI icon name displayed at the start of the row.
   * @type {string}
   * @default ''
   */
  icon: { type: String, default: '' },

  /**
   * Custom CSS class override for the icon element.
   * When empty, defaults to 'text-gray-400' (or inherits danger color).
   * @type {string}
   * @default ''
   */
  iconClass: { type: String, default: '' },

  /**
   * Show a chevron-right icon as the trailing suffix.
   * @type {boolean}
   * @default true
   */
  chevron: { type: Boolean, default: true },

  /**
   * Danger/red styling — applies red color to text, icon, and chevron.
   * @type {boolean}
   * @default false
   */
  danger: { type: Boolean, default: false },

  /**
   * Disabled state — dims the item and prevents click events.
   * @type {boolean}
   * @default false
   */
  disabled: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
