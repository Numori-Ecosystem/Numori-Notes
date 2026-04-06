/**
 * Composable for update detection and online/offline status.
 *
 * Both web and native compare the build-time __APP_VERSION__ (baked into the
 * JS bundle) against /version.json on the server. If they differ, a new
 * version has been deployed.
 *
 * - Web: clicking "Reload" activates the waiting service worker.
 * - Native: clicking "Update" opens the app store link.
 *
 * Polling runs on startup, every 10 minutes, and on visibility change.
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

  // The version baked into this JS bundle at compile time
  const buildVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

  /** Apply the update — reload for web, open store for native */
  const applyUpdate = () => {
    if (isNative && storeUrl.value) {
      window.open(storeUrl.value, '_blank')
      return
    }
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  const dismissUpdate = () => {
    updateAvailable.value = false
  }

  /**
   * Fetch /version.json from the server, bypassing all caches.
   * On native Capacitor, we MUST use apiBase (the remote server) because
   * window.location.origin points to the local bundled assets.
   */
  async function fetchLatestVersion() {
    const origin = isNative
      ? config.public.apiBase
      : (config.public.apiBase || window.location.origin)

    if (!origin) return null // native without apiBase configured — can't check

    const url = `${origin}/version.json?_=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  }

  /**
   * Compare the version baked into this JS bundle against the server.
   * Works identically for web and native — both ship the same JS bundle
   * version at build time.
   */
  async function checkForUpdate() {
    if (updateAvailable.value) return
    try {
      const data = await fetchLatestVersion()
      if (data?.version && data.version !== buildVersion) {
        updateAvailable.value = true
        // Web: also nudge the SW so it's ready when user clicks Reload
        if (!isNative && navigator.serviceWorker) {
          const reg = await navigator.serviceWorker.getRegistration()
          reg?.update()
        }
      }
    } catch { /* offline or server down — ignore */ }
  }

  if (import.meta.client) {
    // SW update event (web only) — immediate notification
    window.addEventListener('sw-update-available', (e) => {
      swRegistration = e.detail?.registration || null
      updateAvailable.value = true
    })

    // Poll on startup after a short delay
    setTimeout(checkForUpdate, 3000)

    // Poll every 10 minutes
    setInterval(checkForUpdate, 10 * 60 * 1000)

    // Poll when the app comes back to the foreground
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
  }

  return { updateAvailable, isOnline, isNative, storeUrl, applyUpdate, dismissUpdate }
}
