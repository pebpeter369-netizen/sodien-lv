// Centralized brand configuration
// Change these values once when rebranding — all references pull from here

export const BRAND = {
  name: "TavaDiena.lv",
  nameHtml: 'Tava<span class="text-accent">Diena</span>.lv',
  shortName: "TavaDiena",
  domain: "tavadiena.lv",
  url: process.env.SITE_URL || "https://tavadiena.lv",
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
