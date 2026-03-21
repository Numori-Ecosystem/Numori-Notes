<template>
  <div class="transition-colors duration-200">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Safe area insets for notched / rounded-corner devices */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

/* Smooth theme transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* CodeMirror manages its own transitions — don't interfere */
.cm-editor *,
.cm-editor {
  transition: none !important;
}

/* Prevent transition on page load */
.no-transition * {
  transition: none !important;
}

/* Full-screen modals: respect safe areas on mobile */
@media (max-width: 767px) {
  .safe-area-modal {
    padding-top: var(--sat);
    padding-bottom: var(--sab);
    padding-left: var(--sal);
    padding-right: var(--sar);
  }
}
</style>
