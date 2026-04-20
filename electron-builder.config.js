/**
 * @type {import('electron-builder').Configuration}
 */
export default {
  appId: 'notes.numori.app',
  productName: 'Numori Notes',
  directories: {
    output: 'dist-electron',
  },
  files: ['.output/public/**/*', 'electron/**/*', 'package.json'],
  fileAssociations: [
    { ext: 'num', name: 'Numori Note', mimeType: 'application/x-numori-note' },
    { ext: 'txt', name: 'Text File', mimeType: 'text/plain' },
    { ext: 'md', name: 'Markdown File', mimeType: 'text/markdown' },
    { ext: 'csv', name: 'CSV File', mimeType: 'text/csv' },
  ],
  icon: 'icons/icon.png',
  mac: {
    category: 'public.app-category.productivity',
    icon: 'icons/icon.icns',
    target: ['dmg', 'zip'],
  },
  win: {
    icon: 'icons/icon.ico',
    target: ['nsis', 'portable'],
  },
  linux: {
    icon: 'icons',
    target: [
      'rpm',
      // 'pacman'
      // 'deb',
      'AppImage',
      // 'flatpak',
      // 'tar.gz',
      // 'tar.bz2'
    ],
    category: 'Utility',
  },
  flatpak: {
    runtime: 'org.freedesktop.Platform',
    runtimeVersion: '25.08',
    sdk: 'org.freedesktop.Sdk',
    base: 'org.electronjs.Electron2.BaseApp',
    baseVersion: '25.08',
  },
}
