import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  daysUntil,
  getLatvianMonth,
  getLatvianMonthGenitive,
  getLatvianMonthLocative,
} from "@/lib/dates";
import { SITE_URL } from "@/lib/brand";
import { OG_DEFAULTS, OG_DEFAULT_IMAGE, PUBLISHER_JSONLD } from "@/lib/seo";
import {
  allDayParams,
  daySlug,
  getNamesForDate,
  monthSlug,
  parseDaySlug,
} from "@/lib/nameDayDates";
import { NameLinkList } from "@/components/varda-dienas/NameLinkList";

export const revalidate = 3600;

// Read-only from name-days.json (no DB): prerender ALL 366 days at build for a
// fully static route, with hourly ISR to refresh the "Šodien!" highlight.
export async function generateStaticParams() {
  return allDayParams();
}

type Props = {
  params: Promise<{ datums: string }>;
};

// A fixed leap year so Feb 29 exists and calendar arithmetic wraps correctly.
const LEAP_YEAR = 2024;

/** Previous/next calendar date, wrapping Dec 31 → Jan 1 (0-based month). */
function adjacentDate(
  monthIndex0: number,
  day: number,
  delta: number
): { day: number; monthIndex0: number } {
  const d = new Date(LEAP_YEAR, monthIndex0, day + delta);
  return { day: d.getDate(), monthIndex0: d.getMonth() };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { datums } = await params;
  const parsed = parseDaySlug(datums);
  if (!parsed) return {};

  const { day, monthIndex0 } = parsed;
  const genitiveMonth = getLatvianMonthGenitive(monthIndex0);
  const names = getNamesForDate(monthIndex0 + 1, day);
  const canonicalPath = `/varda-dienas/datums/${daySlug(day, monthIndex0)}`;

  const titleFull = `${day}. ${genitiveMonth} vārda dienas — ${names.join(", ")}`;
  const titleShort = `${day}. ${genitiveMonth} vārda dienas`;
  const title = titleFull.length > 60 ? titleShort : titleFull;

  const description = `${day}. ${genitiveMonth} vārda dienas svin ${names.join(
    ", "
  )}. Atver katru vārdu, lai uzzinātu tā nozīmi, izcelsmi un tradīcijas Latvijā.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      ...OG_DEFAULTS,
      url: canonicalPath,
      title: titleShort,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}

export default async function NameDayDatePage({ params }: Props) {
  const { datums } = await params;
  const parsed = parseDaySlug(datums);

  if (!parsed) {
    notFound();
  }

  const { day, monthIndex0 } = parsed;
  const canonicalSlug = daySlug(day, monthIndex0);

  // Canonicalize e.g. "05-julijs" → "5-julijs" to a single indexable URL.
  if (datums !== canonicalSlug) {
    permanentRedirect(`/varda-dienas/datums/${canonicalSlug}`);
  }

  const month1 = monthIndex0 + 1;
  const names = getNamesForDate(month1, day);
  const monthName = getLatvianMonth(monthIndex0);
  const genitiveMonth = getLatvianMonthGenitive(monthIndex0);
  const locativeMonth = getLatvianMonthLocative(monthIndex0);
  const monthSlugStr = monthSlug(monthIndex0);
  const isToday = daysUntil(month1, day) === 0;

  const dateGenitive = `${day}. ${genitiveMonth}`;
  const dateLocative = `${day}. ${locativeMonth}`;

  const prev = adjacentDate(monthIndex0, day, -1);
  const next = adjacentDate(monthIndex0, day, 1);
  const prevSlug = daySlug(prev.day, prev.monthIndex0);
  const nextSlug = daySlug(next.day, next.monthIndex0);
  const prevLabel = `${prev.day}. ${getLatvianMonthGenitive(prev.monthIndex0)}`;
  const nextLabel = `${next.day}. ${getLatvianMonthGenitive(next.monthIndex0)}`;

  const baseUrl = SITE_URL;
  const canonicalUrl = `${baseUrl}/varda-dienas/datums/${canonicalSlug}`;
  const pageDescription = `${dateGenitive} vārda dienas svin ${names.join(
    ", "
  )}. Atver katru vārdu, lai uzzinātu tā nozīmi, izcelsmi un tradīcijas Latvijā.`;

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
        <Link
          href={`/varda-dienas/menesis/${monthSlugStr}`}
          className="hover:text-primary"
        >
          {monthName}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">{dateGenitive}</span>
      </nav>

      <div className="text-center mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4">
          Vārda dienas {dateLocative}
        </h1>
        <div className="bg-accent/10 rounded-xl px-6 py-4 inline-block">
          <p className="text-lg font-medium text-text">
            Šajā datumā vārda dienu svin{" "}
            <span className="font-bold">{names.length}</span>{" "}
            {names.length === 1 ? "vārds" : "vārdi"}
          </p>
        </div>
      </div>

      {/* Today highlight */}
      {isToday && (
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-8 text-center mb-8">
          <p className="text-accent-light text-lg font-medium">Šodien!</p>
          <p className="text-4xl font-heading font-bold mt-2">
            Šīs ir šodienas vārda dienas &#127881;
          </p>
        </div>
      )}

      {/* Names */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">
          {dateGenitive} vārda dienas
        </h2>
        <NameLinkList names={names} />
      </section>

      {/* Evergreen intro */}
      <section className="mb-8">
        <div className="text-text-secondary leading-relaxed space-y-3">
          <p>
            {dateLocative} Latvijas vārda dienu kalendārā vārda dienu svin{" "}
            {names.join(", ")}. Latvijas Zinātņu akadēmijas Latviešu valodas
            institūts uztur oficiālo vārda dienu kalendāru, kurā katram gada
            datumam ir piešķirti viens vai vairāki vārdi.
          </p>
          <p>
            Atver katru vārdu, lai uzzinātu tā nozīmi, izcelsmi, popularitāti un
            svinēšanas tradīcijas. Vari arī apskatīt visas{" "}
            <Link
              href={`/varda-dienas/menesis/${monthSlugStr}`}
              className="text-primary hover:underline"
            >
              {monthName} vārda dienas
            </Link>{" "}
            vai atgriezties uz{" "}
            <Link href="/varda-dienas" className="text-primary hover:underline">
              pilno vārda dienu kalendāru
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Prev / next day navigation */}
      <nav
        aria-label="Blakus datumi"
        className="flex items-center justify-between gap-3 mb-8 border-t border-border pt-6"
      >
        <Link
          href={`/varda-dienas/datums/${prevSlug}`}
          className="text-sm text-primary hover:underline"
        >
          &#8592; {prevLabel}
        </Link>
        <Link
          href={`/varda-dienas/menesis/${monthSlugStr}`}
          className="text-sm font-medium text-text-secondary hover:text-primary"
        >
          {monthName}
        </Link>
        <Link
          href={`/varda-dienas/datums/${nextSlug}`}
          className="text-sm text-primary hover:underline"
        >
          {nextLabel} &#8594;
        </Link>
      </nav>

      {/* Structured data — CollectionPage + Breadcrumb + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `Vārda dienas ${dateLocative}`,
              description: pageDescription,
              url: canonicalUrl,
              inLanguage: "lv",
              publisher: PUBLISHER_JSONLD,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Sākums",
                  item: baseUrl,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Vārda dienas",
                  item: `${baseUrl}/varda-dienas`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: monthName,
                  item: `${baseUrl}/varda-dienas/menesis/${monthSlugStr}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: dateGenitive,
                  item: canonicalUrl,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Vārda dienas ${dateLocative}`,
              numberOfItems: names.length,
              itemListElement: names.map((name, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name,
                url: `${baseUrl}/varda-dienas/${name.toLowerCase()}`,
              })),
            },
          ]),
        }}
      />
    </div>
  );
}
