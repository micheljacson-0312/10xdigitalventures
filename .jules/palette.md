## 2026-06-28 - [Auto-resizing Textarea & Icon Accessibility]
**Learning:** Implementing auto-resizing for message inputs significantly enhances the "native app" feel of chat interfaces by providing visibility for long messages without permanent layout bloat. Additionally, icon-only buttons in the sidebar and message actions are common accessibility blind spots in this app.
**Action:** Always check for auto-resize logic in textareas and ensure 'aria-label' and 'title' are present on all icon-only interactive elements in the chat UI.
