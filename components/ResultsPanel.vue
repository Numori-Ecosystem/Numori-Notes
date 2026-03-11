<template>
  <div :class="[
    'flex-shrink-0 overflow-hidden bg-white dark:bg-gray-925 transition-all duration-200 ease-in-out',
    visible ? 'opacity-100 border-l border-gray-200 dark:border-gray-800' : 'w-0 opacity-0',
    bordered && visible ? 'ml-2 rounded-lg' : ''
  ]" :style="visible ? { width: width + 'px' } : {}">
    <div :style="{ width: width + 'px', transform: `translateY(-${scrollTop}px)` }">
      <div class="p-0">
        <div v-for="(line, index) in lines" :key="index" :class="[
          'text-right whitespace-nowrap leading-6 flex items-center justify-end gap-2',
          currentLine === index ? 'bg-primary-100 dark:bg-primary-900' : ''
        ]" :style="{ height: lineHeight + 'px' }">
          <span v-if="line.result" @click="$emit('copy-result', line.result, index)"
            :class="[
              'text-primary-600 dark:text-primary-400 text-lg hover:text-primary-700 dark:hover:text-primary-400 transition-colors pl-1 relative',
              copyable ? 'cursor-pointer' : 'cursor-default'
            ]">
            <Transition
              enter-active-class="transition-opacity duration-150"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-300"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
              <span v-if="copiedIndex === index"
                :class="[
                  'absolute left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 rounded shadow-sm whitespace-nowrap z-10',
                  index <= 1 ? 'top-full mt-2' : 'bottom-full mb-2'
                ]">
                <span :class="[
                  'absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent',
                  index <= 1
                    ? 'bottom-full border-b-4 border-b-green-100 dark:border-b-green-900'
                    : 'top-full border-t-4 border-t-green-100 dark:border-t-green-900'
                ]" />
                Copied
              </span>
            </Transition>
            {{ line.result }}</span>
          <span v-else-if="line.error" class="text-error-500 dark:text-error-400 text-sm italic">{{ line.error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  lines: { type: Array, default: () => [] },
  visible: { type: Boolean, default: true },
  bordered: { type: Boolean, default: false },
  width: { type: Number, default: 256 },
  scrollTop: { type: Number, default: 0 },
  currentLine: { type: Number, default: 0 },
  lineHeight: { type: Number, default: 19 },
  copyable: { type: Boolean, default: true },
  copiedIndex: { type: Number, default: null }
})

defineEmits(['copy-result'])
</script>
