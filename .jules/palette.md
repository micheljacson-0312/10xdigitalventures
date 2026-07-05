## 2025-05-22 - [Auto-resizing Message Input]
**Learning:** Implementing auto-resizing for message input textareas significantly improves the 'mobile-app' feel of desktop chat interfaces. Using 'focus-visible' with custom brand colors ensures accessibility without compromising the dark-mode aesthetic.
**Action:** Use the 'height: auto -> height: scrollHeight' pattern in useEffect for all multi-line text inputs to provide a more fluid typing experience.
