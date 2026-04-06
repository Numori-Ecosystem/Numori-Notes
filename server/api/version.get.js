/**
 * GET /api/version — returns the deployed app version.
 *
 * Native Capacitor apps use this instead of the static /version.json
 * because /api/ routes get CORS headers from the middleware,
 * while Nitro serves static public/ files without them.
 *
 * The __APP_VERSION__ constant is injected at build time by nuxt.config.ts
 * (vite.define) and is available in both client and server bundles.
 */
export default defineEventHandler(() => {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
  return { version }
})
