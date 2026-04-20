import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const SUPPORTED_EXTENSIONS = ['.num', '.txt', '.md', '.csv']

function getExtension(filePath) {
  const match = filePath.match(/\.([^.]+)$/)
  return match ? '.' + match[1].toLowerCase() : ''
}

function isSupported(filePath) {
  return SUPPORTED_EXTENSIONS.includes(getExtension(filePath))
}

function extractTitleAndContent(name, text) {
  let title = name.replace(/\.[^.]+$/, '') || 'Opened Note'
  let content = text

  if (name.endsWith('.md')) {
    const headerMatch = text.match(/^#\s+(.+)\n\n?/)
    if (headerMatch) {
      title = headerMatch[1].trim()
      content = text.slice(headerMatch[0].length)
    }
  }

  return { title, description: '', content }
}

export default defineNuxtPlugin(() => {
  const router = useRouter()

  // Electron: listen for files opened via OS "Open With"
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.onOpenFile(({ path, content }) => {
      const name = path.split(/[/\\]/).pop()
      const note = extractTitleAndContent(name, content)
      window.__pendingOpenWithNote = note
      // Dispatch event so the page can pick it up even if already mounted
      window.dispatchEvent(new CustomEvent('open-with-file-content', { detail: note }))
      router.push('/')
    })
    // Signal to main process that renderer is ready to receive files
    window.electronAPI.signalReady()
  }

  // Listen for unsupported file format events (all platforms)
  if (typeof window !== 'undefined') {
    window.addEventListener('open-with-unsupported', (e) => {
      const { fileName } = e.detail
      alert(
        `File format not supported\n\nThe file "${fileName}" cannot be opened.\n\nSupported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      )
    })

    window.addEventListener('open-with-error', (e) => {
      const { fileName } = e.detail
      alert(`Failed to open file "${fileName}".`)
    })

    // iOS sends file content directly via this event
    window.addEventListener('open-with-file-content', (e) => {
      if (!e.detail?.fileName) return // Skip if this is a re-dispatch from plugin
      const { fileName, content } = e.detail
      if (!isSupported(fileName)) {
        window.dispatchEvent(new CustomEvent('open-with-unsupported', { detail: { fileName } }))
        return
      }
      const note = extractTitleAndContent(fileName, content)
      window.__pendingOpenWithNote = note
      router.push('/')
    })

    // Android sends file URI via this event
    window.addEventListener('open-with-file', async (e) => {
      const { uri } = e.detail
      const fileName = decodeURIComponent(uri.split('/').pop() || '')
      if (!isSupported(fileName)) {
        window.dispatchEvent(new CustomEvent('open-with-unsupported', { detail: { fileName } }))
        return
      }
      try {
        const response = await fetch(uri)
        const text = await response.text()
        const note = extractTitleAndContent(fileName, text)
        window.__pendingOpenWithNote = note
        window.dispatchEvent(new CustomEvent('open-with-file-content', { detail: note }))
        router.push('/')
      } catch {
        window.dispatchEvent(new CustomEvent('open-with-error', { detail: { fileName } }))
      }
    })
  }

  // Capacitor (Android/iOS): also listen for appUrlOpen for file:// URIs
  if (Capacitor.isNativePlatform()) {
    App.addListener('appUrlOpen', async (data) => {
      const url = data.url

      // Only handle file:// or content:// URIs (not https deep links)
      if (!url.startsWith('file://') && !url.startsWith('content://')) return

      const fileName = decodeURIComponent(url.split('/').pop() || '')
      if (!isSupported(fileName)) {
        window.dispatchEvent(new CustomEvent('open-with-unsupported', { detail: { fileName } }))
        return
      }

      try {
        const response = await fetch(url)
        const text = await response.text()
        const note = extractTitleAndContent(fileName, text)
        window.__pendingOpenWithNote = note
        window.dispatchEvent(new CustomEvent('open-with-file-content', { detail: note }))
        router.push('/')
      } catch {
        window.dispatchEvent(new CustomEvent('open-with-error', { detail: { fileName } }))
      }
    })
  }
})
