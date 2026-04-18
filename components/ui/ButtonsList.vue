<template>
  <div>
    <!-- Optional section label above the list -->
    <p
v-if="label" class="text-[10px] font-medium uppercase tracking-wider px-1 mb-1.5"
      :class="danger ? 'text-red-400 dark:text-red-600' : 'text-gray-400 dark:text-gray-600'">
      {{ label }}
    </p>
    <div
class="overflow-hidden divide-y"
      :class="[
        shapeClass,
        danger
          ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 divide-red-100 dark:divide-red-900/30'
          : 'bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 divide-gray-100 dark:divide-gray-800'
      ]">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * UiButtonsList — Grouped list container for UiButtonsListItem rows.
 *
 * Renders a bordered, rounded container with dividers between child items.
 * Supports an optional uppercase section label and a danger (red) color scheme
 * for destructive action groups. Designed to be used in settings panels and
 * profile pages.
 *
 * @example Basic settings list
 * <UiButtonsList label="Account">
 *   <UiButtonsListItem icon="mdi:account">Profile</UiButtonsListItem>
 *   <UiButtonsListItem icon="mdi:lock">Security</UiButtonsListItem>
 * </UiButtonsList>
 *
 * @example Danger zone
 * <UiButtonsList label="Danger Zone" danger>
 *   <UiButtonsListItem icon="mdi:trash-can" danger>Delete Account</UiButtonsListItem>
 * </UiButtonsList>
 *
 * @slot default — List items (typically UiButtonsListItem components)
 *
 * @see UiButtonsListItem — Row item designed for use inside this list
 */
const props = defineProps({
  /**
   * Section label displayed above the list in uppercase.
   * @type {string}
   * @default ''
   */
  label: { type: String, default: '' },

  /**
   * Use danger/red styling for the container border, background, and label.
   * @type {boolean}
   * @default false
   */
  danger: { type: Boolean, default: false },

  /**
   * Border radius preset for the container.
   * @type {string}
   * @default 'xl'
   * @values 'xl' | 'lg' | 'none'
   */
  rounded: { type: String, default: 'xl' },
})

const shapeClass = computed(() => {
  const map = { xl: 'rounded-xl', lg: 'rounded-lg', none: '' }
  return map[props.rounded] ?? map.xl
})
</script>
