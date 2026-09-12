# Mobile Liquid-Glass Bottom Bar

## Goal
Refresh the existing mobile navigation into a floating liquid-glass bar while preserving its current destinations and the “আরও” menu.

## Changes
- Restyle the five-item mobile bar as a floating translucent surface with backdrop blur, subtle border, and restrained purple glow.
- Give the active destination a clear purple glass highlight while keeping inactive items readable.
- Preserve safe-area spacing, fixed sizing, touch targets, Bengali labels, and the existing drawer behavior.
- Adjust the mobile page bottom spacing so content stays fully visible above the floating bar.
- Keep desktop navigation unchanged.

## Technical details
- Update the existing bottom navigation and authenticated page shell only.
- Reuse existing semantic colors and navigation behavior; add no new feature or backend work.
- Verify the authenticated mobile layout and “আরও” drawer in the running preview.
