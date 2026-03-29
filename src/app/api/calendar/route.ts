import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";

function formatICSDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const db = getDb();
  const [holiday] = await db
    .select()
    .from(holidays)
    .where(eq(holidays.slug, slug))
    .limit(1);

  if (!holiday) {
    return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
  }

  // Determine the date
  let eventDate: Date | null = null;

  if (holiday.yearDates) {
    try {
      const yearDates = JSON.parse(holiday.yearDates) as Record<string, string>;
      const dateStr = yearDates[String(year)];
      if (dateStr) eventDate = new Date(dateStr);
    } catch { /* ignore */ }
  }

  if (!eventDate && holiday.dateMonth && holiday.dateDay) {
    eventDate = new Date(year, holiday.dateMonth - 1, holiday.dateDay);
  }

  if (!eventDate) {
    return NextResponse.json({ error: "Cannot determine date" }, { status: 400 });
  }

  const nextDay = new Date(eventDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const description = holiday.description
    ? holiday.description.replace(/<[^>]+>/g, "").substring(0, 200)
    : "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TavaDiena.lv//Svetku dienas//LV",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${formatICSDate(eventDate)}`,
    `DTEND;VALUE=DATE:${formatICSDate(nextDay)}`,
    `SUMMARY:${escapeICS(holiday.name)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `URL:https://tavadiena.lv/svetku-dienas/${holiday.slug}`,
    holiday.isPublicHoliday ? "CATEGORIES:Valsts svētki" : "CATEGORIES:Ievērojama diena",
    `UID:${holiday.slug}-${year}@tavadiena.lv`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${holiday.slug}-${year}.ics"`,
    },
  });
}
