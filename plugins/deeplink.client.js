import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  App.addListener('appUrlOpen', (data) => {
    // data.url is the full URL, e.g. https://notes.numori.app/shared/abc123?key=xyz
    try {
      const url = new URL(data.url)
      const path = url.pathname + url.search
      if (path && path !== '/') {
        router.push(path)
      }
    } catch {
      // ignore malformed URLs
    }
  })
})
