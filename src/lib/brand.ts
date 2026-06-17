// Centralized brand configuration
// Change these values once when rebranding — all references pull from here

// Canonical production origin. Hardcoded on purpose: a stale/incorrect
// SITE_URL env once made robots.txt advertise the old sodien.lv domain.
// Everything SEO-facing (robots, sitemap, canonicals, JSON-LD) pulls from here.
export const SITE_URL = "https://tavadiena.lv";

// Build an absolute canonical URL for a given path ("/" → origin, no trailing slash).
export function canonical(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const BRAND = {
  name: "TavaDiena.lv",
  nameHtml: 'Tava<span class="text-accent">Diena</span>.lv',
  shortName: "TavaDiena",
  domain: "tavadiena.lv",
  url: SITE_URL,
  email: "info@tavadiena.lv",
  tagline: "Tava diena. Tava informācija.",
  description:
    "Latvijas ikdienas informācijas portāls — vārda dienas, algu kalkulators, svētku dienas un praktiski padomi.",
  descriptionShort:
    "Vārda dienas, algu kalkulators, svētku dienas un praktiski padomi Latvijā.",
  locale: "lv_LV",
  language: "lv",
  themeColor: "#1a365d",
} as const;
