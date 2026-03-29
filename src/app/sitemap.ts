import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { articles, holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";
import nameDaysData from "@/data/name-days.json";
import { TOPICS } from "@/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || "https://tavadiena.lv";
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

  // Topic pages
  const topicPages: MetadataRoute.Sitemap = TOPICS.map((t) => ({
    url: `${baseUrl}/temas/${t.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  // Name day pages
  const allNames = (
    nameDaysData as { month: number; day: number; names: string[] }[]
  ).flatMap((entry) => entry.names);
  const namePages: MetadataRoute.Sitemap = allNames.map((name) => ({
    url: `${baseUrl}/varda-dienas/${name.toLowerCase()}`,
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

  // Article pages
  const publishedArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"));
  const articlePages: MetadataRoute.Sitemap = publishedArticles.map((a) => ({
    url: `${baseUrl}/aktualitates/${a.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    lastModified: a.updatedAt ?? a.createdAt ?? undefined,
  }));

  return [
    ...staticPages,
    ...topicPages,
    ...namePages,
    ...holidayPages,
    ...articlePages,
  ];
}
