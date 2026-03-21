<template>
  <div class="transition-colors duration-200">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
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
</style>
