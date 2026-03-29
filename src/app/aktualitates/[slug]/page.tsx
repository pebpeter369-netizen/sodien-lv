import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { TopicBadge } from "@/components/ui/TopicBadge";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { formatLatvianDateFull } from "@/lib/dates";
import { TOPIC_LABELS, type ArticleTopic } from "@/types";

const baseUrl = process.env.SITE_URL || "https://tavadiena.lv";
import readingTime from "reading-time";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);

  if (!article) return {};

  const description = article.metaDescription || article.excerpt;

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
    },
  };
}

export const revalidate = 1800;

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);

  if (!article || article.status !== "published") {
    notFound();
  }

  // Increment views
  await db
    .update(articles)
    .set({ views: (article.views ?? 0) + 1 })
    .where(eq(articles.id, article.id));

  const rt = readingTime(article.content);

  // Related articles
  const related = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.topic, article.topic),
        ne(articles.id, article.id)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(3);

  // Insert ad after 2nd paragraph
  const contentParts = article.content.split("</p>");
  let contentWithAd = article.content;
  if (contentParts.length > 2) {
    contentWithAd =
      contentParts.slice(0, 2).join("</p>") +
      '</p><div class="my-6" id="in-article-ad"></div>' +
      contentParts.slice(2).join("</p>");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
        <span className="text-text line-clamp-1">{article.title}</span>
      </nav>

      <article>
        {/* Hero image */}
        {article.thumbnailUrl && (
          <div className="relative aspect-[2/1] sm:aspect-[21/9] rounded-xl overflow-hidden mb-6">
            <Image
              src={article.thumbnailUrl}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 896px) 100vw, 864px"
              className="object-cover"
            />
            {article.thumbnailAuthor && (
              <span className="absolute bottom-2 right-2 text-[10px] text-white/60 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
                Foto: {article.thumbnailAuthor}
              </span>
            )}
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <TopicBadge topic={article.topic as ArticleTopic} />
            {article.publishedAt && (
              <time className="text-sm text-text-muted">
                {formatLatvianDateFull(article.publishedAt)}
              </time>
            )}
            <span className="text-sm text-text-muted">
              · {rt.text.replace(" read", "")}
            </span>
          </div>
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold text-text leading-tight"
            style={{ viewTransitionName: `article-title-${slug}` }}
          >
            {article.title}
          </h1>
        </header>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: contentWithAd }}
        />

        {/* Sources section for grounded articles */}
        {article.sourceUrls && (() => {
          try {
            const raw = JSON.parse(article.sourceUrls);
            // Support both old format (string[]) and new format ({title, url}[])
            const sources: { title: string; url: string }[] = raw
              .map((s: string | { title: string; url: string }) => {
                if (typeof s === "string") {
                  // Skip junk URLs from old format
                  if (
                    s.includes("vertexaisearch.cloud.google.com") ||
                    s.includes("grounding-api-redirect") ||
                    s.includes("google.com/search?q=time")
                  ) return null;
                  try {
                    return { title: new URL(s).hostname.replace("www.", ""), url: s };
                  } catch {
                    return null;
                  }
                }
                return s;
              })
              .filter(Boolean);
            if (sources.length === 0) return null;
            return (
              <section className="mt-8 p-5 bg-bg-secondary border border-border rounded-lg">
                <h3 className="font-heading text-sm font-semibold text-text-muted mb-3">
                  Avoti
                </h3>
                <ul className="space-y-1.5">
                  {sources.map((source, i) => (
                    <li key={i} className="text-sm flex items-baseline gap-2">
                      <span className="text-text-muted shrink-0">{i + 1}.</span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          } catch {
            return null;
          }
        })()}

        {/* AI disclosure + human review */}
        <div className="mt-6 text-xs text-text-muted border-t border-border pt-4 space-y-1">
          <p>
            Saturs sagatavots ar AI palīdzību, pamatojoties uz publiskiem avotiem.
            Fakti redakcionāli pārbaudīti un apstiprināti.
            {article.topic === "economy" || article.topic === "politics"
              ? " Nodokļu un finanšu dati verificēti pret VID un CSP publicētajiem datiem."
              : ""}
          </p>
          <p>
            Iesakām svarīgus finanšu lēmumus verificēt pie sertificēta speciālista.
          </p>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-heading text-2xl font-bold mb-4">
            Saistītie raksti
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <ArticleCard
                key={r.id}
                slug={r.slug}
                title={r.title}
                excerpt={r.excerpt}
                topic={r.topic as ArticleTopic}
                publishedAt={r.publishedAt}
              />
            ))}
          </div>
        </section>
      )}

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.metaDescription || article.excerpt,
              datePublished: article.publishedAt?.toISOString(),
              dateModified: article.updatedAt?.toISOString(),
              url: `https://tavadiena.lv/aktualitates/${article.slug}`,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://tavadiena.lv/aktualitates/${article.slug}`,
              },
              articleSection: TOPIC_LABELS[article.topic as ArticleTopic],
              inLanguage: "lv",
              author: {
                "@type": "Organization",
                name: "TavaDiena.lv",
                url: "https://tavadiena.lv",
              },
              publisher: {
                "@type": "Organization",
                name: "TavaDiena.lv",
                url: "https://tavadiena.lv",
              },
              reviewedBy: {
                "@type": "Person",
                name: "Pēteris",
                url: "https://tavadiena.lv/par-mums",
                jobTitle: "Galvenais redaktors, TavaDiena.lv",
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
                  item: "https://tavadiena.lv",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Aktualitātes",
                  item: "https://tavadiena.lv/aktualitates",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: article.title,
                  item: `https://tavadiena.lv/aktualitates/${article.slug}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
