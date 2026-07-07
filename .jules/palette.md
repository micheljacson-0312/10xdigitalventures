## 2025-05-14 - Standardizing Feedback and Input Behavior
**Learning:** The application already includes `react-hot-toast` in the `RootLayout`, making it the preferred method for non-blocking notifications over native `alert()`. For chat interfaces, users expect inputs to dynamically resize to maintain context of long messages without manual scrolling.
**Action:** Always check `RootLayout` for existing notification providers before adding new ones. Implement the `scrollHeight` pattern for auto-resizing textareas to improve the "mobile-app" feel on desktop.
