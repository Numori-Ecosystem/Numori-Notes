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
