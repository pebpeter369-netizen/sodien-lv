import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TavaDiena.lv — Aktuālā informācija Latvijā",
    short_name: "TavaDiena",
    description: "Aktuālākā informācija Latvijā — vārda dienas, algu kalkulators, svētku dienas un aktualitātes.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a365d",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
