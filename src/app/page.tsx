import Link from "next/link";
import { getDb } from "@/lib/db";
import { articles, holidays } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getTodayInLatvia, getLatvianWeekday, getLatvianMonthGenitive } from "@/lib/dates";
import nameDaysData from "@/data/name-days.json";
import Image from "next/image";
import readingTime from "reading-time";
import { TopicBadge } from "@/components/ui/TopicBadge";
import { NewsletterSignup } from "@/components/ui/NewsletterSignup";
import type { ArticleTopic } from "@/types";
import { timeAgo } from "@/lib/dates";
import { HomepageToolCards } from "@/components/ui/HomepageToolCards";

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

interface HistoricalEvent {
  year: number;
  event: string;
}

const LATVIAN_MONTHS_SHORT = [
  "jan.", "feb.", "mar.", "apr.", "mai.", "jūn.",
  "jūl.", "aug.", "sep.", "okt.", "nov.", "dec.",
];

// Historical events for "today in history"
const historicalEvents: HistoricalEvent[] = [
  { year: 1918, event: "Vācu okupācijas iestādes Rīgā oficiāli atļauj veidot Vidzemes, Latgales un Kurzemes apvienoto landesrādu (Zemes padomi). Tas bija solis uz vācu atbalstītas Baltijas hercogistes izveidi, kas konkurēja ar latviešu centieniem pēc neatkarības." },
  { year: 1945, event: "Sākās Otrais Pasaules Karš Eiropā. Šis bija kritisks moments Latvijas vēsturē." },
  { year: 1990, event: "Latvija pieņem deklarāciju par neatkarības atjaunošanu." },
];

function getNextHoliday() {
  const db = getDb();
  const now = new Date();
  const year = now.getFullYear();

  const allHolidays = db
    .select()
    .from(holidays)
    .where(eq(holidays.isPublicHoliday, 1))
    .all();

  let closest: { name: string; slug: string; date: Date; daysUntil: number } | null = null;

  for (const h of allHolidays) {
    let date: Date | null = null;

    if (h.yearDates) {
      try {
        const yearDates = JSON.parse(h.yearDates) as Record<string, string>;
        const dateStr = yearDates[String(year)] || yearDates[String(year + 1)];
        if (dateStr) date = new Date(dateStr + "T00:00:00");
      } catch {}
    }

    if (!date && h.dateMonth && h.dateDay) {
      date = new Date(year, h.dateMonth - 1, h.dateDay);
      if (date < now) date = new Date(year + 1, h.dateMonth - 1, h.dateDay);
    }

    if (date && date > now) {
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (!closest || daysUntil < closest.daysUntil) {
        closest = { name: h.name, slug: h.slug, date, daysUntil };
      }
    }
  }

  return closest;
}

function getUpcomingHolidays() {
  const db = getDb();
  const now = new Date();
  const year = now.getFullYear();

  const allHolidays = db
    .select()
    .from(holidays)
    .where(eq(holidays.isPublicHoliday, 1))
    .all();

  const upcoming: { name: string; slug: string; date: Date }[] = [];

  for (const h of allHolidays) {
    let date: Date | null = null;

    if (h.yearDates) {
      try {
        const yearDates = JSON.parse(h.yearDates) as Record<string, string>;
        const dateStr = yearDates[String(year)] || yearDates[String(year + 1)];
        if (dateStr) date = new Date(dateStr + "T00:00:00");
      } catch {}
    }

    if (!date && h.dateMonth && h.dateDay) {
      date = new Date(year, h.dateMonth - 1, h.dateDay);
      if (date < now) date = new Date(year + 1, h.dateMonth - 1, h.dateDay);
    }

    if (date && date >= now) {
      upcoming.push({ name: h.name, slug: h.slug, date });
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming.slice(0, 3);
}

export default async function Home() {
  const today = getTodayInLatvia();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const weekday = getLatvianWeekday(today.getDay());
  const monthGenitive = getLatvianMonthGenitive(today.getMonth());

  // Get today's name days
  const todayNameDays = (nameDaysData as NameDayEntry[]).find(
    (entry) => entry.month === todayMonth && entry.day === todayDay
  );
  const names = todayNameDays?.names || [];

  // Get tomorrow's name days
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowMonth = tomorrow.getMonth() + 1;
  const tomorrowDay = tomorrow.getDate();
  const tomorrowNameDays = (nameDaysData as NameDayEntry[]).find(
    (entry) => entry.month === tomorrowMonth && entry.day === tomorrowDay
  );
  const tomorrowNames = tomorrowNameDays?.names || [];

  // Get databases articles
  const db = getDb();
  const recentArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(5);

  // Calculate year progress
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  const yearProgress = Math.round(
    ((today.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100
  );

  // Get today's historical events
  const todayHistoricalEvents = historicalEvents.slice(0, 3);

  // Get next holiday
  const nextHoliday = getNextHoliday();

  // Get upcoming holidays for tool card
  const upcomingHolidays = getUpcomingHolidays();

  const formattedDate = `${weekday}, ${todayDay}. ${monthGenitive}`;

  return (
    <main className="min-h-screen">
      {/* SECTION 1: Name Days Highlight */}
      <section className="bg-[#faf8f3] border-b border-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-text-muted text-sm tracking-wide uppercase mb-4">
            {formattedDate}
          </p>
          <p className="text-text-secondary text-base mb-3">
            {names.length > 0 ? "Šodien vārda dienu svin" : "Šodien nav vārda dienu"}
          </p>

          {names.length > 0 && (
            <>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3 mb-2">
                {names.map((name) => (
                  <Link
                    key={name}
                    href={`/varda-dienas/${name.toLowerCase()}`}
                    className="group name-highlight font-heading text-4xl sm:text-6xl lg:text-7xl font-bold text-primary hover:text-primary-light transition-colors"
                  >
                    {name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {names.map((name) => (
                  <span key={name} className="inline-flex gap-1 opacity-100 md:opacity-0 md:hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <a
                      href={`https://t.me/share/url?url=&text=Daudz%20laimes%20v%C4%81rda%20dien%C4%81%2C%20${encodeURIComponent(name)}!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/80 hover:text-white transition-colors"
                      style={{ backgroundColor: "rgba(0,136,204,0.5)" }}
                      aria-label={`Apsveikt ${name} Telegram`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    </a>
                    <a
                      href={`https://wa.me/?text=Daudz%20laimes%20v%C4%81rda%20dien%C4%81%2C%20${encodeURIComponent(name)}!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/80 hover:text-white transition-colors"
                      style={{ backgroundColor: "rgba(37,211,102,0.5)" }}
                      aria-label={`Apsveikt ${name} WhatsApp`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                      </svg>
                    </a>
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Tomorrow's names */}
          {tomorrowNames.length > 0 && (
            <div className="pt-4 border-t border-accent/15">
              <p className="text-text-muted text-sm">
                Rīt: <span className="text-text-secondary">{tomorrowNames.join(", ")}</span>
              </p>
            </div>
          )}

          {/* Holiday pill + Calendar link */}
          <div className="flex flex-wrap items-center gap-3 text-sm mt-4">
            {nextHoliday && (
              <Link
                href={`/svetku-dienas/${nextHoliday.slug}`}
                className="inline-flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-full px-4 py-2 transition-colors"
              >
                <span className="text-accent-dark font-semibold">{nextHoliday.name}</span>
                <span className="text-text-muted">pēc {nextHoliday.daysUntil} d.</span>
              </Link>
            )}
            <Link
              href="/varda-dienas"
              className="inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-full px-4 py-2 transition-colors text-primary"
            >
              Vārda dienu kalendārs →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: Interactive Tool Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <HomepageToolCards upcomingHolidays={upcomingHolidays.map(h => ({
          name: h.name,
          slug: h.slug,
          day: h.date.getDate(),
          monthShort: LATVIAN_MONTHS_SHORT[h.date.getMonth()],
          weekday: getLatvianWeekday(h.date.getDay()),
        }))} />
      </section>

      {/* SECTION 3: Year Progress + Mani vārdi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-base">{formattedDate}</h3>
              <span className="text-xs text-text-muted">{yearProgress}% no gada</span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
            <p className="text-sm text-text-secondary">
              {names.length > 0 && (
                <>
                  Šodien svin: <span className="font-medium">{names.join(", ")}</span>
                </>
              )}
              {names.length === 0 && "Šodien nav vārda dienu"}
            </p>
            <p className="text-xs text-text-muted mt-2">
              <Link href="/varda-dienas" className="text-primary hover:underline">Saglabā vārdus</Link>, lai redzētu personalizētu pārskatu.
            </p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <h3 className="font-heading font-semibold text-base mb-2">Mani vārdi</h3>
            <p className="text-sm text-text-muted mb-3">
              Saglabā ģimenes un draugu vārdus, lai nekad neaizmirstu vārda dienu.
            </p>
            <div className="flex gap-2">
              <input
                placeholder="Pievieno vārdu..."
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                type="text"
                readOnly
              />
              <Link
                href="/varda-dienas"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                +
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Today in History */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="border border-border rounded-xl p-5 bg-bg-secondary">
          <h3 className="font-heading font-bold text-base mb-3">Šodien vēsturē</h3>
          <ul className="space-y-2.5">
            {todayHistoricalEvents.map((event) => (
              <li key={event.year} className="flex gap-3 text-sm">
                <span className="font-bold text-primary shrink-0 w-12 text-right">{event.year}</span>
                <span className="text-text-secondary">{event.event}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 5: Recent Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-2xl font-bold text-text">Aktualitātes</h2>
          <Link href="/aktualitates" className="text-sm font-medium text-primary hover:text-primary-light">
            Visi raksti →
          </Link>
        </div>

        <div className="space-y-6">
          {recentArticles.map((article) => {
            return (
              <article
                key={article.id}
                className="group border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all bg-bg-secondary"
              >
                <Link href={`/aktualitates/${article.slug}`} className="block md:grid md:grid-cols-5 gap-0">
                  {article.thumbnailUrl ? (
                    <div className="md:col-span-2 aspect-[16/9] md:aspect-auto relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      <Image
                        src={article.thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-2 aspect-[16/9] md:aspect-auto bg-gradient-to-br from-primary/10 to-primary/5" />
                  )}

                  <div className="md:col-span-3 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <TopicBadge topic={article.topic as ArticleTopic} />
                      {article.publishedAt && (
                        <span className="text-xs text-text-muted">{timeAgo(article.publishedAt)}</span>
                      )}
                      <span className="text-xs text-text-muted">&middot; {readingTime(article.content).text.replace(" read", "")}</span>
                    </div>
                    <h3
                      className="font-heading text-xl sm:text-2xl font-bold text-text group-hover:text-primary transition-colors mb-3"
                      style={{ viewTransitionName: `article-title-${article.slug}` }}
                    >
                      {article.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed line-clamp-3">{article.excerpt}</p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        <Link
          href="/aktualitates"
          className="block mt-6 text-center text-primary hover:underline font-medium text-sm"
        >
          Skatīt visus rakstus →
        </Link>
      </section>

      {/* SECTION 6: Newsletter Signup */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <NewsletterSignup variant="card" />
      </section>
    </main>
  );
}
