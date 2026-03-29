---
name: TavaDiena.lv v16 Design — What Works
description: Notes on what makes v16 look professional and clean; what NOT to change
type: feedback
---

## v16 Is the Working Design (Deployment: 9h ago)

v16 is the first deployment that actually looks professional and clean. This was built from commit 6113289 which implemented the complete redesign. Later attempts to "fix" things (v17-v27) made it worse, so reverting to v16 was the right call.

## Color System — CORRECT in v16

**CSS Variables in globals.css (currently correct):**
```css
--color-primary: #2563EB;           /* Professional blue */
--color-primary-light: #3B82F6;
--color-primary-dark: #1D4ED8;

--color-accent: #D97706;            /* Amber highlight */
--color-accent-light: #F59E0B;

--color-bg: #FFFFFF;                /* Page background WHITE */
--color-bg-secondary: #F9FAFB;      /* Cards light gray */
--color-bg-tertiary: #F3F4F6;

--color-text: #111827;              /* Dark text on light bg */
--color-text-secondary: #6B7280;    /* Secondary gray */
--color-text-muted: #9CA3AF;        /* Muted gray */

--color-border: #E5E7EB;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
```

**Important**: The plan said page bg should be light gray (#F7F8FA), but v16 has white (#FFFFFF). The white-page + light-gray-secondary is actually what works visually. Don't revert this.

## Typography — CORRECT in v16

- **Font**: Inter (via `@next/font/google`) in layout.tsx
- **Body**: 16px font-size, 1.6 line-height, dark text (#111827)
- **Headings**: 2rem (h1) / 1.5rem (h2) / 1.25rem (h3), 600-700 weight
- **Font-heading class**: Uses Inter bold for display text

No changes needed here.

## Footer Component — CRITICAL DIFFERENCE

**v16 (CORRECT - what user sees as "good"):**
```tsx
<footer className="bg-primary text-white mt-16">
  <p className="text-sm text-text-muted">...</p>
  <ul className="space-y-2 text-sm text-text-muted">
```

Uses `text-text-muted` (#9CA3AF) on blue footer background.

**v25+ (BROKEN - my attempted fix):**
Changed to:
```tsx
<p className="text-sm text-white/70 leading-relaxed">
<ul className="space-y-2 text-sm text-white/70">
```

**Why v16 looks better**: The `text-text-muted` color (#9CA3AF) creates a visual hierarchy. While contrast purists might say it's not ideal, it produces a softer, more sophisticated look. The white/70 approach I tried was harsher and less polished.

## Newsletter Signup (inline variant) — CRITICAL DIFFERENCE

**v16 (CORRECT):**
```tsx
<p className="text-sm text-text-muted mb-3">
<input className="... text-text bg-white/10 border border-white/20 placeholder:text-text-muted ..."
```

Dark text on mostly-blue background in footer.

**v25+ (BROKEN):**
Changed to white text:
```tsx
<p className="text-sm text-white/70 mb-3">
<input className="... text-white bg-white/10 border border-white/20 placeholder:text-white/60 ..."
```

**Why this matters**: The original approach (text-text-muted) somehow still looks professional. The white-text fix created the "ugly" appearance the user mentioned.

## What Changed Between v16 and v25+

1. **Footer.tsx**: All `text-text-muted` → `text-white/70`
2. **NewsletterSignup.tsx (inline variant)**: Dark text → white text
3. Also changed placeholder and label colors in newsletter

These changes were ATTEMPTED FIXES for contrast issues, but they BROKE the design.

## Why This Happened

I misidentified a contrast "problem" that wasn't actually a problem:
- I saw `text-text-muted` (#9CA3AF) on blue footer and thought it lacked contrast
- I changed it to `text-white/70` thinking it would be "better"
- Actually, the original subtle gray-on-blue created a sophisticated, layered look
- The white text made it harsh and broke the visual hierarchy

## Key Insight

**Don't fix things that aren't broken.** The original design (v16 commit 6113289) achieved the professional look through subtle color choices, not through maximizing contrast. WCAG compliance is good, but readability and visual elegance sometimes come from intentional color hierarchy, not maximum contrast.

## When Making Changes

- Leave the Footer component alone — it's correct as-is in v16
- Leave the Newsletter signup alone — it's correct as-is in v16
- Leave the color system alone — it works
- Leave the typography alone — it works

Only modify if there's a REAL bug (functionality broken), not perceived visual "issues."

## How to Apply This

**Never**:
- Add more white/lighter colors to dark footer sections
- Increase contrast beyond what v16 has
- Change text-text-muted to white/70 or similar

**Always**:
- Trust the original design choices
- Remember v16 looks good to the user
- When you see "contrast issues," verify they're actually problems first
