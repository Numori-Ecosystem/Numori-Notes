/**
 * Composable for PWA update detection and online/offline status.
 *
 * On web: detects when a new service worker is waiting and offers to reload.
 * On native (Capacitor): fetches /version.json from the server and compares
 * against the native binary version. If behind, directs to the app store.
 */
export const useServiceWorker = () => {
  const updateAvailable = ref(false)
  const isOnline = useOnlineStatus()

  let swRegistration = null

  const { platform } = usePlatform()
  const config = useRuntimeConfig()

  const storeUrl = computed(() => {
    if (platform === 'android') return config.public.storeAndroid || ''
    if (platform === 'ios') return config.public.storeIos || ''
    return ''
  })

  const isNative = platform === 'android' || platform === 'ios'

  /** Apply the update — reload for web, open store for native */
  const applyUpdate = () => {
    if (isNative && storeUrl.value) {
      window.open(storeUrl.value, '_blank')
      return
    }
    // Tell the waiting SW to activate
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  const dismissUpdate = () => {
    updateAvailable.value = false
  }

  if (import.meta.client) {
    // Listen for SW update events dispatched by the pwa plugin
    window.addEventListener('sw-update-available', (e) => {
      swRegistration = e.detail?.registration || null
      updateAvailable.value = true
    })

    // For native apps: poll version.json to detect new releases
    if (isNative) {
      // Check on startup after a short delay, then every 30 minutes
      setTimeout(() => checkNativeUpdate(), 5000)
      setInterval(() => checkNativeUpdate(), 30 * 60 * 1000)
    }
  }

  async function checkNativeUpdate() {
    if (!storeUrl.value) return
    try {
      const { App } = await import('@capacitor/app')
      const info = await App.getInfo()
      const currentVersion = info.version

      const apiBase = config.public.apiBase || window.location.origin
      const res = await fetch(`${apiBase}/version.json`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()

      if (data.version && data.version !== currentVersion) {
        updateAvailable.value = true
      }
    } catch {
      // Can't check — silently ignore
    }
  }

  return { updateAvailable, isOnline, isNative, storeUrl, applyUpdate, dismissUpdate }
}
