import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  getLatvianWeekday,
  getLatvianMonthGenitive,
  getEasterDate,
  getTodayInLatvia,
} from "@/lib/dates";
import nameDaysData from "@/data/name-days.json";
import workCalendarData from "@/data/work-calendar.json";
import AnnualCalendar from "@/app/darba-dienu-kalendars/AnnualCalendar";

const currentYear = new Date().getFullYear();

interface HolidayCalInfo {
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
  if (holiday.dateMonth && holiday.dateDay) {
    return { month: holiday.dateMonth, day: holiday.dateDay };
  }
  if (holiday.yearDates) {
    try {
      const parsed = JSON.parse(holiday.yearDates) as Record<string, string>;
      const dateStr = parsed[String(year)];
      if (dateStr) {
        const d = new Date(dateStr);
        return { month: d.getMonth() + 1, day: d.getDate() };
      }
    } catch {
      // fall through
    }
  }
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
    const nthMatch = rule.match(/^(\d+)(?:st|nd|rd|th)-(\w+)-(\w+)$/);
    if (nthMatch) {
      const nth = parseInt(nthMatch[1]);
      const weekdayName = nthMatch[2].toLowerCase();
      const monthName = nthMatch[3].toLowerCase();
      const monthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
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
            if (count === nth) return { month: m + 1, day: d };
          }
        }
      }
    }
  }
  return null;
}

export const metadata: Metadata = {
  title: `Svētku dienas Latvijā ${currentYear} — brīvdienas, datumi un tradīcijas`,
  description: `Pilns Latvijas svētku dienu un brīvdienu saraksts ${currentYear}. gadam. Uzzini kad ir nākamie svētki, garās brīvdienas, ievērojamas dienas un latviskās tradīcijas katram svētkam.`,
};

export const revalidate = 86400; // 24 hours

function getNextHolidayDate(
  holiday: {
    dateMonth: number | null;
    dateDay: number | null;
    yearDates: string | null;
  },
  year: number
): Date | null {
  if (holiday.dateMonth && holiday.dateDay) {
    return new Date(year, holiday.dateMonth - 1, holiday.dateDay);
  }
  if (holiday.yearDates) {
    const parsed = JSON.parse(holiday.yearDates) as Record<string, string>;
    const dateStr = parsed[String(year)];
    if (dateStr) return new Date(dateStr);
  }
  return null;
}

export default async function HolidaysPage() {
  const db = getDb();
  const allHolidays = await db.select().from(holidays);

  const now = getTodayInLatvia();
  const currentYear = now.getFullYear();

  // Build holiday map for calendar component
  const holidayMap: Record<string, HolidayCalInfo[]> = {};
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

  const yearKey = String(currentYear) as keyof typeof workCalendarData;
  const yearWorkCalendar = workCalendarData[yearKey] ?? null;

  // Separate public holidays and notable days
  const publicHolidays = allHolidays.filter((h) => h.isPublicHoliday === 1);
  const notableDays = allHolidays.filter((h) => h.isPublicHoliday === 0);

  // Find next upcoming holiday
  type HolidayWithDate = (typeof allHolidays)[0] & { nextDate: Date };
  const withDates: HolidayWithDate[] = publicHolidays
    .map((h) => {
      let nextDate = getNextHolidayDate(h, currentYear);
      if (nextDate && nextDate < now) {
        nextDate = getNextHolidayDate(h, currentYear + 1);
      }
      return nextDate ? { ...h, nextDate } : null;
    })
    .filter((h): h is HolidayWithDate => h !== null)
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

  const nextHoliday = withDates[0];
  const daysUntilNext = nextHoliday
    ? Math.ceil(
        (nextHoliday.nextDate.getTime() - now.getTime()) / 86400000
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-center text-text mb-3">
        Svētku dienas Latvijā {currentYear}
      </h1>
      <p className="text-center text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
        Latvijā ir {publicHolidays.length} valsts svētku dienas, kurās darba
        devējiem ir pienākums nodrošināt darbinieku brīvdienu vai izmaksāt
        paaugstinātu atalgojumu. Papildus valsts svētkiem tiek atzīmētas
        vairākas ievērojamas dienas, kas ir nozīmīgas kultūras un vēstures
        ziņā. Šajā lapā atradīsi pilnu sarakstu ar visām Latvijas brīvdienām
        un svētku dienām {currentYear}. gadam ar precīziem datumiem, nedēļas
        dienām un tradīciju aprakstiem.
      </p>

      {/* Next holiday countdown */}
      {nextHoliday && (
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-8 text-center mb-8">
          <p className="text-accent-light text-sm font-medium mb-2">
            Nākamie svētki
          </p>
          <p className="text-2xl sm:text-3xl font-heading font-bold mb-2">
            {nextHoliday.name}
          </p>
          <p className="text-4xl font-heading font-bold text-accent-light">
            {daysUntilNext === 0
              ? "Šodien!"
              : `pēc ${daysUntilNext} ${daysUntilNext === 1 ? "dienas" : "dienām"}`}
          </p>
          <p className="text-sm opacity-80 mt-2">
            {nextHoliday.nextDate.getDate()}.{" "}
            {getLatvianMonthGenitive(nextHoliday.nextDate.getMonth())},{" "}
            {getLatvianWeekday(nextHoliday.nextDate.getDay())}
          </p>
        </div>
      )}

      {/* Public holidays */}
      <section className="mt-8">
        <h2 className="font-heading text-2xl font-bold mb-4">
          Valsts svētku dienas {currentYear}
        </h2>
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {publicHolidays.map((holiday) => {
            const date = getNextHolidayDate(holiday, currentYear);
            return (
              <Link
                key={holiday.id}
                href={`/svetku-dienas/${holiday.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary transition-colors"
              >
                <div>
                  <span className="font-medium text-text">{holiday.name}</span>
                </div>
                {date && (
                  <span className="text-sm text-text-muted whitespace-nowrap ml-4">
                    {date.getDate()}.{" "}
                    {getLatvianMonthGenitive(date.getMonth())}
                    {" — "}
                    {getLatvianWeekday(date.getDay())}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Notable days */}
      {notableDays.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-2xl font-bold mb-4">
            Citas ievērojamas dienas
          </h2>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {notableDays.map((holiday) => {
              const date = getNextHolidayDate(holiday, currentYear);
              return (
                <Link
                  key={holiday.id}
                  href={`/svetku-dienas/${holiday.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary transition-colors"
                >
                  <span className="text-text">{holiday.name}</span>
                  {date && (
                    <span className="text-sm text-text-muted whitespace-nowrap ml-4">
                      {date.getDate()}.{" "}
                      {getLatvianMonthGenitive(date.getMonth())}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Annual Calendar */}
      <section className="mt-12">
        <h2 className="font-heading text-2xl font-bold mb-4">
          Darba dienu kalendārs {currentYear}
        </h2>
        <p className="text-text-secondary mb-6 leading-relaxed">
          Interaktīvs gada kalendārs ar visām svētku dienām, pārceltajām darba
          dienām un pirmssvētku saīsinātajām dienām. Uzvelc peli uz dienas, lai
          redzētu detaļas.
        </p>
        <AnnualCalendar
          year={currentYear}
          holidays={holidayMap}
          nameDays={
            nameDaysData as { month: number; day: number; names: string[] }[]
          }
          workCalendar={yearWorkCalendar}
        />
      </section>

      {/* FAQ */}
      <section className="mt-12 max-w-3xl mx-auto">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Biežāk uzdotie jautājumi par svētku dienām
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Cik valsts svētku dienu ir Latvijā?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Latvijā ir {publicHolidays.length} oficiālas valsts svētku dienas,
              kurās darbiniekiem ir tiesības uz brīvdienu. Dažas no tām ir ar
              fiksētu datumu (piemēram, Jāņi — 24. jūnijs), bet citas ir
              mainīgas un katru gadu iekrīt citā datumā (piemēram, Lieldienas,
              kuru datums ir atkarīgs no Lieldienu aprēķina formulas).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Vai svētku dienā drīkst strādāt?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Jā, darba devējs var noteikt darbu svētku dienā, taču saskaņā ar
              Latvijas Darba likumu par darbu svētku dienā darbiniekam pienākas
              dubults atalgojums. Alternatīvi darba devējs var vienoties ar
              darbinieku par apmaksātu atpūtas dienu citā laikā.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kas notiek, ja svētku diena iekrīt brīvdienā?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Ja svētku diena iekrīt sestdienā vai svētdienā, nākamā darba
              diena (parasti pirmdiena) kļūst par brīvdienu. Šis noteikums
              attiecas uz visām valsts svētku dienām un ir noteikts Latvijas
              Darba likumā. Tas nozīmē, ka darbinieki nekad nezaudē brīvdienu
              tikai tāpēc, ka svētki iekrīt nedēļas nogalē.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kāds ir atalgojums par darbu svētku dienā Latvijā?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Saskaņā ar Darba likuma 68. pantu par darbu svētku dienā
              darbiniekam pienākas piemaksa ne mazāk kā 100% apmērā no
              noteiktās stundas vai dienas algas likmes. Izmanto mūsu{" "}
              <Link
                href="/algu-kalkulators"
                className="text-primary hover:underline"
              >
                algu kalkulatoru
              </Link>
              , lai aprēķinātu savu pamatalgu.
            </p>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mt-8 max-w-3xl mx-auto border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Noderīgi rīki</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/algu-kalkulators"
            className="text-sm text-primary hover:underline"
          >
            &#128176; Algu kalkulators — aprēķini bruto un neto
          </Link>
          <Link
            href="/varda-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#127873; Vārda dienu kalendārs
          </Link>
        </div>
      </section>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Cik valsts svētku dienu ir Latvijā?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Latvijā ir ${publicHolidays.length} oficiālas valsts svētku dienas, kurās darbiniekiem ir tiesības uz brīvdienu.`,
                },
              },
              {
                "@type": "Question",
                name: "Vai svētku dienā drīkst strādāt?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Jā, taču saskaņā ar Darba likumu par darbu svētku dienā darbiniekam pienākas dubults atalgojums.",
                },
              },
              {
                "@type": "Question",
                name: "Kas notiek, ja svētku diena iekrīt brīvdienā?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Ja svētku diena iekrīt sestdienā vai svētdienā, nākamā darba diena kļūst par brīvdienu.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
