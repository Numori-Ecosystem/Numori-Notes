import { app, BrowserWindow, shell, ipcMain, dialog, protocol, net, Menu } from 'electron'
import { join, extname, normalize } from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const SUPPORTED_EXTENSIONS = ['.num', '.txt', '.md', '.csv']

// Holds the file path passed via OS "open with" until the renderer is ready
let pendingFilePath = null

function isFileSupported(filePath) {
  return SUPPORTED_EXTENSIONS.includes(extname(filePath).toLowerCase())
}

async function handleOpenFile(filePath) {
  if (!isFileSupported(filePath)) {
    dialog.showMessageBox({
      type: 'warning',
      title: 'File format not supported',
      message: `The file "${filePath}" cannot be opened.\n\nSupported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      buttons: ['OK'],
    })
    return
  }

  const win = BrowserWindow.getAllWindows()[0]
  if (win) {
    try {
      const content = await readFile(filePath, 'utf-8')
      win.webContents.send('open-file', { path: filePath, content })
    } catch (err) {
      dialog.showErrorBox('Error opening file', err.message)
    }
  } else {
    pendingFilePath = filePath
  }
}

// macOS: file opened via Finder / "Open With"
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (app.isReady()) {
    handleOpenFile(filePath)
  } else {
    pendingFilePath = filePath
  }
})

// Windows/Linux: file path passed as command-line argument
const fileArg = process.argv.slice(1).find((arg) => {
  if (arg.startsWith('-')) return false
  if (arg === __dirname || arg.includes('electron')) return false
  const ext = extname(arg).toLowerCase()
  if (!ext) return false
  return true
})
if (fileArg) {
  if (isFileSupported(fileArg)) {
    pendingFilePath = fileArg
  } else {
    // Will show dialog once app is ready
    app.whenReady().then(() => {
      dialog.showMessageBox({
        type: 'warning',
        title: 'File format not supported',
        message: `The file "${fileArg}" cannot be opened.\n\nSupported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        buttons: ['OK'],
      })
    })
  }
}

// The directory where the Nuxt static build lives
const STATIC_DIR = join(__dirname, '..', '.output', 'public')

// Register a custom protocol scheme to serve the Nuxt static build.
// This allows absolute paths (e.g. /_nuxt/...) to resolve correctly,
// which they cannot do under the file:// protocol.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: 'Numori Notes',
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: -20, y: -20 } } : {}),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenuBarVisibility(false)

  // Notify renderer when fullscreen state changes (e.g. user presses Escape on macOS)
  win.on('enter-full-screen', () => {
    win.webContents.send('window-fullscreen-changed', true)
  })
  win.on('leave-full-screen', () => {
    win.webContents.send('window-fullscreen-changed', false)
  })

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent page reload via Ctrl+R, Cmd+R, F5, Ctrl+Shift+R, Cmd+Shift+R
  win.webContents.on('before-input-event', (event, input) => {
    const isReload = (input.key === 'r' && (input.control || input.meta)) || input.key === 'F5'
    if (isReload) {
      event.preventDefault()
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadURL('app://.')
  }
}

app.whenReady().then(async () => {
  // Handle the custom 'app://' protocol — serves files from the Nuxt static build directory.
  // This makes absolute paths like /_nuxt/entry.js resolve to .output/public/_nuxt/entry.js
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    // Decode and normalize the pathname to prevent directory traversal
    let filePath = decodeURIComponent(url.pathname)
    // Remove leading slash on Windows
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.slice(1)
    }
    // Default to index.html for root
    if (filePath === '/' || filePath === '') {
      filePath = '/index.html'
    }
    const resolvedPath = normalize(join(STATIC_DIR, filePath))
    // Security: ensure the resolved path is within STATIC_DIR
    if (!resolvedPath.startsWith(STATIC_DIR)) {
      return new Response('Forbidden', { status: 403 })
    }
    // SPA fallback: if the file doesn't exist, serve index.html
    // This prevents 404s and lets the client-side router handle all routes
    const fileUrl = pathToFileURL(resolvedPath).href
    return net
      .fetch(fileUrl)
      .then((response) => {
        if (response.ok) return response
        // File not found — fall back to index.html (SPA catch-all)
        return net.fetch(pathToFileURL(join(STATIC_DIR, 'index.html')).href)
      })
      .catch(() => {
        return net.fetch(pathToFileURL(join(STATIC_DIR, 'index.html')).href)
      })
  })

  // Build a custom macOS menu without File and View
  if (process.platform === 'darwin') {
    const template = [
      { role: 'appMenu' },
      { role: 'editMenu' },
      { role: 'windowMenu' },
      {
        role: 'help',
        submenu: [],
      },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }

  createWindow()

  // Send pending file once the renderer signals it's ready
  ipcMain.on('renderer-ready', async () => {
    if (pendingFilePath) {
      await handleOpenFile(pendingFilePath)
      pendingFilePath = null
    }
  })
})

// Windows/Linux: handle "Open With" when app is already running (single instance)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // Focus existing window
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
    // Check if a file was passed
    const filePath = argv.slice(1).find((arg) => {
      if (arg.startsWith('-')) return false
      const ext = extname(arg).toLowerCase()
      return ext.length > 0
    })
    if (filePath) handleOpenFile(filePath)
  })
}

// Window control IPC handlers
ipcMain.on('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})
ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})
ipcMain.on('window-close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})
ipcMain.on('window-set-fullscreen', (event, flag) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.setFullScreen(!!flag)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
