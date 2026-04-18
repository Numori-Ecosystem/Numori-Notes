<template>
  <div>
    <div v-if="show" class="fixed inset-0" :class="backdropZ" @click="$emit('close')" />
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="show" ref="panelRef"
        class="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
        :class="[width, panelZ]"
        :style="positionStyle">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  offsetY: { type: Number, default: 0 },
  width: { type: String, default: 'w-56' },
  panelZ: { type: String, default: 'z-50' },
  backdropZ: { type: String, default: 'z-40' },
})

defineEmits(['close'])

const panelRef = ref(null)
const clampedPos = ref({ left: 0, top: 0 })

const positionStyle = computed(() => ({
  left: clampedPos.value.left + 'px',
  top: clampedPos.value.top + 'px',
}))

const updatePosition = () => {
  let left = props.x
  let top = props.y + props.offsetY

  nextTick(() => {
    const el = panelRef.value
    if (!el) return

    const parent = el.offsetParent || document.body
    const parentRect = parent.getBoundingClientRect()
    const panelW = el.offsetWidth
    const panelH = el.offsetHeight
    const viewW = window.innerWidth
    const viewH = window.innerHeight

    // Convert to viewport coords, clamp, convert back
    let absLeft = parentRect.left + left
    let absTop = parentRect.top + top

    const margin = 8
    if (absLeft + panelW > viewW - margin) absLeft = viewW - panelW - margin
    if (absLeft < margin) absLeft = margin
    if (absTop + panelH > viewH - margin) absTop = viewH - panelH - margin
    if (absTop < margin) absTop = margin

    clampedPos.value = {
      left: absLeft - parentRect.left,
      top: absTop - parentRect.top,
    }
  })
}

watch(() => [props.show, props.x, props.y, props.offsetY], () => {
  if (props.show) {
    // Set initial position immediately so the panel renders near the right spot
    clampedPos.value = { left: props.x, top: props.y + props.offsetY }
    updatePosition()
  }
}, { immediate: true })
</script>
