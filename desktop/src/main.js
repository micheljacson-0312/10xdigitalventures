const { app, BrowserWindow, Tray, Menu, shell, ipcMain, Notification, nativeImage } = require('electron')
const { autoUpdater } = require('electron-updater')
const Store = require('electron-store')
const path = require('path')

const store = new Store()
const isDev = process.argv.includes('--dev')
const APP_URL = isDev ? 'http://localhost:3000' : 'https://chat.10xdigitalventures.com'

let mainWindow = null
let tray = null

// ─── Create Main Window ────────────────────────────────────────
function createWindow() {
  const { width, height } = store.get('windowBounds', { width: 1200, height: 800 })

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    title: '10x Chat',
    backgroundColor: '#0f1117',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
  })

  mainWindow.loadURL(APP_URL)

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools()
  })

  // Save window size on resize
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds()
    store.set('windowBounds', { width, height })
  })

  // Minimize to tray on close (Windows/Linux)
  mainWindow.on('close', (e) => {
    if (process.platform !== 'darwin' && tray) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
}

// ─── System Tray ───────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '../build/tray-icon.png')
  try {
    tray = new Tray(iconPath)
  } catch {
    // fallback if icon missing
    tray = new Tray(nativeImage.createEmpty())
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: '10x Chat', enabled: false },
    { type: 'separator' },
    {
      label: 'Open',
      click: () => { mainWindow?.show(); mainWindow?.focus() }
    },
    {
      label: 'New Message',
      click: () => { mainWindow?.show(); mainWindow?.focus(); mainWindow?.webContents.executeJavaScript('window.location.href="/chat"') }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { app.isQuitting = true; app.quit() }
    }
  ])

  tray.setToolTip('10x Chat')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow?.show()
    }
  })
}

// ─── App Menu ──────────────────────────────────────────────────
function createMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Channel',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.executeJavaScript('document.querySelector(".add-channel-btn")?.click()')
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : [])
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [{ role: 'close' }])
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── Notifications via IPC ─────────────────────────────────────
ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show()
  }
})

ipcMain.on('badge-count', (event, count) => {
  if (process.platform === 'darwin') app.dock.setBadge(count > 0 ? String(count) : '')
})

// ─── App Lifecycle ─────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
  createMenu()

  // Auto updater (only in production)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => { app.isQuitting = true })

// ─── Auto Updater Events ───────────────────────────────────────
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available')
})

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded')
})

ipcMain.on('restart-and-install', () => {
  autoUpdater.quitAndInstall()
})
