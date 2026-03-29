import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { HolidayCountdown } from "@/components/ui/HolidayCountdown";
import { HolidayGuide } from "@/components/ui/HolidayGuide";
import { getLatvianMonthGenitive, getLatvianWeekday } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [holiday] = await db
    .select()
    .from(holidays)
    .where(eq(holidays.slug, slug))
    .limit(1);

  if (!holiday) return {};

  return {
    title: `${holiday.name} — svētku diena Latvijā`,
    description: `Uzzini par ${holiday.name} — kad tā ir, tradīcijas un vēsture. ${holiday.isPublicHoliday ? "Valsts svētku diena (brīvdiena)." : "Ievērojama diena Latvijā."}`,
  };
}

export default async function HolidayPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [holiday] = await db
    .select()
    .from(holidays)
    .where(eq(holidays.slug, slug))
    .limit(1);

  if (!holiday) {
    notFound();
  }

  // Compute dates for next 5 years
  const currentYear = new Date().getFullYear();
  const yearDates = holiday.yearDates
    ? (JSON.parse(holiday.yearDates) as Record<string, string>)
    : null;

  const futureDates: { year: number; date: Date; weekday: string }[] = [];
  for (let y = currentYear; y <= currentYear + 4; y++) {
    let date: Date | null = null;
    if (holiday.dateMonth && holiday.dateDay) {
      date = new Date(y, holiday.dateMonth - 1, holiday.dateDay);
    } else if (yearDates?.[String(y)]) {
      date = new Date(yearDates[String(y)]);
    }
    if (date) {
      futureDates.push({
        year: y,
        date,
        weekday: getLatvianWeekday(date.getDay()),
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Sākums
        </Link>
        <span className="mx-1">/</span>
        <Link href="/svetku-dienas" className="hover:text-primary">
          Svētku dienas
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">{holiday.name}</span>
      </nav>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-2">
        {holiday.name}
      </h1>

      {holiday.isPublicHoliday === 1 && (
        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mb-6">
          Valsts svētku diena (brīvdiena)
        </span>
      )}

      {/* Countdown to next occurrence */}
      {futureDates[0] && (
        <HolidayCountdown
          targetDate={`${futureDates[0].year}-${String(futureDates[0].date.getMonth() + 1).padStart(2, "0")}-${String(futureDates[0].date.getDate()).padStart(2, "0")}`}
          holidayName={holiday.name}
        />
      )}

      {/* Description */}
      {holiday.description && (
        <section className="mb-8">
          <div
            className="article-content text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: holiday.description }}
          />
        </section>
      )}

      {/* Traditions */}
      {holiday.traditions && (
        <section className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-3">Tradīcijas</h2>
          <div
            className="article-content text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: holiday.traditions }}
          />
        </section>
      )}

      {/* Celebration guide */}
      <HolidayGuide
        slug={holiday.slug}
        holidayName={holiday.name}
        hasExistingTraditions={!!holiday.traditions && holiday.traditions.length > 100}
      />

      {/* Future dates table */}
      {futureDates.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-3">
            Kad ir {holiday.name}?
          </h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-secondary">
                    Gads
                  </th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-secondary">
                    Datums
                  </th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-secondary">
                    Nedēļas diena
                  </th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-secondary">
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {futureDates.map(({ year, date, weekday }) => (
                  <tr key={year} className="hover:bg-bg-secondary">
                    <td className="px-4 py-2 font-medium">{year}</td>
                    <td className="px-4 py-2">
                      {date.getDate()}.{" "}
                      {getLatvianMonthGenitive(date.getMonth())}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {weekday}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a
                        href={`/api/calendar?slug=${holiday.slug}&year=${year}`}
                        className="text-xs text-primary hover:underline"
                        download
                      >
                        + Kalendārs
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Cross-links */}
      <section className="mb-8 border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Noderīgi rīki</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/svetku-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#128197; Visas svētku dienas
          </Link>
          <Link
            href="/algu-kalkulators"
            className="text-sm text-primary hover:underline"
          >
            &#128176; Algu kalkulators
          </Link>
          <Link
            href="/varda-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#127873; Vārda dienu kalendārs
          </Link>
        </div>
      </section>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Event",
              name: holiday.name,
              description: holiday.description.replace(/<[^>]+>/g, "").slice(0, 200),
              startDate: futureDates[0]
                ? `${futureDates[0].year}-${String(futureDates[0].date.getMonth() + 1).padStart(2, "0")}-${String(futureDates[0].date.getDate()).padStart(2, "0")}`
                : undefined,
              location: {
                "@type": "Country",
                name: "Latvija",
                addressCountry: "LV",
              },
              organizer: {
                "@type": "Organization",
                name: "Latvijas Republika",
              },
              eventStatus: "https://schema.org/EventScheduled",
              inLanguage: "lv",
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Sākums",
                  item: "https://tavadiena.lv",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Svētku dienas",
                  item: "https://tavadiena.lv/svetku-dienas",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: holiday.name,
                  item: `https://tavadiena.lv/svetku-dienas/${holiday.slug}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
