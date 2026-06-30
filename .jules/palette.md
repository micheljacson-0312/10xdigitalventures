## 2025-05-15 - Auto-resizing Textareas for Chat
**Learning:** Implementing auto-resizing for message input textareas significantly improves the 'mobile-app' feel and usability of desktop chat interfaces by maintaining visibility of context while accommodating longer messages.
**Action:** Use a 'useRef' to target the textarea and a 'useEffect' hook (triggered by content changes) that resets 'height' to 'auto' and then sets it to 'scrollHeight'.

## 2025-05-15 - Keyboard Navigation Accessibility
**Learning:** Using 'focus:ring-0' on interactive elements prevents keyboard users from knowing which element is focused.
**Action:** Always provide a visible focus indicator, such as 'focus:ring-1 focus:ring-brand-500', to ensure the application is accessible via keyboard.
