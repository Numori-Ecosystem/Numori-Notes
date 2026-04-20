const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform, // 'darwin' | 'win32' | 'linux'
  isElectron: true,
})
