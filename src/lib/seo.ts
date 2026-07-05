// Shared OpenGraph/JSON-LD constants.
// Next.js shallow-merges metadata per top-level key: a page that defines its
// own `openGraph` object REPLACES the layout's entirely (losing siteName,
// locale, type, images). Any page-level `openGraph` must spread OG_DEFAULTS
// back in and set its own `url` (relative paths resolve via metadataBase).
import { SITE_URL, BRAND } from "@/lib/brand";

export const OG_DEFAULTS = {
  type: "website",
  locale: BRAND.locale,
  siteName: BRAND.name,
} as const;

export const OG_DEFAULT_IMAGE = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: `${BRAND.name} — ${BRAND.tagline}`,
} as const;

// Publisher node reused by Article/WebPage JSON-LD across pages.
export const PUBLISHER_JSONLD = {
  "@type": "Organization",
  name: BRAND.name,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icons/logo-512.png`,
    width: 512,
    height: 512,
  },
} as const;
