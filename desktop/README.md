# 10x Chat — Desktop App (Electron)

Wraps the web app at `chat.10xdigitalventures.com` into a native Mac + Windows desktop app.

## Features
- Native system tray (minimize to tray)
- Desktop notifications
- Dock/taskbar badge count
- Mac menu bar integration
- Auto-updater
- Keyboard shortcuts
- Zoom in/out
- Offline-aware (loads web app)

## Setup & Dev

```bash
npm install
npm run dev        # Opens with DevTools
```

## Build

### Windows (.exe installer + portable)
```bash
npm run build:win
```

### macOS (.dmg)
```bash
npm run build:mac
```

### Linux (.AppImage + .deb)
```bash
npm run build:linux
```

### All platforms at once
```bash
npm run build:all
```

Built files go to `dist/` folder.

## Icons
Place icons in `build/` folder before building:
- `icon.png`  — 512x512
- `icon.ico`  — Windows
- `icon.icns` — macOS

## App URL
- Production: https://chat.10xdigitalventures.com
- Dev mode:   http://localhost:3000 (run `npm run dev`)

Change `APP_URL` in `src/main.js` if needed.
