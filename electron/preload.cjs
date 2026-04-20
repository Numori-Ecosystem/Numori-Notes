const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform, // 'darwin' | 'win32' | 'linux'
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  setFullScreen: (flag) => ipcRenderer.send('window-set-fullscreen', flag),
  onFullScreenChange: (callback) =>
    ipcRenderer.on('window-fullscreen-changed', (_event, isFullScreen) => callback(isFullScreen)),
  // "Open with" file handling
  signalReady: () => ipcRenderer.send('renderer-ready'),
  onOpenFile: (callback) => ipcRenderer.on('open-file', (_event, data) => callback(data)),
})
