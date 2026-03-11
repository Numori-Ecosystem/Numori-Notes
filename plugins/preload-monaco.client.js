/**
 * Preload Monaco editor on app startup so it's ready when the user opens a note.
 * This avoids the delay on first editor render.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Fire-and-forget: start loading Monaco in the background
    import('monaco-editor').catch(() => {
      // Silently ignore – Monaco will load on demand when the editor mounts
    })
  }
})
