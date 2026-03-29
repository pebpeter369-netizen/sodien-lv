import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  metaDescription: text("meta_description").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  topic: text("topic").notNull(),
  type: text("type").notNull(),
  sourceUrls: text("source_urls"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailAuthor: text("thumbnail_author"),
  status: text("status").notNull().default("draft"),
  views: integer("views").default(0),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

export const nameDays = sqliteTable("name_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dateMonth: integer("date_month").notNull(),
  dateDay: integer("date_day").notNull(),
  names: text("names").notNull(), // JSON array
  extendedNames: text("extended_names"), // JSON array
});

export const holidays = sqliteTable("holidays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  dateMonth: integer("date_month"),
  dateDay: integer("date_day"),
  dateRule: text("date_rule"),
  isPublicHoliday: integer("is_public_holiday").notNull(),
  description: text("description").notNull(),
  traditions: text("traditions"),
  yearDates: text("year_dates"), // JSON: { "2025": "2025-04-20", ... }
});

export const trendingSources = sqliteTable("trending_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url"),
  lastChecked: integer("last_checked", { mode: "timestamp" }),
  isActive: integer("is_active").default(1),
});

export const trendingItems = sqliteTable("trending_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url"),
  firstSeen: integer("first_seen", { mode: "timestamp" }).notNull(),
  mentionCount: integer("mention_count").default(1),
  isProcessed: integer("is_processed").default(0),
  articleId: integer("article_id").references(() => articles.id),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique().notNull(),
  status: text("status").notNull().default("active"), // active, unsubscribed
  subscribedAt: integer("subscribed_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
});

export const nameDetails = sqliteTable("name_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  origin: text("origin"),
  meaning: text("meaning"),
  famousPersons: text("famous_persons"), // JSON array
  popularity: text("popularity"), // "common" | "uncommon" | "rare"
  description: text("description"), // HTML blurb
});
