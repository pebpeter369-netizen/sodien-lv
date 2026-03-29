import { format } from "date-fns";
import { lv } from "date-fns/locale";

const LATVIAN_MONTHS_GENITIVE = [
  "janvāra",
  "februāra",
  "marta",
  "aprīļa",
  "maija",
  "jūnija",
  "jūlija",
  "augusta",
  "septembra",
  "oktobra",
  "novembra",
  "decembra",
];

const LATVIAN_MONTHS = [
  "Janvāris",
  "Februāris",
  "Marts",
  "Aprīlis",
  "Maijs",
  "Jūnijs",
  "Jūlijs",
  "Augusts",
  "Septembris",
  "Oktobris",
  "Novembris",
  "Decembris",
];

const LATVIAN_WEEKDAYS = [
  "Svētdiena",
  "Pirmdiena",
  "Otrdiena",
  "Trešdiena",
  "Ceturtdiena",
  "Piektdiena",
  "Sestdiena",
];

/**
 * Get current date in Latvia timezone (Europe/Riga).
 * This ensures consistent date handling across server and client.
 */
export function getTodayInLatvia(): Date {
  const now = new Date();
  const latviaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Riga" })
  );
  // Reset time to midnight for consistent day comparison
  return new Date(
    latviaTime.getFullYear(),
    latviaTime.getMonth(),
    latviaTime.getDate()
  );
}

export function formatLatvianDate(date: Date): string {
  const day = date.getDate();
  const month = LATVIAN_MONTHS_GENITIVE[date.getMonth()];
  return `${day}. ${month}`;
}

export function formatLatvianDateFull(date: Date): string {
  const year = date.getFullYear();
  const day = date.getDate();
  const month = LATVIAN_MONTHS_GENITIVE[date.getMonth()];
  return `${year}. gada ${day}. ${month}`;
}

export function formatLatvianDateWithWeekday(date: Date): string {
  const weekday = LATVIAN_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = LATVIAN_MONTHS_GENITIVE[date.getMonth()];
  return `${weekday}, ${day}. ${month}`;
}

export function getLatvianMonth(monthIndex: number): string {
  return LATVIAN_MONTHS[monthIndex];
}

export function getLatvianMonthGenitive(monthIndex: number): string {
  return LATVIAN_MONTHS_GENITIVE[monthIndex];
}

export function getLatvianWeekday(dayIndex: number): string {
  return LATVIAN_WEEKDAYS[dayIndex];
}

export function daysUntil(targetMonth: number, targetDay: number): number {
  const today = getTodayInLatvia();
  let target = new Date(today.getFullYear(), targetMonth - 1, targetDay);

  if (target < today) {
    target = new Date(today.getFullYear() + 1, targetMonth - 1, targetDay);
  }

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "tikko";
  if (diffMin < 60) return `pirms ${diffMin} min`;
  if (diffHours < 24) return `pirms ${diffHours} st`;
  if (diffDays === 1) return "vakar";
  if (diffDays < 7) return `pirms ${diffDays} dienām`;
  return formatLatvianDate(date);
}

export function getEasterDate(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
