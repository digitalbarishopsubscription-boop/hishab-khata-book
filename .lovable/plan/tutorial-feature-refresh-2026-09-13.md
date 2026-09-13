# Tutorial Feature Refresh

## Build
- Remove “CEO কন্ট্রোল” and “রোল ও অনুমতি” from desktop and mobile navigation.
- Add one “টিউটোরিয়াল” destination using the selected Elegant Tutorial direction.
- Build a responsive Bengali tutorial library covering dashboard, sales, customers, khata, inventory, expenses, and reports.
- Include working lesson selection, progress tracking, continue/start actions, and completion state saved on the device.
- Keep the existing purple-white brand, Hind Siliguri font, mobile liquid-glass bar, and all other business features unchanged.

## Technical details
- Reuse the existing authenticated `/ceo` route as `/tutorial`, then remove the obsolete CEO and role route files.
- Use existing semantic design tokens and Button components; add only tutorial-specific semantic tokens if needed.
- Add unique noindex metadata for the authenticated tutorial page.
- Verify desktop and mobile navigation, lesson interactions, persistence, and page layout in the preview.
