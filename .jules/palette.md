## 2025-05-15 - [Message Input UX & Accessibility]
**Learning:** Implementing auto-resizing for message input textareas significantly improves the 'mobile-app' feel of desktop chat interfaces by maintaining visibility of context while accommodating longer messages. Additionally, icon-only buttons must have `aria-label` and `title` for both screen readers and visual tooltips.
**Action:** Always use the `useRef` + `useEffect` pattern for auto-resizing textareas in chat inputs and ensure every icon button has descriptive accessibility attributes.
