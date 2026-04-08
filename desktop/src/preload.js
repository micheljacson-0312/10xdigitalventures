const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to the web app via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // Send native notification
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body })
  },

  // Set dock/taskbar badge count
  setBadge: (count) => {
    ipcRenderer.send('badge-count', count)
  },

  // Auto updater
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
  restartAndInstall: () => ipcRenderer.send('restart-and-install'),

  // Check if running in Electron
  isElectron: true,

  // Platform
  platform: process.platform,
})
