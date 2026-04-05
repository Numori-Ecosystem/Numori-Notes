/**
 * Composable for PWA update detection and online/offline status.
 *
 * Web: listens for SW update events AND polls /version.json as a fallback.
 * Native (Capacitor): polls /version.json and compares against the binary version.
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

  // The version baked into this build at compile time
  const buildVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

  /** Apply the update — reload for web, open store for native */
  const applyUpdate = () => {
    if (isNative && storeUrl.value) {
      window.open(storeUrl.value, '_blank')
      return
    }
    // Tell the waiting SW to activate, which triggers controllerchange → reload
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    } else {
      // Fallback: just reload — the new SW will activate on next load
      window.location.reload()
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

    if (isNative) {
      // Native: poll version.json against the binary version
      setTimeout(() => checkNativeUpdate(), 5000)
      setInterval(() => checkNativeUpdate(), 30 * 60 * 1000)
    } else {
      // Web: poll version.json as a fallback alongside SW update detection
      setTimeout(() => checkWebUpdate(), 10000)
      setInterval(() => checkWebUpdate(), 30 * 60 * 1000)
    }
  }

  /** Native: compare binary version against server's version.json */
  async function checkNativeUpdate() {
    if (!storeUrl.value) return
    try {
      const { App } = await import('@capacitor/app')
      const info = await App.getInfo()
      const currentVersion = info.version

      const data = await fetchVersionJson()
      if (data?.version && data.version !== currentVersion) {
        updateAvailable.value = true
      }
    } catch {
      // Can't check — silently ignore
    }
  }

  /** Web: compare the build-time version against server's version.json */
  async function checkWebUpdate() {
    if (updateAvailable.value) return // already showing
    try {
      const data = await fetchVersionJson()
      if (data?.version && data.version !== buildVersion) {
        updateAvailable.value = true
      }
    } catch {
      // Can't check — silently ignore
    }
  }

  async function fetchVersionJson() {
    const apiBase = config.public.apiBase || window.location.origin
    const res = await fetch(`${apiBase}/version.json`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  }

  return { updateAvailable, isOnline, isNative, storeUrl, applyUpdate, dismissUpdate }
}
