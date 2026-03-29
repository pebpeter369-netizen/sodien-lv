import Link from "next/link";
import { getDb } from "@/lib/db";
import { holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getLatvianWeekday } from "@/lib/dates";

const LATVIAN_MONTHS_SHORT = [
  "jan.",
  "feb.",
  "mar.",
  "apr.",
  "mai.",
  "jūn.",
  "jūl.",
  "aug.",
  "sep.",
  "okt.",
  "nov.",
  "dec.",
];

interface UpcomingHoliday {
  name: string;
  slug: string;
  date: Date;
}

function getUpcomingHolidays(): UpcomingHoliday[] {
  const db = getDb();
  const now = new Date();
  const year = now.getFullYear();

  const allHolidays = db
    .select()
    .from(holidays)
    .where(eq(holidays.isPublicHoliday, 1))
    .all();

  const upcoming: UpcomingHoliday[] = [];

  for (const h of allHolidays) {
    let date: Date | null = null;

    // Check yearDates first (for moveable holidays like Easter)
    if (h.yearDates) {
      try {
        const yearDates = JSON.parse(h.yearDates) as Record<string, string>;
        const dateStr = yearDates[String(year)] || yearDates[String(year + 1)];
        if (dateStr) {
          date = new Date(dateStr + "T00:00:00");
        }
      } catch {
        // ignore
      }
    }

    // Fall back to fixed dateMonth/dateDay
    if (!date && h.dateMonth && h.dateDay) {
      date = new Date(year, h.dateMonth - 1, h.dateDay);
      if (date < now) {
        date = new Date(year + 1, h.dateMonth - 1, h.dateDay);
      }
    }

    if (date && date >= now) {
      upcoming.push({ name: h.name, slug: h.slug, date });
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming.slice(0, 3);
}

export function UpcomingHolidays() {
  const upcoming = getUpcomingHolidays();

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">&#128197;</span>
        <h2 className="font-heading font-semibold text-lg">Tuvākie svētki</h2>
      </div>
      {upcoming.length > 0 ? (
        <ul className="space-y-2.5">
          {upcoming.map((h) => (
            <li key={h.slug}>
              <Link
                href={`/svetku-dienas/${h.slug}`}
                className="flex items-center justify-between text-sm hover:text-primary transition-colors group"
              >
                <span className="font-medium group-hover:text-primary truncate mr-2">
                  {h.name}
                </span>
                <span className="text-text-muted text-xs shrink-0">
                  {h.date.getDate()}.{" "}
                  {LATVIAN_MONTHS_SHORT[h.date.getMonth()]}{" "}
                  <span className="hidden sm:inline">
                    ({getLatvianWeekday(h.date.getDay())})
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">Nav tuvu svētku</p>
      )}
      <Link
        href="/svetku-dienas"
        className="block mt-3 text-sm text-primary hover:underline text-center"
      >
        Visi svētki →
      </Link>
    </div>
  );
}
