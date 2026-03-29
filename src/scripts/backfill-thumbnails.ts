import Database from "better-sqlite3";
import { fetchUnsplashImage } from "../lib/unsplash";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const db = new Database(DB_PATH);

async function main() {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error("UNSPLASH_ACCESS_KEY is required. Add it to .env.local");
    process.exit(1);
  }

  const articles = db
    .prepare(
      "SELECT id, title, topic FROM articles WHERE thumbnail_url IS NULL AND status = 'published' ORDER BY id"
    )
    .all() as { id: number; title: string; topic: string }[];

  console.log(`Found ${articles.length} articles without thumbnails\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    process.stdout.write(
      `[${i + 1}/${articles.length}] ${article.title.substring(0, 60)}... `
    );

    const image = await fetchUnsplashImage(article.title, article.topic);

    if (image) {
      db.prepare(
        "UPDATE articles SET thumbnail_url = ?, thumbnail_author = ? WHERE id = ?"
      ).run(image.url, image.author, article.id);
      console.log(`✓ ${image.author.split(" (")[0]}`);
      success++;
    } else {
      console.log("✗ No image found");
      failed++;
    }

    // Rate limit: Unsplash demo = 50/hr, production = 5000/hr
    // Space requests ~75s apart for demo mode (50/hr)
    await new Promise((r) => setTimeout(r, 75000));
  }

  console.log(`\nDone! ${success} images added, ${failed} failed`);
  db.close();
}

main();
