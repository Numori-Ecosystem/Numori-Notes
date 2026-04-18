<template>
  <!-- Teleported to body to avoid z-index stacking context issues -->
  <Teleport to="body">
    <!-- Backdrop overlay with fade transition -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        :class="[zClass, paddingClass]"
        @click.self="!persistent && $emit('close')">
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div v-if="show"
            class="bg-white dark:bg-gray-925 overflow-hidden flex flex-col"
            :class="[panelClass, maxWidthClass, roundedClass]"
            @click.stop>
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * UiModal — Teleported modal dialog with backdrop, configurable max-width, and enter/leave transitions.
 *
 * Renders a centered overlay panel teleported to `<body>`. Supports ten max-width presets
 * (xs through 5xl and full-screen), persistent mode to prevent backdrop-click dismissal,
 * and customizable z-index and padding. The panel uses a scale+fade transition on enter/leave.
 *
 * @example Basic modal
 * <UiModal :show="isOpen" @close="isOpen = false">
 *   <div class="p-6">Hello!</div>
 * </UiModal>
 *
 * @example Large persistent modal
 * <UiModal :show="showEditor" max-width="3xl" persistent>
 *   <ModalHeader @close="showEditor = false" />
 *   <div class="p-6">Editor content</div>
 * </UiModal>
 *
 * @example Full-screen modal
 * <UiModal :show="showFull" max-width="full">
 *   <div class="h-full">Full screen content</div>
 * </UiModal>
 *
 * @emits {void} close — Emitted when the modal should close (backdrop click or programmatic)
 *
 * @slot default — Modal content
 */
const props = defineProps({
  /**
   * Controls modal visibility. Use with v-model or :show + @close.
   * @type {boolean}
   * @default false
   */
  show: { type: Boolean, default: false },

  /**
   * Maximum width preset for the modal panel.
   * @type {string}
   * @default 'sm'
   * @values 'xs' (20rem) | 'sm' (24rem) | 'md' (28rem) | 'lg' (32rem) | 'xl' (36rem) | '2xl' (42rem) | '3xl' (48rem) | '4xl' (56rem) | '5xl' (64rem) | 'full'
   */
  maxWidth: { type: String, default: 'sm' },

  /**
   * Persistent mode — prevents closing when clicking the backdrop overlay.
   * @type {boolean}
   * @default false
   */
  persistent: { type: Boolean, default: false },

  /**
   * Additional CSS classes applied to the modal panel element.
   * @type {string}
   * @default ''
   */
  panelClass: { type: String, default: '' },

  /**
   * Z-index class for the backdrop and modal layers.
   * @type {string}
   * @default 'z-50'
   */
  z: { type: String, default: 'z-50' },

  /**
   * Padding class around the modal panel (applied to the backdrop container).
   * @type {string}
   * @default 'p-4'
   */
  padding: { type: String, default: 'p-4' },
})

defineEmits(['close'])

const zClass = computed(() => props.z)
const paddingClass = computed(() => props.padding)

const maxWidthClass = computed(() => {
  const map = {
    xs: 'max-w-xs w-full',
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    xl: 'max-w-xl w-full',
    '2xl': 'max-w-2xl w-full',
    '3xl': 'max-w-3xl w-full',
    '4xl': 'max-w-4xl w-full',
    '5xl': 'max-w-5xl w-full',
    full: 'w-full h-full',
  }
  return map[props.maxWidth] || map.sm
})

// Full-screen mode uses no rounding; all other sizes get rounded-lg
const roundedClass = computed(() => props.maxWidth === 'full' ? 'rounded-none md:rounded-lg' : 'rounded-lg')
</script>
