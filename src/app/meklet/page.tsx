import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { articles, holidays } from "@/lib/schema";
import { eq, like, or, desc } from "drizzle-orm";
import { TopicBadge } from "@/components/ui/TopicBadge";
import { timeAgo } from "@/lib/dates";
import type { ArticleTopic } from "@/types";
import nameDaysData from "@/data/name-days.json";

export const metadata: Metadata = {
  title: "Meklēt | TavaDiena.lv",
  description: "Meklēt vārda dienas, rakstus, svētkus un citu informāciju.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

interface NameResult {
  name: string;
  month: number;
  day: number;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q || "").trim();

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl font-bold text-text mb-4">Meklēt</h1>
        <SearchForm query="" />
        <p className="text-text-muted mt-8 text-center">
          Ievadi meklēšanas vārdu, lai atrastu rakstus, vārda dienas vai svētkus.
        </p>
      </div>
    );
  }

  const db = getDb();
  const queryLower = query.toLowerCase();
  const queryLike = `%${query}%`;

  // Search articles
  const articleResults = await db
    .select()
    .from(articles)
    .where(
      or(
        like(articles.title, queryLike),
        like(articles.excerpt, queryLike),
        like(articles.metaDescription, queryLike)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(20);

  const publishedArticles = articleResults.filter((a) => a.status === "published");

  // Search name days
  const nameResults: NameResult[] = [];
  for (const entry of nameDaysData as { month: number; day: number; names: string[] }[]) {
    for (const name of entry.names) {
      if (name.toLowerCase().includes(queryLower)) {
        nameResults.push({ name, month: entry.month, day: entry.day });
      }
    }
  }

  // Search holidays
  const holidayResults = await db
    .select()
    .from(holidays)
    .where(
      or(
        like(holidays.name, queryLike),
        like(holidays.description, queryLike)
      )
    )
    .limit(10);

  const totalResults = publishedArticles.length + nameResults.length + holidayResults.length;

  const LATVIAN_MONTHS = [
    "", "janvārī", "februārī", "martā", "aprīlī", "maijā", "jūnijā",
    "jūlijā", "augustā", "septembrī", "oktobrī", "novembrī", "decembrī",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl font-bold text-text mb-4">Meklēt</h1>
      <SearchForm query={query} />

      <p className="text-sm text-text-muted mt-4 mb-6">
        {totalResults > 0
          ? `Atrasti ${totalResults} rezultāti vaicājumam "${query}"`
          : `Nav rezultātu vaicājumam "${query}"`}
      </p>

      {/* Name day results */}
      {nameResults.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-lg font-bold text-text mb-3">
            Vārda dienas ({nameResults.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {nameResults.slice(0, 12).map((r) => (
              <Link
                key={`${r.name}-${r.month}-${r.day}`}
                href={`/varda-dienas/${r.name.toLowerCase()}`}
                className="flex items-center justify-between px-3 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors text-sm"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-text-muted text-xs">
                  {r.day}. {LATVIAN_MONTHS[r.month]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Holiday results */}
      {holidayResults.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-lg font-bold text-text mb-3">
            Svētku dienas ({holidayResults.length})
          </h2>
          <div className="space-y-2">
            {holidayResults.map((h) => (
              <Link
                key={h.slug}
                href={`/svetku-dienas/${h.slug}`}
                className="block px-4 py-3 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
              >
                <span className="font-medium text-text">{h.name}</span>
                {h.isPublicHoliday === 1 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    Brīvdiena
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Article results */}
      {publishedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-lg font-bold text-text mb-3">
            Raksti ({publishedArticles.length})
          </h2>
          <div className="space-y-3">
            {publishedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/aktualitates/${article.slug}`}
                className="block px-4 py-3 border border-border rounded-lg hover:bg-bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TopicBadge topic={article.topic as ArticleTopic} />
                  {article.publishedAt && (
                    <span className="text-xs text-text-muted">
                      {timeAgo(article.publishedAt)}
                    </span>
                  )}
                </div>
                <p className="font-medium text-text group-hover:text-primary transition-colors">
                  {article.title}
                </p>
                <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                  {article.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalResults === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">
            Mēģini citu meklēšanas vārdu vai pārlūko:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/varda-dienas" className="text-primary hover:underline text-sm">
              Vārda dienas
            </Link>
            <Link href="/svetku-dienas" className="text-primary hover:underline text-sm">
              Svētku dienas
            </Link>
            <Link href="/aktualitates" className="text-primary hover:underline text-sm">
              Aktualitātes
            </Link>
            <Link href="/algu-kalkulators" className="text-primary hover:underline text-sm">
              Algu kalkulators
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchForm({ query }: { query: string }) {
  return (
    <form action="/meklet" method="GET" className="relative">
      <input
        type="text"
        name="q"
        defaultValue={query}
        placeholder="Meklēt vārdus, svētkus, rakstus..."
        autoFocus
        className="w-full px-4 py-3 pl-11 border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary"
      />
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </form>
  );
}
