
## 2025-05-14 - Accessibility and Input Polish
**Learning:** The application had a consistent pattern of missing ARIA labels on icon-only buttons (reactions, send, attach), making it difficult for screen reader users. Additionally, the chat input lacked auto-resizing, which is a standard expectation for modern chat interfaces to improve multi-line visibility.
**Action:** Always check for aria-label on interactive elements without text content. Implement the auto-resizing pattern (scrollHeight) for all multi-line text inputs in the chat flow to enhance the "native app" feel.
