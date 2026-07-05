"use client";

import { useEffect } from "react";

// Fires a view-count beacon on mount so the article page itself can stay
// static (ISR) — the DB write happens in /api/views, not during render.
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const payload = JSON.stringify({ slug });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/views", payload)) {
        return;
      }
    } catch {
      // fall through to fetch
    }
    fetch("/api/views", {
      method: "POST",
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
