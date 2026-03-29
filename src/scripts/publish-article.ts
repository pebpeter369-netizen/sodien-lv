import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { eq } from "drizzle-orm";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

function main() {
  const command = process.argv[2];

  if (command === "--list" || command === "-l") {
    // List all draft articles
    const drafts = db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        slug: schema.articles.slug,
        topic: schema.articles.topic,
        type: schema.articles.type,
        createdAt: schema.articles.createdAt,
      })
      .from(schema.articles)
      .where(eq(schema.articles.status, "draft"))
      .all();

    if (drafts.length === 0) {
      console.log("No draft articles found.");
    } else {
      console.log(`\n${drafts.length} draft article(s):\n`);
      console.log(
        "ID".padEnd(6) +
          "Topic".padEnd(14) +
          "Type".padEnd(12) +
          "Title"
      );
      console.log("-".repeat(70));
      for (const d of drafts) {
        console.log(
          String(d.id).padEnd(6) +
            d.topic.padEnd(14) +
            d.type.padEnd(12) +
            d.title.substring(0, 50)
        );
      }
      console.log(
        `\nTo publish: npx tsx src/scripts/publish-article.ts <id>`
      );
    }
    sqlite.close();
    return;
  }

  if (command === "--all") {
    // Publish all drafts
    const drafts = db
      .select({ id: schema.articles.id, title: schema.articles.title })
      .from(schema.articles)
      .where(eq(schema.articles.status, "draft"))
      .all();

    if (drafts.length === 0) {
      console.log("No draft articles to publish.");
      sqlite.close();
      return;
    }

    const now = new Date();
    for (const d of drafts) {
      db.update(schema.articles)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(schema.articles.id, d.id))
        .run();
      console.log(`Published: "${d.title}" (ID: ${d.id})`);
    }
    console.log(`\n${drafts.length} article(s) published.`);
    sqlite.close();
    return;
  }

  const articleId = parseInt(command);

  if (isNaN(articleId)) {
    console.log(`
Usage:
  npx tsx src/scripts/publish-article.ts <id>     Publish a specific article
  npx tsx src/scripts/publish-article.ts --list    List all drafts
  npx tsx src/scripts/publish-article.ts --all     Publish all drafts
`);
    process.exit(1);
  }

  const results = db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.id, articleId))
    .limit(1)
    .all();
  const article = results[0];

  if (!article) {
    console.error(`Article with ID ${articleId} not found.`);
    process.exit(1);
  }

  if (article.status === "published") {
    console.log(`Article "${article.title}" is already published.`);
    sqlite.close();
    return;
  }

  const now = new Date();
  db.update(schema.articles)
    .set({ status: "published", publishedAt: now, updatedAt: now })
    .where(eq(schema.articles.id, articleId))
    .run();

  console.log(`Published: "${article.title}"`);
  console.log(`  URL: /aktualitates/${article.slug}`);
  sqlite.close();
}

main();
