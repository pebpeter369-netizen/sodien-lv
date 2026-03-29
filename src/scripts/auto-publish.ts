import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { eq, and, gte } from "drizzle-orm";
import Parser from "rss-parser";
import path from "path";
import { generateGroundedArticle } from "./generate-grounded-article";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const RSS_FEEDS = [
  { name: "Delfi", url: "https://www.delfi.lv/rss/?channel=lv" },
  { name: "LSM", url: "https://www.lsm.lv/rss/" },
  { name: "TVNet", url: "https://www.tvnet.lv/rss" },
  { name: "NRA", url: "https://nra.lv/rss/" },
  { name: "LA.lv", url: "https://www.la.lv/rss" },
];

const STOP_WORDS = new Set([
  "un", "vai", "par", "kas", "lai", "arī", "bet", "ir", "nav", "tas", "tā",
  "šī", "šis", "jau", "kā", "no", "ar", "pie", "uz", "pa", "pēc", "bez",
  "ja", "kad", "jo", "gan", "tiek", "būs", "bija", "būt", "var", "kur",
  "kāds", "kāda", "šo", "šī", "šīs", "tam", "tai", "tās", "tie", "tos",
  "tiem", "vēl", "jūs", "mēs", "viņš", "viņa", "viņi", "mans", "tavs",
  "savs", "visi", "viss", "visa", "visas", "cits", "cita", "citi", "citas",
  "pats", "pati", "paši", "savu", "sevi", "sev", "līdz", "starp", "kopš",
  "pirms", "ļoti", "labi", "lielā", "liels", "jauns", "jauna", "vairāk",
  "mazāk", "tikai", "tomēr", "taču", "turklāt", "turpat", "tagad", "šodien",
  "vakar", "rīt", "gada", "gadā", "gads", "diena", "dienā", "latvijā",
  "latvija", "latvijas", "foto", "video",
]);

interface HeadlineItem {
  title: string;
  source: string;
  link: string;
  pubDate: Date;
}

interface TopicData {
  count: number;
  sources: Set<string>;
  score: number;
  latestTitle: string;
  latestLink: string;
}

async function fetchAllFeeds(): Promise<HeadlineItem[]> {
  const parser = new Parser();
  const allItems: HeadlineItem[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching ${feed.name}...`);
      const result = await parser.parseURL(feed.url);
      let count = 0;

      for (const item of result.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        if (pubDate > oneDayAgo && item.title) {
          allItems.push({
            title: item.title,
            source: feed.name,
            link: item.link || "",
            pubDate,
          });
          count++;
        }
      }
      console.log(`  ${count} items (last 24h)`);
    } catch (error) {
      console.error(
        `  Error fetching ${feed.name}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return allItems;
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^\p{L}\s-]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function isStopWord(word: string): boolean {
  return word.length <= 3 || STOP_WORDS.has(word.toLowerCase());
}

function extractTopics(items: HeadlineItem[]): Map<string, TopicData> {
  const topics = new Map<string, TopicData>();

  function addTopic(key: string, item: HeadlineItem, weight: number) {
    const existing = topics.get(key);
    if (existing) {
      existing.count += weight;
      existing.sources.add(item.source);
      existing.latestTitle = item.title;
      existing.latestLink = item.link;
    } else {
      topics.set(key, {
        count: weight,
        sources: new Set([item.source]),
        score: 0,
        latestTitle: item.title,
        latestLink: item.link,
      });
    }
  }

  for (const item of items) {
    const tokens = tokenize(item.title);

    for (const token of tokens) {
      if (!isStopWord(token)) {
        addTopic(token.toLowerCase(), item, 1);
      }
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i];
      const b = tokens[i + 1];
      if (!isStopWord(a) || !isStopWord(b)) {
        const bigram = `${a} ${b}`.toLowerCase();
        addTopic(bigram, item, 2);
      }
    }
  }

  for (const [, data] of topics) {
    data.score = data.count * (1 + (data.sources.size - 1) * 0.5);
  }

  return topics;
}

function hasRecentArticle(topic: string): boolean {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Check if any article created in the last 48h has a similar title/topic
  const recent = db
    .select({ id: schema.articles.id, title: schema.articles.title })
    .from(schema.articles)
    .where(
      and(
        eq(schema.articles.type, "trending"),
        gte(schema.articles.createdAt, twoDaysAgo)
      )
    )
    .all();

  const topicLower = topic.toLowerCase();
  return recent.some((a) => {
    const titleLower = a.title.toLowerCase();
    // Check if significant words overlap
    const topicWords = topicLower
      .split(/\s+/)
      .filter((w) => w.length > 4);
    return topicWords.some((w) => titleLower.includes(w));
  });
}

async function main() {
  console.log("=== Auto-publish pipeline ===\n");
  console.log("Step 1: Fetching trending topics from RSS feeds...\n");

  const items = await fetchAllFeeds();
  console.log(`\nTotal items fetched: ${items.length}`);

  const topics = extractTopics(items);

  // Filter: 2+ sources, sort by score, take top entries
  const trending = Array.from(topics.entries())
    .filter(([, data]) => data.sources.size >= 2)
    .sort((a, b) => {
      if (b[1].score !== a[1].score) return b[1].score - a[1].score;
      if (b[1].sources.size !== a[1].sources.size)
        return b[1].sources.size - a[1].sources.size;
      return b[1].count - a[1].count;
    })
    .slice(0, 10);

  if (trending.length === 0) {
    console.log("\nNo trending topics found with 2+ source coverage.");
    sqlite.close();
    return;
  }

  console.log(`\nStep 2: Selecting top topics for article generation...\n`);

  const generated: Array<{
    topic: string;
    title: string;
    slug: string;
    wordCount: number;
    sources: number;
  }> = [];

  let candidateIndex = 0;
  for (const [keyword, data] of trending) {
    if (generated.length >= 3) break;
    candidateIndex++;

    const topicLabel = `${keyword} (${data.latestTitle})`;
    console.log(
      `\nCandidate #${candidateIndex}: "${keyword}" (score: ${data.score.toFixed(1)}, sources: ${Array.from(data.sources).join(", ")})`
    );

    if (hasRecentArticle(keyword)) {
      console.log(`  SKIPPED: Recent article already exists for this topic.`);
      continue;
    }

    console.log(`  Generating article...\n`);

    try {
      const result = await generateGroundedArticle(data.latestTitle, {
        publish: true,
      });

      generated.push({
        topic: keyword,
        title: result.title,
        slug: result.slug,
        wordCount: result.wordCount,
        sources: result.sources.length,
      });

      console.log(`  Published: /aktualitates/${result.slug}\n`);
    } catch (error) {
      console.error(
        `  ERROR generating article:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`AUTO-PUBLISH SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Articles generated: ${generated.length}`);

  if (generated.length > 0) {
    console.log("");
    generated.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.title}`);
      console.log(`     URL: /aktualitates/${g.slug}`);
      console.log(`     Words: ~${g.wordCount}, Sources: ${g.sources}`);
    });
  }

  console.log(`${"=".repeat(60)}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  sqlite.close();
  process.exit(1);
});
