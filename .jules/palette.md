## 2024-05-24 - [Accessibility & Feedback]
**Learning:** Icon-only buttons (emoji, send, attach) must have `aria-label` for screen readers and `title` for visual tooltips. Native `alert()` should be avoided in favor of integrated toast notifications for a better UX.
**Action:** Always add `aria-label` and `title` to icon buttons and use `toast` from `react-hot-toast` (which is already configured in the root layout).

## 2024-05-24 - [Next.js Build Failures]
**Learning:** Template literals and backticks in JSX/JS files should not be escaped with backslashes (e.g., `\${` or `\``). This causes "Expected unicode escape" syntax errors in the Next.js build process.
**Action:** Ensure all template literals are correctly formatted without backslash escapes before building or submitting.
