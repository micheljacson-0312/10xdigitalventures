# Migration & Upgrade Notes - 10x Chat

## Phase P0: Infrastructure & Security
- **Database**: Replaced `pg` with `mysql2` to standardize on MySQL for Hostinger compatibility.
- **Security**: Hardened CORS with environment allowlists. Added membership checks to socket events.
- **Cleanup**: Removed dead root files (`server.js`, `server.js_temp`). Converted `hash.js` to UTF-8.
- **API Consistency**: Standardized response envelopes to `{ data: ... }` or `{ message: ... }`.

## Phase P1: Messaging Features
- **Receipts**: Implemented sent/delivered/read status tracking in `message_status`.
- **Media**: Added backend support for `audio`, `video`, and `voice` types.
- **Push**: Integrated Expo Push Notifications for background alerts (`expo-server-sdk`).
- **Presence**: Added "typing" and "online" status synchronization.

## Phase P2: Design
- **Branding**: Implemented 10x Green (#1db791) as primary brand color.
- **UX**: Added WhatsApp-style message bubbles, status ticks, and improved layouts on Web.
- **A11y**: Ensured contrast ratios and reduced motion support.

## Phase P3: Packaging & Deployment
- **Desktop**: Configured Electron with updated URLs and polling support.
- **Mobile**: Permissions (`RECORD_AUDIO`, etc.) updated in `app.json`.
- **Backend**: Configured for both WebSocket and Polling (Hostinger hPanel compatibility).
