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
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'],
  },
  win: {
    target: ['nsis', 'portable'],
  },
  linux: {
    target: ['AppImage', 'deb', 'rpm', 'flatpak', 'pacman'],
    category: 'Utility',
  },
}
