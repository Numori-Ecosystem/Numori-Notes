import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join, extname } from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: 'Numori Notes',
    frame: false,
    titleBarStyle: 'hidden',
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

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(__dirname, '..', '.output', 'public', 'index.html'))
  }
}

app.whenReady().then(async () => {
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
