"use client";

import dynamic from "next/dynamic";

const StreakBanner = dynamic(
  () => import("@/components/ui/StreakCounter").then((m) => m.StreakBanner),
  { ssr: false }
);

export function ClientStreakBanner() {
  return <StreakBanner />;
}
