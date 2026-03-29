import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { ArticleCard } from "@/components/ui/ArticleCard";
import {
  TOPICS,
  TOPIC_LABELS,
  TOPIC_DESCRIPTIONS,
  type ArticleTopic,
} from "@/types";
import readingTime from "reading-time";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ topic: string }>;
};

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const label = TOPIC_LABELS[topic as ArticleTopic];
  const description = TOPIC_DESCRIPTIONS[topic as ArticleTopic];
  if (!label) return {};

  return {
    title: `${label} — raksti un aktualitātes Latvijā`,
    description:
      description ||
      `Jaunākie raksti un aktualitātes par tēmu: ${label}. Izskaidrojošie raksti latviešu valodā.`,
  };
}

export const revalidate = 300;

export default async function TopicPage({ params }: Props) {
  const { topic } = await params;
  const label = TOPIC_LABELS[topic as ArticleTopic];
  const description = TOPIC_DESCRIPTIONS[topic as ArticleTopic];

  if (!label) {
    notFound();
  }

  const db = getDb();
  const topicArticles = await db
    .select()
    .from(articles)
    .where(and(eq(articles.status, "published"), eq(articles.topic, topic)))
    .orderBy(desc(articles.publishedAt))
    .limit(24);

  // Get other topics for cross-linking
  const otherTopics = TOPICS.filter((t) => t.slug !== topic);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Sākums
        </Link>
        <span className="mx-1">/</span>
        <Link href="/aktualitates" className="hover:text-primary">
          Aktualitātes
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">{label}</span>
      </nav>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-3">
        {label}
      </h1>

      {description && (
        <p className="text-text-secondary max-w-3xl leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Topic filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/aktualitates"
          className="px-3 py-1.5 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary text-sm font-medium rounded-full transition-colors"
        >
          Visi
        </Link>
        {TOPICS.map((t) => (
          <Link
            key={t.slug}
            href={`/temas/${t.slug}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              t.slug === topic
                ? "bg-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {topicArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">
            Pagaidām nav publicētu rakstu kategorijā &ldquo;{label}&rdquo;.
          </p>
          <Link
            href="/aktualitates"
            className="text-primary hover:underline font-medium"
          >
            Skatīt visus rakstus →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {topicArticles.map((article) => {
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

      {/* Cross-links */}
      <section className="mt-8 border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Noderīgi rīki</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <Link
            href="/svetku-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#128197; Svētku dienas Latvijā
          </Link>
        </div>
      </section>

    </div>
  );
}
