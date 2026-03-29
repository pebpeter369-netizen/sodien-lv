import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { holidays as holidaysTable } from "@/lib/schema";
import { getEasterDate, getTodayInLatvia } from "@/lib/dates";
import nameDaysData from "@/data/name-days.json";
import workCalendarData from "@/data/work-calendar.json";
import AnnualCalendar from "./AnnualCalendar";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Darba dienu kalendārs 2026 — Svētku dienas un brīvdienas Latvijā",
  description:
    "Interaktīvs darba dienu kalendārs ar visām Latvijas svētku dienām, brīvdienām, pārceltajām darba dienām un darba stundu skaitu pa mēnešiem. Plāno atvaļinājumu un uzzini, kad ir garās brīvdienas.",
  keywords: [
    "darba dienu kalendārs",
    "darba dienu kalendārs 2026",
    "svētku dienas 2026",
    "brīvdienas Latvijā",
    "pārceltās darba dienas",
    "darba dienas",
    "darba stundas",
    "atvaļinājuma plānošana",
    "kalendārs 2026",
    "pirmssvētku saīsinātās dienas",
  ],
};

interface HolidayInfo {
  name: string;
  slug: string;
  isPublicHoliday: boolean;
}

function resolveHolidayDate(
  holiday: {
    dateMonth: number | null;
    dateDay: number | null;
    dateRule: string | null;
    yearDates: string | null;
  },
  year: number
): { month: number; day: number } | null {
  // Fixed date holidays
  if (holiday.dateMonth && holiday.dateDay) {
    return { month: holiday.dateMonth, day: holiday.dateDay };
  }

  // Variable holidays with yearDates lookup
  if (holiday.yearDates) {
    try {
      const parsed = JSON.parse(holiday.yearDates) as Record<string, string>;
      const dateStr = parsed[String(year)];
      if (dateStr) {
        const d = new Date(dateStr);
        return { month: d.getMonth() + 1, day: d.getDate() };
      }
    } catch {
      // fall through to dateRule
    }
  }

  // Compute from dateRule
  if (holiday.dateRule) {
    const easter = getEasterDate(year);
    const rule = holiday.dateRule;

    if (rule === "easter") {
      return { month: easter.getMonth() + 1, day: easter.getDate() };
    }

    const offsetMatch = rule.match(/^easter([+-]\d+)$/);
    if (offsetMatch) {
      const offset = parseInt(offsetMatch[1]);
      const d = new Date(easter);
      d.setDate(d.getDate() + offset);
      return { month: d.getMonth() + 1, day: d.getDate() };
    }

    // nth-weekday rules like "2nd-sunday-may"
    const nthMatch = rule.match(/^(\d+)(?:st|nd|rd|th)-(\w+)-(\w+)$/);
    if (nthMatch) {
      const nth = parseInt(nthMatch[1]);
      const weekdayName = nthMatch[2].toLowerCase();
      const monthName = nthMatch[3].toLowerCase();

      const monthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3,
        may: 4, june: 5, july: 6, august: 7,
        september: 8, october: 9, november: 10, december: 11,
      };
      const weekdayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
      };

      const m = monthMap[monthName];
      const wd = weekdayMap[weekdayName];
      if (m !== undefined && wd !== undefined) {
        let count = 0;
        for (let d = 1; d <= 31; d++) {
          const date = new Date(year, m, d);
          if (date.getMonth() !== m) break;
          if (date.getDay() === wd) {
            count++;
            if (count === nth) {
              return { month: m + 1, day: d };
            }
          }
        }
      }
    }
  }

  return null;
}

export default function DarbadienuKalendarsPage() {
  const today = getTodayInLatvia();
  const currentYear = today.getFullYear();
  const db = getDb();

  const allHolidays = db.select().from(holidaysTable).all();

  // Build holiday map for current year: "M-D" -> HolidayInfo[]
  const holidayMap: Record<string, HolidayInfo[]> = {};

  for (const h of allHolidays) {
    const resolved = resolveHolidayDate(h, currentYear);
    if (resolved) {
      const key = `${resolved.month}-${resolved.day}`;
      if (!holidayMap[key]) holidayMap[key] = [];
      holidayMap[key].push({
        name: h.name,
        slug: h.slug,
        isPublicHoliday: h.isPublicHoliday === 1,
      });
    }
  }

  // Load work calendar data for current year (transferred + shortened days)
  const yearKey = String(currentYear) as keyof typeof workCalendarData;
  const yearWorkCalendar = workCalendarData[yearKey] ?? null;

  const siteUrl = process.env.SITE_URL || "https://tavadiena.lv";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `Darba dienu kalendārs ${currentYear}`,
            description: `Interaktīvs ${currentYear}. gada darba dienu kalendārs ar svētku dienām, pārceltajām darba dienām un darba stundu skaitu Latvijā.`,
            url: `${siteUrl}/darba-dienu-kalendars`,
            inLanguage: "lv",
            isPartOf: {
              "@type": "WebSite",
              name: "TavaDiena.lv",
              url: siteUrl,
            },
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">
            Darba dienu kalendārs {currentYear}
          </h1>
          <p className="mt-2 text-text-secondary max-w-2xl">
            Interaktīvs gada kalendārs ar visām Latvijas svētku dienām,
            pārceltajām darba dienām un pirmssvētku saīsinātajām dienām.
            Darba dienas un stundas pa mēnešiem aprēķinātas saskaņā ar Darba
            likumu un MK rīkojumu.
          </p>
        </div>

        <AnnualCalendar
          year={currentYear}
          holidays={holidayMap}
          nameDays={
            nameDaysData as { month: number; day: number; names: string[] }[]
          }
          workCalendar={yearWorkCalendar}
        />

        {/* SEO text */}
        <div className="mt-12 prose prose-sm max-w-none text-text-secondary">
          <h2 className="text-lg font-heading font-bold text-primary">
            Par darba dienu kalendāru
          </h2>
          <p>
            Darba dienu kalendārs veidots, lai palīdzētu noteikt darba dienu
            skaitu mēnesī un atspoguļot svētku dienas, ņemot vērā pēdējās
            likumdošanas izmaiņas. Tiek attēlotas darba dienas, pirmssvētku
            saīsinātās dienas, pārceltās darba dienas, kā arī pārējamās darba
            dienas valsts un pašvaldību iestādēs.
          </p>
          <p>
            Saskaņā ar Darba likuma 133. panta ceturto daļu, ja darba diena
            iekrīt starp svētku dienu un nedēļas atpūtas laiku, darba devējs var
            pārcelt šo darba dienu uz sestdienu tajā pašā mēnesī. Pirmssvētku
            dienās darba laiks ir saīsināts par vienu stundu (7 stundas 8 stundu
            vietā) saskaņā ar Darba likuma 135. pantu.
          </p>
          <p>
            Latvijā {currentYear}. gadā ir{" "}
            <strong>
              {Object.values(holidayMap).reduce(
                (sum, hols) =>
                  sum + (hols.some((h) => h.isPublicHoliday) ? 1 : 0),
                0
              )}{" "}
              oficiālas svētku dienas
            </strong>{" "}
            (brīvdienas), kurās darba devējam jānodrošina brīvdiena vai jāmaksā
            piemaksa saskaņā ar Darba likumu.
          </p>
        </div>
      </div>
    </>
  );
}
