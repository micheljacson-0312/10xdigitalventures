const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  setBadge: (count) => {
    ipcRenderer.send('badge-count', count);
  },

  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
  restartAndInstall: () => ipcRenderer.send('restart-and-install'),

  isElectron: true,
  platform: process.platform,
});
