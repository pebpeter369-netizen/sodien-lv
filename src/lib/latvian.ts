/**
 * Format a number in Latvian style: comma as decimal separator, space as thousands
 * Example: 1543.21 → "1 543,21"
 */
export function formatLatvianNumber(num: number, decimals = 2): string {
  const parts = num.toFixed(decimals).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decimals > 0 ? `${intPart},${parts[1]}` : intPart;
}

/**
 * Format currency in Latvian style
 * Example: 1543.21 → "€1 543,21"
 */
export function formatLatvianCurrency(amount: number, decimals = 2): string {
  return `€${formatLatvianNumber(amount, decimals)}`;
}

/**
 * Generate a URL-friendly slug from Latvian text
 */
export function slugify(text: string): string {
  const latvianMap: Record<string, string> = {
    ā: "a",
    č: "c",
    ē: "e",
    ģ: "g",
    ī: "i",
    ķ: "k",
    ļ: "l",
    ņ: "n",
    š: "s",
    ū: "u",
    ž: "z",
    Ā: "a",
    Č: "c",
    Ē: "e",
    Ģ: "g",
    Ī: "i",
    Ķ: "k",
    Ļ: "l",
    Ņ: "n",
    Š: "s",
    Ū: "u",
    Ž: "z",
  };

  return text
    .split("")
    .map((char) => latvianMap[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Capitalize first letter (handles Latvian characters)
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert a Latvian first name to genitive case (ģenitīvs).
 * Tamāra → Tamāras, Jānis → Jāņa, Pēteris → Pētera, Ance → Ances
 */
export function genitive(name: string): string {
  // 4th/5th declension feminine: -a → -as, -e → -es
  if (name.endsWith("a") || name.endsWith("ā")) return name + "s";
  if (name.endsWith("e") || name.endsWith("ē")) return name + "s";

  // 2nd declension masculine: -is → palatalize + a
  if (name.endsWith("is")) {
    const stem = name.slice(0, -2);
    const last = stem[stem.length - 1];
    const palatal: Record<string, string> = {
      n: "ņ",
      l: "ļ",
      t: "š",
      d: "ž",
      s: "š",
      z: "ž",
      c: "č",
    };
    if (palatal[last]) {
      return stem.slice(0, -1) + palatal[last] + "a";
    }
    return stem + "a";
  }

  // 1st declension masculine: -s → -a (Pēters → Pētera, Edgars → Edgara)
  if (name.endsWith("s")) return name.slice(0, -1) + "a";

  // Fallback (indeclinable or unknown)
  return name;
}
