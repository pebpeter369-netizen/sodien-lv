import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getLatvianMonth,
  getLatvianMonthGenitive,
  getLatvianMonthLocative,
  getTodayInLatvia,
} from "@/lib/dates";
import { SITE_URL } from "@/lib/brand";
import { capitalize } from "@/lib/latvian";
import { OG_DEFAULTS, OG_DEFAULT_IMAGE } from "@/lib/seo";
import { NameLinkList } from "@/components/varda-dienas/NameLinkList";
import {
  allMonthParams,
  daySlug,
  getMonthEntries,
  monthIndexFromSlug,
  monthSlug,
} from "@/lib/nameDayDates";

export const revalidate = 3600;

// Latvian: singular noun after counts ending in 1 (but not 11) — "31 diena",
// "21 diena", but "11 dienas" and "25 dienas".
function dienasWord(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? "diena" : "dienas";
}

// The month pages read only name-days.json (no DB), so prerender all 12 at
// build for fully-static output; hourly ISR keeps the "today" highlight fresh.
export async function generateStaticParams() {
  return allMonthParams();
}

type Props = {
  params: Promise<{ menesis: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { menesis } = await params;
  const monthIndex0 = monthIndexFromSlug(menesis);
  if (monthIndex0 === null) return {};

  const genitiveMonth = getLatvianMonthGenitive(monthIndex0);
  const genitiveTitle = capitalize(genitiveMonth); // "Jūlija" — grammatical + the real search keyword
  const entryCount = getMonthEntries(monthIndex0 + 1).length;
  const canonicalPath = `/varda-dienas/menesis/${monthSlug(monthIndex0)}`;

  return {
    title: `${genitiveTitle} vārda dienas — pilns saraksts pa dienām`,
    description: `Visas ${genitiveMonth} vārda dienas — ${entryCount} ${dienasWord(entryCount)}, saraksts pa datumiem. Uzzini, kam kurā dienā ir vārda diena.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      ...OG_DEFAULTS,
      url: canonicalPath,
      title: `${genitiveTitle} vārda dienas`,
      description: `Visas ${genitiveMonth} vārda dienas — saraksts pa datumiem. Uzzini, kam kurā dienā ir vārda diena.`,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}

export default async function MonthNameDaysPage({ params }: Props) {
  const { menesis } = await params;
  const monthIndex0 = monthIndexFromSlug(menesis);

  if (monthIndex0 === null) {
    notFound();
  }

  // Canonicalize any accepted variant to the single indexable slug.
  const canonicalSlug = monthSlug(monthIndex0);
  if (menesis !== canonicalSlug) {
    permanentRedirect(`/varda-dienas/menesis/${canonicalSlug}`);
  }

  const month1 = monthIndex0 + 1;
  const monthNominative = getLatvianMonth(monthIndex0);
  const genitiveMonth = getLatvianMonthGenitive(monthIndex0);
  const genitiveTitle = capitalize(genitiveMonth); // "Jūlija" for headings/keyword
  const locativeMonth = getLatvianMonthLocative(monthIndex0);
  const entries = getMonthEntries(month1);

  // Highlight today's row when the current Latvian date falls in this month.
  const today = getTodayInLatvia();
  const todayMonthIndex0 = today.getMonth();
  const todayDay = today.getDate();

  // Prev/next month navigation, wrapping December → January.
  const prevIndex0 = (monthIndex0 + 11) % 12;
  const nextIndex0 = (monthIndex0 + 1) % 12;
  const prevSlug = monthSlug(prevIndex0);
  const nextSlug = monthSlug(nextIndex0);
  const prevName = getLatvianMonth(prevIndex0);
  const nextName = getLatvianMonth(nextIndex0);

  const canonicalUrl = `${SITE_URL}/varda-dienas/menesis/${canonicalSlug}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Sākums
        </Link>
        <span className="mx-1">/</span>
        <Link href="/varda-dienas" className="hover:text-primary">
          Vārda dienas
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">{monthNominative}</span>
      </nav>

      <div className="text-center mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4">
          {genitiveTitle} vārda dienas
        </h1>
        <p className="text-text-secondary leading-relaxed max-w-2xl mx-auto">
          Pilns {genitiveMonth} vārda dienu saraksts pa datumiem — {entries.length}{" "}
          {dienasWord(entries.length)}. Izvēlies datumu, lai uzzinātu, kam{" "}
          {locativeMonth} ir vārda diena, kā arī vārda nozīmi un tradīcijas.
        </p>
      </div>

      {/* Day-by-day list */}
      <div className="space-y-3 mb-10">
        {entries.map((entry) => {
          const isToday =
            monthIndex0 === todayMonthIndex0 && entry.day === todayDay;
          return (
            <div
              key={entry.day}
              className={`rounded-xl p-4 sm:p-5 border ${
                isToday
                  ? "border-primary bg-accent/10"
                  : "border-border bg-bg-secondary"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                <Link
                  href={`/varda-dienas/datums/${daySlug(entry.day, monthIndex0)}`}
                  className="shrink-0 font-heading font-bold text-primary hover:underline whitespace-nowrap"
                >
                  {entry.day}. {genitiveMonth}
                  {isToday && (
                    <span className="ml-2 align-middle text-xs font-medium text-text-muted">
                      (šodien)
                    </span>
                  )}
                </Link>
                <NameLinkList names={entry.names} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / next month navigation */}
      <nav
        aria-label="Mēnešu navigācija"
        className="flex items-center justify-between gap-3 border-t border-border pt-6 mb-8"
      >
        <Link
          href={`/varda-dienas/menesis/${prevSlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          &#8592; {prevName}
        </Link>
        <Link
          href="/varda-dienas"
          className="text-sm font-medium text-text-secondary hover:text-primary"
        >
          Visas vārda dienas
        </Link>
        <Link
          href={`/varda-dienas/menesis/${nextSlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {nextName} &#8594;
        </Link>
      </nav>

      {/* Structured data — CollectionPage + Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${genitiveTitle} vārda dienas`,
              description: `Pilns ${genitiveMonth} vārda dienu saraksts pa datumiem.`,
              url: canonicalUrl,
              inLanguage: "lv",
              isPartOf: {
                "@type": "WebSite",
                name: "TavaDiena.lv",
                url: SITE_URL,
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Sākums",
                  item: SITE_URL,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Vārda dienas",
                  item: `${SITE_URL}/varda-dienas`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: monthNominative,
                  item: canonicalUrl,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
