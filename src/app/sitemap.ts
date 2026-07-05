import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { articles, holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";
import nameDaysData from "@/data/name-days.json";
import { TOPICS } from "@/types";
import { SITE_URL } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const db = getDb();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    {
      url: `${baseUrl}/varda-dienas`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/algu-kalkulators`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/darba-dienu-kalendars`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/svetku-dienas`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/aktualitates`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${baseUrl}/par-mums`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${baseUrl}/jautajumi`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privatuma-politika`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Article pages (skip rows with empty/whitespace slugs)
  const publishedArticles = (
    await db.select().from(articles).where(eq(articles.status, "published"))
  ).filter((a) => a.slug?.trim());
  const articlePages: MetadataRoute.Sitemap = publishedArticles.map((a) => ({
    url: `${baseUrl}/aktualitates/${a.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    lastModified: a.updatedAt ?? a.createdAt ?? undefined,
  }));

  // Topic pages — lastModified is the newest article date in each topic
  const latestByTopic = new Map<string, Date>();
  for (const a of publishedArticles) {
    const date = a.updatedAt ?? a.createdAt;
    if (!date) continue;
    const current = latestByTopic.get(a.topic);
    if (!current || date > current) latestByTopic.set(a.topic, date);
  }
  const topicPages: MetadataRoute.Sitemap = TOPICS.map((t) => ({
    url: `${baseUrl}/temas/${t.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
    lastModified: latestByTopic.get(t.slug),
  }));

  // Name day pages (dedupe by lowercased slug — multiple spellings collapse)
  const allNames = (
    nameDaysData as { month: number; day: number; names: string[] }[]
  ).flatMap((entry) => entry.names);
  const uniqueNameSlugs = Array.from(
    new Set(allNames.map((name) => name.toLowerCase()))
  );
  const namePages: MetadataRoute.Sitemap = uniqueNameSlugs.map((slug) => ({
    url: `${baseUrl}/varda-dienas/${encodeURIComponent(slug)}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  // Holiday pages
  const allHolidays = await db.select().from(holidays);
  const holidayPages: MetadataRoute.Sitemap = allHolidays.map((h) => ({
    url: `${baseUrl}/svetku-dienas/${h.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...topicPages,
    ...namePages,
    ...holidayPages,
    ...articlePages,
  ];
}
