---
name: v16 Design System — Complete Color Audit
description: Extracted v16 actual design tokens from compiled CSS files showing exact hex values and usage patterns
type: reference
---

# v16 Design System — Complete Audit from Downloaded HTML/CSS Files

## Verified Color Values

### Accent Colors (CRITICAL - Already Fixed)
- **--color-accent**: `#fbbf24` (Amber 400) — PRIMARY ACCENT
  - Current code had: `#D97706` (Amber 600) — WRONG
  - Status: ✅ FIXED

- **--color-accent-light**: `#fcd34d` (Amber 300) — LIGHT ACCENT
  - Current code had: `#F59E0B` (Amber 500) — WRONG
  - Status: ✅ FIXED

- **--color-accent-dark**: `#f59e0b` (Amber 500) — DARK ACCENT (missing in current code)
  - Status: ✅ FIXED (added to globals.css)
  - Tailwind config: ✅ FIXED (added accent.dark mapping)

### Primary Colors
- **--color-primary**: `#2563EB` (Blue 600) — matches current code ✅

### Other Colors (to verify)
From class usage in v16 HTML:
- Raw Tailwind colors appear in some places (e.g., `text-blue-700`, `text-orange-800`)
- `bg-white` and `dark:bg-bg-secondary` patterns suggest dark mode IS present
- Border colors use `border-border` token
- Text uses `text-text-secondary`, `text-text-muted` tokens

## Build Status

Current build fails with "TypeError: generate is not a function"
- This is a PRE-EXISTING issue (not caused by color fixes)
- Affects: All builds from current codebase
- Related to: Next.js 16.1.7 and/or Tailwind 4 setup

## CSS Classes Found in v16

Top patterns:
- `text-primary`, `hover:text-primary` — primary color states
- `text-accent` — accent color text
- `text-text-secondary`, `text-text-muted` — text hierarchy
- `border-border` — border tokens
- `bg-white dark:bg-bg-secondary` — white cards with dark variant
- `hover:text-accent`, `hover:bg-bg` — interactive states
- `font-heading` — display font
- `text-xs`, `text-sm`, `text-base` — typography scale
- `rounded-md`, `rounded-lg` — border radius
- Raw Tailwind colors mixed in (e.g., `bg-blue-50 dark:bg-blue-950`)

## Next Steps When Build Fixed

1. ✅ Accent colors (already in globals.css)
2. Verify all other CSS variables match v16
3. Check for any raw Tailwind color overrides that should use tokens
4. Remove dark mode entirely (per user request)
5. Test against deployed v16
6. Deploy corrected version
