/**
 * Generate daily newsletter HTML and plain text.
 * Usage: npx tsx src/scripts/generate-newsletter.ts [--text]
 *
 * Outputs HTML to stdout by default.
 * Pass --text for plain text version.
 */

import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc, gte } from "drizzle-orm";
import * as schema from "../lib/schema";
import nameDaysData from "../data/name-days.json";

const BASE_URL = "https://tavadiena.lv";

const LATVIAN_MONTHS_GENITIVE = [
  "janvāra", "februāra", "marta", "aprīļa", "maija", "jūnija",
  "jūlija", "augusta", "septembra", "oktobra", "novembra", "decembra",
];

const LATVIAN_WEEKDAYS = [
  "Svētdiena", "Pirmdiena", "Otrdiena", "Trešdiena",
  "Ceturtdiena", "Piektdiena", "Sestdiena",
];

function formatDate(date: Date): string {
  const weekday = LATVIAN_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = LATVIAN_MONTHS_GENITIVE[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday}, ${year}. gada ${day}. ${month}`;
}

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

function getTodayNames(now: Date): string[] {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const entry = (nameDaysData as NameDayEntry[]).find(
    (nd) => nd.month === month && nd.day === day
  );
  return entry?.names ?? [];
}

function getNextHoliday(db: ReturnType<typeof drizzle>, now: Date) {
  const currentYear = now.getFullYear();
  const allHolidays = db.select().from(schema.holidays).all();

  let closest: { name: string; slug: string; daysUntil: number } | null = null;

  for (const h of allHolidays) {
    let targetDate: Date | null = null;

    // Check yearDates first
    if (h.yearDates) {
      try {
        const yearDates = JSON.parse(h.yearDates) as Record<string, string>;
        const dateStr = yearDates[String(currentYear)] || yearDates[String(currentYear + 1)];
        if (dateStr) {
          targetDate = new Date(dateStr);
        }
      } catch {}
    }

    // Fall back to dateMonth/dateDay
    if (!targetDate && h.dateMonth && h.dateDay) {
      targetDate = new Date(currentYear, h.dateMonth - 1, h.dateDay);
      if (targetDate <= now) {
        targetDate = new Date(currentYear + 1, h.dateMonth - 1, h.dateDay);
      }
    }

    if (!targetDate || targetDate <= now) continue;

    const diffDays = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!closest || diffDays < closest.daysUntil) {
      closest = { name: h.name, slug: h.slug, daysUntil: diffDays };
    }
  }

  return closest;
}

function main() {
  const textOnly = process.argv.includes("--text");
  const now = new Date();
  const dateFormatted = formatDate(now);

  const dbPath = path.join(process.cwd(), "data", "sodien.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite, { schema });

  // 1. Name days
  const names = getTodayNames(now);

  // 2. Next holiday
  const nextHoliday = getNextHoliday(db, now);

  // 3. Latest 3 articles
  const latestArticles = db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.status, "published"))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(3)
    .all();

  sqlite.close();

  if (textOnly) {
    outputPlainText(dateFormatted, names, nextHoliday, latestArticles);
  } else {
    outputHTML(dateFormatted, names, nextHoliday, latestArticles);
  }
}

function outputPlainText(
  dateFormatted: string,
  names: string[],
  nextHoliday: { name: string; slug: string; daysUntil: number } | null,
  articles: { slug: string; title: string; excerpt: string }[]
) {
  const lines: string[] = [];

  lines.push(`ŠODIEN LATVIJĀ — ${dateFormatted}`);
  lines.push("=".repeat(50));
  lines.push("");

  if (names.length > 0) {
    lines.push(`Šodien vārda dienu svin: ${names.join(", ")}`);
    for (const name of names) {
      lines.push(`  ${BASE_URL}/varda-dienas/${name.toLowerCase()}`);
    }
    lines.push("");
  }

  if (nextHoliday) {
    lines.push(
      `Nākamie svētki: ${nextHoliday.name} — pēc ${nextHoliday.daysUntil} dienām`
    );
    lines.push(`  ${BASE_URL}/svetku-dienas/${nextHoliday.slug}`);
    lines.push("");
  }

  if (articles.length > 0) {
    lines.push("JAUNĀKIE RAKSTI");
    lines.push("-".repeat(30));
    for (const a of articles) {
      lines.push("");
      lines.push(a.title);
      lines.push(a.excerpt);
      lines.push(`${BASE_URL}/aktualitates/${a.slug}`);
    }
    lines.push("");
  }

  lines.push("-".repeat(50));
  lines.push(`${BASE_URL} — Aktuālā informācija Latvijā`);
  lines.push("");
  lines.push("Lai atteiktos no jaunumiem: {{unsubscribe_url}}");

  process.stdout.write(lines.join("\n"));
}

function outputHTML(
  dateFormatted: string,
  names: string[],
  nextHoliday: { name: string; slug: string; daysUntil: number } | null,
  articles: { slug: string; title: string; excerpt: string }[]
) {
  const nameLinks = names
    .map(
      (n) =>
        `<a href="${BASE_URL}/varda-dienas/${n.toLowerCase()}" style="color:#1e40af;text-decoration:none;font-weight:600;">${n}</a>`
    )
    .join(", ");

  const articleBlocks = articles
    .map(
      (a) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <a href="${BASE_URL}/aktualitates/${a.slug}" style="color:#1e3a5f;text-decoration:none;font-size:16px;font-weight:600;">${escapeHtml(a.title)}</a>
          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">${escapeHtml(a.excerpt)}</p>
        </td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Šodien Latvijā — ${escapeHtml(dateFormatted)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#2d5a8e);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Šodien Latvijā</h1>
              <p style="margin:8px 0 0;color:#f59e0b;font-size:14px;">${escapeHtml(dateFormatted)}</p>
            </td>
          </tr>

          ${names.length > 0 ? `
          <!-- Name days -->
          <tr>
            <td style="padding:24px 24px 16px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Vārda dienas</p>
              <p style="margin:0;font-size:20px;color:#1e3a5f;">Šodien svin: ${nameLinks}</p>
            </td>
          </tr>` : ""}

          ${nextHoliday ? `
          <!-- Next holiday -->
          <tr>
            <td style="padding:16px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;color:#92400e;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Nākamie svētki</p>
                    <p style="margin:6px 0 0;font-size:16px;color:#1e3a5f;">
                      <a href="${BASE_URL}/svetku-dienas/${nextHoliday.slug}" style="color:#1e3a5f;text-decoration:none;font-weight:600;">${escapeHtml(nextHoliday.name)}</a>
                      <span style="color:#6b7280;"> — pēc ${nextHoliday.daysUntil} dienām</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          ${articles.length > 0 ? `
          <!-- Articles -->
          <tr>
            <td style="padding:16px 24px 24px;">
              <p style="margin:0 0 12px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Jaunākie raksti</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${articleBlocks}
              </table>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:14px;color:#1e3a5f;font-weight:600;">
                <a href="${BASE_URL}" style="color:#1e3a5f;text-decoration:none;">Šodien<span style="color:#f59e0b;">.lv</span></a>
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Aktuālā informācija Latvijā</p>
              <p style="margin:12px 0 0;font-size:12px;">
                <a href="{{unsubscribe_url}}" style="color:#9ca3af;text-decoration:underline;">Atteikties no jaunumiem</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  process.stdout.write(html);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
