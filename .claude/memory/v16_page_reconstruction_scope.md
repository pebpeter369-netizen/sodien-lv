---
name: v16 Complete Page Reconstruction Scope
description: Detailed breakdown of all page structure differences between current code and v16 that need to be rebuilt
type: project
---

# v16 Complete Reconstruction Scope

## Current Status
- ✅ Color system fixed (accents: #fbbf24/#fcd34d/#f59e0b)
- ❌ Build broken (pre-existing: "TypeError: generate is not a function")
- ❌ Page structures don't match v16

## Pages & Sections Needed

### 1. HOMEPAGE (page.tsx) — 7 SECTIONS
**Current:** 2 sections (hero + features grid)
**v16:**
1. Name days highlight bar (bg-[#faf8f3], accent borders)
   - Shows today's names: Ilgmaris, Ilgmars, Larisa, etc.
   - Link to calendar
2. **Salary calculator preview** (featured tool section)
3. **Holy day section** (Svētdiena, 29. marta)
   - Save names feature for family/friends
4. **Today in History** (Šodien vēsturē) - historical events
5. **Articles grid** (5-column layout)
   - Recent news/articles with images
6. **Newsletter signup** (Saņem ikdienas apskatu e-pastā)
7. **Footer** (navigation + info)

### 2. ALGU KALKULATORS (algu-kalkulators/page.tsx) — 6 SECTIONS
**Current:** Likely simplified
**v16:**
- H1: "Algu kalkulators 2026"
- Calculator input section
- Section: "Nodokļu likmes Latvijā 2026. gadā" (tax rates)
  - Grid: 2-col layout
- Section: "Algu sadalījums Latvijā 2026. gadā" (salary distribution)
  - Has charts/graphs
- Section: "Biežāk uzdotie jautājumi" (FAQ)
- Grid layouts: 1-col, 2-col, 1-col, 2-col

### 3. VĀRDA DIENU KALENDĀRS (varda-dienas/page.tsx) — 6 SECTIONS
**Current:** Likely simplified
**v16:**
- H1: "Vārda dienu kalendārs 2026"
- Calendar/grid display (interactive)
- Section: "Biežāk uzdotie jautājumi par vārda dienām" (FAQ)
  - 2-col grid
- Section: "Saņem ikdienas apskatu e-pastā" (newsletter)
- Grid layouts: 1-col, 2-col

### 4. SVĒTKU DIENAS (svetku-dienas/page.tsx) — 5 SECTIONS
**Current:** Likely simplified
**v16:**
- H1: "Svētku dienas Latvijā 2026"
- Section: "Valsts svētku dienas 2026"
- Section: "Citas ievērojamas dienas"
- Section: "Darba dienu kalendārs 2026"
  - 7-col layout (week grid)
- Grid layouts: 1-col, 2-col, 3-col, 4-col, 7-col

### 5. DARBA DIENU KALENDĀRS (darba-dienu-kalendars/page.tsx) — COMPLEX
**v16:**
- H1: "Darba dienu kalendārs 2026"
- Annual calendar display (7-col grid = week layout)
- H2: "2026. gads"
- H2: "Par darba dienu kalendāru"
- Multiple grid layouts for different views

### 6. ARTICLE PAGES (aktualitates/[slug]/page.tsx) — 2 SECTIONS
**Current:** Likely simplified
**v16:**
- Main article content
- Related articles section
- Structured article display with images

### 7. OTHER PAGES
- Einzelne Artikel: 2 sections
- About page (par-mums)
- Privacy policy (privatuma-politika)
- Search page (meklet)
- Individual topic pages (temas/[topic])

## Components Missing/Needed
- [ ] Name highlight bar component
- [ ] "Today in History" component
- [ ] Articles grid/carousel component
- [ ] Newsletter signup form
- [ ] Tax rates visualization
- [ ] Salary distribution charts
- [ ] Interactive calendar components
- [ ] Enhanced FAQ sections

## Build Blocker
Current: `TypeError: generate is not a function`
- Prevents any local testing/verification
- Need to fix BEFORE reconstruction can be validated

## Implementation Strategy
**Option A:** Fix build first, then reconstruct
**Option B:** Reconstruct in parallel (can't test locally)
**Option C:** Focus on most visible sections first (newsletter, articles, name highlight)

## Effort Estimate
- **Colors only:** ✅ Done (1 hour)
- **Homepage + key pages:** 4-6 hours
- **Full page-by-page match:** 8-12 hours
- **Build fix + full deployment:** 2-4 hours additional
