import nameDaysData from "@/data/name-days.json";
import { slugify } from "@/lib/latvian";
import { getLatvianMonth } from "@/lib/dates";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

const allEntries = nameDaysData as NameDayEntry[];

/**
 * 12 ASCII nominative month slugs, index 0 = janvaris … 11 = decembris.
 * Derived from the existing month names so there is a single source of truth.
 */
export const MONTH_SLUGS: string[] = Array.from({ length: 12 }, (_, i) =>
  slugify(getLatvianMonth(i))
);

// Fast "month-day" → names lookup for date/validation queries.
const namesByMonthDay = new Map<string, string[]>();
for (const entry of allEntries) {
  namesByMonthDay.set(`${entry.month}-${entry.day}`, entry.names);
}

/**
 * Resolve a month slug to a 0-based month index, or null if invalid.
 * Tolerant: accepts the canonical ASCII slug ("julijs") as well as variant
 * spellings a crawler or external link might use (real diacritics "jūlijs",
 * mixed case "Julijs") by normalizing through slugify — the page then 301s any
 * non-canonical form to the canonical slug, consolidating link signals.
 */
export function monthIndexFromSlug(slug: string): number | null {
  let index = MONTH_SLUGS.indexOf(slug);
  if (index === -1) index = MONTH_SLUGS.indexOf(slugify(slug));
  if (index === -1) {
    // Last resort: input may still be percent-encoded (e.g. "j%C5%ABlijs").
    try {
      index = MONTH_SLUGS.indexOf(slugify(decodeURIComponent(slug)));
    } catch {
      /* malformed encoding — leave as not found */
    }
  }
  return index === -1 ? null : index;
}

/** ASCII nominative slug for a 0-based month index (e.g. 6 → "julijs"). */
export function monthSlug(monthIndex0: number): string {
  return MONTH_SLUGS[monthIndex0];
}

/** Day-route slug, e.g. daySlug(5, 6) → "5-julijs". */
export function daySlug(day: number, monthIndex0: number): string {
  return `${day}-${MONTH_SLUGS[monthIndex0]}`;
}

/**
 * Parse a day-route slug ("5-julijs") into its day + 0-based month index.
 * Splits on the FIRST "-", requires a numeric day and a valid month slug, and
 * validates that the day actually exists in the calendar for that month.
 * Returns null on any failure (drives notFound()).
 */
export function parseDaySlug(
  slug: string
): { day: number; monthIndex0: number } | null {
  const sep = slug.indexOf("-");
  if (sep === -1) return null;

  const dayPart = slug.slice(0, sep);
  const monthPart = slug.slice(sep + 1);

  if (!/^\d+$/.test(dayPart)) return null;

  const monthIndex0 = monthIndexFromSlug(monthPart);
  if (monthIndex0 === null) return null;

  const day = Number(dayPart);
  if (!namesByMonthDay.has(`${monthIndex0 + 1}-${day}`)) return null;

  return { day, monthIndex0 };
}

/**
 * Names celebrating on a given date. `month1` is 1-based to match the JSON.
 * Returns [] when the date has no entry.
 */
export function getNamesForDate(month1: number, day: number): string[] {
  return namesByMonthDay.get(`${month1}-${day}`) ?? [];
}

/**
 * All calendar entries for a month, sorted by day. `month1` is 1-based.
 */
export function getMonthEntries(
  month1: number
): { day: number; names: string[] }[] {
  return allEntries
    .filter((entry) => entry.month === month1)
    .map((entry) => ({ day: entry.day, names: entry.names }))
    .sort((a, b) => a.day - b.day);
}

/** All 366 day-route params for generateStaticParams on the day route. */
export function allDayParams(): { datums: string }[] {
  return allEntries.map((entry) => ({
    datums: daySlug(entry.day, entry.month - 1),
  }));
}

/** All 12 month-route params for generateStaticParams on the month route. */
export function allMonthParams(): { menesis: string }[] {
  return MONTH_SLUGS.map((menesis) => ({ menesis }));
}
