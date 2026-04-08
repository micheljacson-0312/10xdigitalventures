# Deployment Guide for 10x Chat

## 1. Backend Deployment (Hostinger Node.js)

### Setup
1. **Upload**: Upload the `backend/` folder to your Hostinger Node.js hosting.
2. **Database**: 
   - Create a MySQL database on Hostinger.
   - Import the `backend/schema.sql` file into your database using phpMyAdmin.
3. **Environment**: Edit the `.env` file in the backend folder:
   - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: Use your Hostinger MySQL credentials.
   - `PUBLIC_API_URL`: Set this to your backend domain (e.g., `https://api.10xdigitalventures.com`).
   - `CLIENT_URL`: Set to your web app domain (e.g., `https://chat.10xdigitalventures.com`).
   - `JWT_SECRET`: Use a strong random string.
4. **Start**:
   - Run `npm install`.
   - Use PM2 to keep the app running: `pm2 start server.js --name 10x-chat`.

---

## 2. Mobile Build (Android APK & iOS)

This project uses **Expo EAS** for production builds.

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in to your Expo account: `eas login`

### Android APK Build
1. Go to the `mobile/` directory.
2. Configure project: `eas build:configure`
3. Build APK (Preview):
   ```bash
   eas build --platform android --profile preview
   ```
4. Once finished, EAS will provide a link to download the `.apk` file.

### iOS Build
1. Go to the `mobile/` directory.
2. Build for iOS:
   ```bash
   eas build --platform ios
   ```
   *(Requires Apple Developer Account)*

---

## 3. Connecting Mobile to Backend

Ensure the `.env` file in the `mobile/` folder has the correct production URLs:
```env
EXPO_PUBLIC_API_URL=https://api.10xdigitalventures.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.10xdigitalventures.com
```
If you change these, you MUST rebuild the APK/iOS app.
