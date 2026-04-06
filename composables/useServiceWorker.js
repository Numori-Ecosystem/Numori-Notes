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

  console.log('[update-check] init', { platform, isNative, buildVersion, apiBase: config.public.apiBase })

  /** Apply the update — reload for web, open store for native */
  const applyUpdate = () => {
    if (isNative) {
      const url = storeUrl.value
        || (platform === 'android' ? 'https://play.google.com/store/apps/details?id=app.numori.app' : '')
        || (platform === 'ios' ? 'https://apps.apple.com/app/numori/id0000000000' : '')
      if (url) {
        // Use location.href — window.open is unreliable in Capacitor WebViews
        window.location.href = url
        return
      }
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
   * Fetch the latest deployed version from the server.
   *
   * Web:    GET /version.json  (static file, same origin — no CORS needed)
   * Native: GET /api/version   (API route on apiBase — CORS handled by middleware)
   */
  async function fetchLatestVersion() {
    let url
    if (isNative) {
      if (!config.public.apiBase) {
        console.warn('[update-check] fetchLatestVersion: no apiBase configured, skipping')
        return null
      }
      // Native: use /api/version which has CORS headers from the middleware
      url = `${config.public.apiBase}/api/version?_=${Date.now()}`
    } else {
      // Web: same-origin static file, no CORS needed
      const origin = config.public.apiBase || window.location.origin
      url = `${origin}/version.json?_=${Date.now()}`
    }
    console.log('[update-check] fetching', url)
    const res = await fetch(url, { cache: 'no-store' })
    console.log('[update-check] response', res.status, res.statusText)
    if (!res.ok) return null
    const data = await res.json()
    console.log('[update-check] server version:', data?.version)
    return data
  }

  /**
   * Compare the version baked into this JS bundle against the server.
   * Works identically for web and native — both ship the same JS bundle
   * version at build time.
   */
  async function checkForUpdate() {
    if (updateAvailable.value) {
      console.log('[update-check] already flagged, skipping')
      return
    }
    try {
      const data = await fetchLatestVersion()
      if (!data?.version) {
        console.warn('[update-check] no version in response')
        return
      }
      console.log('[update-check] comparing build=%s server=%s match=%s', buildVersion, data.version, data.version === buildVersion)
      if (data.version !== buildVersion) {
        console.log('[update-check] update available!')
        updateAvailable.value = true
        // Web: also nudge the SW so it's ready when user clicks Reload
        if (!isNative && navigator.serviceWorker) {
          const reg = await navigator.serviceWorker.getRegistration()
          reg?.update()
        }
      }
    } catch (err) {
      console.warn('[update-check] failed:', err)
    }
  }

  if (import.meta.client) {
    console.log('[update-check] registering listeners and timers')

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
