## 2025-05-14 - Accessibility and Build Resilience
**Learning:** Icon-only buttons without ARIA labels are invisible to screen readers. Additionally, incorrectly escaped template literals (`\${`) cause syntax errors in Next.js builds.
**Action:** Always include `aria-label` and `title` for icon-only buttons. Avoid escaping `${` in template literals within JSX/JS files.
