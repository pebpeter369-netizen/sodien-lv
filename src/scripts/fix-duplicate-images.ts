import Database from "better-sqlite3";
import { fetchUnsplashImage } from "../lib/unsplash";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const db = new Database(DB_PATH);

async function main() {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error("UNSPLASH_ACCESS_KEY is required");
    process.exit(1);
  }

  // Find all duplicate images (URLs used more than once)
  const duplicates = db
    .prepare(
      `SELECT thumbnail_url, COUNT(*) as count
       FROM articles
       WHERE thumbnail_url IS NOT NULL
       GROUP BY thumbnail_url
       HAVING count > 1
       ORDER BY count DESC`
    )
    .all() as { thumbnail_url: string; count: number }[];

  console.log(`Found ${duplicates.length} duplicate image groups\n`);

  // Build set of all currently used image base URLs
  const allUsed = new Set<string>();
  const allImages = db
    .prepare("SELECT thumbnail_url FROM articles WHERE thumbnail_url IS NOT NULL")
    .all() as { thumbnail_url: string }[];
  for (const row of allImages) {
    allUsed.add(row.thumbnail_url.split("?")[0]);
  }

  let fixed = 0;
  let failed = 0;

  for (const dup of duplicates) {
    // Get all articles with this duplicate image
    const articles = db
      .prepare("SELECT id, title, topic FROM articles WHERE thumbnail_url = ?")
      .all(dup.thumbnail_url) as { id: number; title: string; topic: string }[];

    // Keep the first one, re-fetch for the rest
    for (let i = 1; i < articles.length; i++) {
      const article = articles[i];
      process.stdout.write(
        `[${fixed + failed + 1}] ${article.title.substring(0, 50)}... `
      );

      const image = await fetchUnsplashImage(article.title, article.topic, allUsed);

      if (image) {
        db.prepare("UPDATE articles SET thumbnail_url = ?, thumbnail_author = ? WHERE id = ?")
          .run(image.url, image.author, article.id);
        allUsed.add(image.url.split("?")[0]);
        console.log(`✓ ${image.author.split(" (")[0]}`);
        fixed++;
      } else {
        console.log("✗ No unique image found");
        failed++;
      }

      // Rate limit: 75s for demo, 1.5s for production
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Also fix articles without any image
  const noImage = db
    .prepare("SELECT id, title, topic FROM articles WHERE thumbnail_url IS NULL AND status = 'published'")
    .all() as { id: number; title: string; topic: string }[];

  console.log(`\n${noImage.length} articles without images\n`);

  for (const article of noImage) {
    process.stdout.write(`[new] ${article.title.substring(0, 50)}... `);

    const image = await fetchUnsplashImage(article.title, article.topic, allUsed);
    if (image) {
      db.prepare("UPDATE articles SET thumbnail_url = ?, thumbnail_author = ? WHERE id = ?")
        .run(image.url, image.author, article.id);
      allUsed.add(image.url.split("?")[0]);
      console.log(`✓ ${image.author.split(" (")[0]}`);
      fixed++;
    } else {
      console.log("✗");
      failed++;
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nDone! Fixed ${fixed}, failed ${failed}`);
  db.close();
}

main();
