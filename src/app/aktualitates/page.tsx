import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { TOPICS, type ArticleTopic } from "@/types";
import readingTime from "reading-time";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aktualitātes — jaunākās tēmas Latvijā",
  description:
    "Aktuālākās tēmas un izskaidrojošie raksti par norisēm Latvijā. Politika, ekonomika, sabiedrība un vairāk.",
};

export const revalidate = 300;
export const dynamic = "force-dynamic";

const PAGE_SIZE = 18;

type Props = {
  searchParams: Promise<{ lapa?: string }>;
};

export default async function ArticlesPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.lapa || "1"));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const db = getDb();

  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.status, "published"));

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const publishedArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-2">
        Aktualitātes
      </h1>
      <p className="text-text-secondary mb-6">
        Izskaidrojošie raksti un praktiski padomi par norisēm Latvijā
      </p>

      {/* Topic filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/aktualitates"
          className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-full"
        >
          Visi ({totalCount})
        </Link>
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/temas/${topic.slug}`}
            className="px-3 py-1.5 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary text-sm font-medium rounded-full transition-colors"
          >
            {topic.label}
          </Link>
        ))}
      </div>

      {publishedArticles.length === 0 ? (
        <p className="text-text-muted text-center py-12">
          Pagaidām nav publicētu rakstu.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {publishedArticles.map((article) => {
            let sourceCount = 0;
            if (article.sourceUrls) {
              try {
                const sources = JSON.parse(article.sourceUrls);
                sourceCount = sources.filter((s: string | { url: string }) => {
                  const url = typeof s === "string" ? s : s.url;
                  return !url.includes("vertexaisearch") && !url.includes("google.com/search?q=time");
                }).length;
              } catch { /* ignore */ }
            }
            return (
              <ArticleCard
                key={article.id}
                slug={article.slug}
                title={article.title}
                excerpt={article.excerpt}
                topic={article.topic as ArticleTopic}
                publishedAt={article.publishedAt}
                sourceCount={sourceCount}
                thumbnailUrl={article.thumbnailUrl}
                readingTime={readingTime(article.content).text.replace(
                  " read",
                  ""
                )}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Lappušu navigācija">
          {currentPage > 1 && (
            <Link
              href={`/aktualitates?lapa=${currentPage - 1}`}
              className="px-4 py-2 text-sm font-medium text-primary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
            >
              ← Iepriekšējā
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/aktualitates?lapa=${page}`}
              className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                page === currentPage
                  ? "bg-primary text-white"
                  : "text-text-secondary border border-border hover:bg-bg-secondary"
              }`}
            >
              {page}
            </Link>
          ))}

          {currentPage < totalPages && (
            <Link
              href={`/aktualitates?lapa=${currentPage + 1}`}
              className="px-4 py-2 text-sm font-medium text-primary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Nākamā →
            </Link>
          )}
        </nav>
      )}

    </div>
  );
}
