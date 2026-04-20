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
  icon: 'build/icon.png',
  mac: {
    category: 'public.app-category.productivity',
    icon: 'build/icon.icns',
    target: ['dmg', 'zip'],
  },
  win: {
    icon: 'build/icon.ico',
    target: ['nsis', 'portable'],
  },
  linux: {
    icon: 'icons',
    target: ['AppImage', 'deb', 'rpm', 'flatpak', 'pacman'],
    category: 'Utility',
  },
}
