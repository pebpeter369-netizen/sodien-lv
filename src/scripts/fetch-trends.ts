import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { eq } from "drizzle-orm";
import Parser from "rss-parser";
import path from "path";

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
      console.log(`  ✓ ${count} items (last 24h)`);
    } catch (error) {
      console.error(`  ✗ Error fetching ${feed.name}:`, error instanceof Error ? error.message : error);
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

    // Unigrams (weight 1)
    for (const token of tokens) {
      if (!isStopWord(token)) {
        addTopic(token.toLowerCase(), item, 1);
      }
    }

    // Bigrams (weight 2) — catch entity names like "Rail Baltica"
    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i];
      const b = tokens[i + 1];
      if (!isStopWord(a) || !isStopWord(b)) {
        // At least one non-stop word
        const bigram = `${a} ${b}`.toLowerCase();
        addTopic(bigram, item, 2);
      }
    }
  }

  // Calculate scores with source diversity boost
  for (const [, data] of topics) {
    data.score = data.count * (1 + (data.sources.size - 1) * 0.5);
  }

  return topics;
}

function upsertTrendingItem(title: string, link: string, count: number) {
  const existing = db
    .select({ id: schema.trendingItems.id, mentionCount: schema.trendingItems.mentionCount })
    .from(schema.trendingItems)
    .where(eq(schema.trendingItems.title, title))
    .limit(1)
    .all();

  if (existing.length > 0) {
    db.update(schema.trendingItems)
      .set({ mentionCount: (existing[0].mentionCount || 0) + count })
      .where(eq(schema.trendingItems.id, existing[0].id))
      .run();
  } else {
    db.insert(schema.trendingItems)
      .values({
        title,
        sourceType: "rss",
        sourceUrl: link,
        firstSeen: new Date(),
        mentionCount: count,
      })
      .run();
  }
}

function printTable(
  trending: [string, TopicData][]
) {
  const header = [
    "#".padEnd(4),
    "Keyword/Phrase".padEnd(28),
    "Score".padEnd(8),
    "Mentions".padEnd(10),
    "Sources".padEnd(20),
    "Representative Headline",
  ];

  console.log("\n" + "=".repeat(120));
  console.log("TOP TRENDING TOPICS");
  console.log("=".repeat(120));
  console.log(header.join(""));
  console.log("-".repeat(120));

  trending.forEach(([keyword, data], idx) => {
    const sources = Array.from(data.sources).join(", ");
    const headline =
      data.latestTitle.length > 40
        ? data.latestTitle.substring(0, 37) + "..."
        : data.latestTitle;

    console.log(
      [
        String(idx + 1).padEnd(4),
        keyword.padEnd(28),
        data.score.toFixed(1).padEnd(8),
        String(data.count).padEnd(10),
        sources.padEnd(20),
        headline,
      ].join("")
    );
  });

  console.log("=".repeat(120));
}

async function main() {
  console.log("Fetching trending topics from Latvian news...\n");

  const items = await fetchAllFeeds();
  console.log(`\nTotal items fetched: ${items.length}`);

  const topics = extractTopics(items);

  // Filter: mentioned by 2+ sources, sort by score
  const trending = Array.from(topics.entries())
    .filter(([, data]) => data.sources.size >= 2)
    .sort((a, b) => {
      if (b[1].score !== a[1].score) return b[1].score - a[1].score;
      if (b[1].sources.size !== a[1].sources.size)
        return b[1].sources.size - a[1].sources.size;
      return b[1].count - a[1].count;
    })
    .slice(0, 15);

  if (trending.length === 0) {
    console.log("\nNo trending topics found with 2+ source coverage.");
    sqlite.close();
    return;
  }

  printTable(trending);

  // Save top items to DB (deduplicated)
  let saved = 0;
  for (const [, data] of trending.slice(0, 10)) {
    upsertTrendingItem(data.latestTitle, data.latestLink, data.count);
    saved++;
  }

  console.log(`\n${saved} trending items saved/updated in database.`);
  sqlite.close();
}

main().catch(console.error);
