import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

// Dynamic so the output can never be baked to a stale domain at build time.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/meklet"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
