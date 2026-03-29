import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { GoogleGenAI } from "@google/genai";
import { fetchUnsplashImage } from "../lib/unsplash";
import { parseArticleJson } from "../lib/parse-article-json";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const SYSTEM_PROMPT = `Tu esi pieredzējis latviešu žurnālists. Tavs uzdevums ir rakstīt faktoloģiski precīzus, informatīvus rakstus latviešu valodā, balstoties uz meklēšanas rezultātiem.

Raksta prasības:
- Garums: 300-500 vārdi
- Valoda: Gramatiski pareiza latviešu valoda
- Struktūra: H2 apakšvirsraksti, īsas rindkopas (2-3 teikumi)
- Iekļauj konkrētus faktus, skaitļus, datumus no meklēšanas rezultātiem
- Atsauces uz avotiem: iekļauj saites tekstā kā <a href="URL" target="_blank" rel="noopener noreferrer">avota nosaukums</a>
- Tonis: Neitrāls, informatīvs, bez sensacionālisma
- SEO: Dabīgi iekļauj atslēgvārdus

Atbildi TIKAI ar JSON objektu (bez markdown, bez komentāriem):
{
  "title": "SEO optimizēts virsraksts (50-65 rakstzīmes)",
  "meta_description": "Meta apraksts (140-160 rakstzīmes)",
  "excerpt": "2-3 teikumu kopsavilkums",
  "content": "HTML saturs ar <h2>, <p>, <a>, <ul>, <strong> tagiem. Iekļauj saites uz avotiem.",
  "topic": "politics|economy|sports|culture|technology|society|eu|environment",
  "suggested_slug": "url-slug-bez-diakritikas",
  "sources": ["https://source1.com", "https://source2.com"]
}`;

function printUsage() {
  console.log(`
Usage: npx tsx src/scripts/generate-grounded-article.ts <topic> [options]

Options:
  --publish     Set status to 'published' immediately

Examples:
  npx tsx src/scripts/generate-grounded-article.ts "Rail Baltica izmaksu pieaugums"
  npx tsx src/scripts/generate-grounded-article.ts "Inflācija Latvijā" --publish
`);
}

export async function generateGroundedArticle(
  topic: string,
  options: { publish?: boolean } = {}
): Promise<{
  id: number;
  slug: string;
  title: string;
  topic: string;
  wordCount: number;
  sources: { title: string; url: string }[];
}> {
  const shouldPublish = options.publish ?? false;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required. Set it in .env.local or pass directly."
    );
  }

  console.log(`Generating grounded article about: "${topic}"`);
  console.log(`Model: gemini-2.5-flash (with Google Search grounding)`);
  console.log(`Status: ${shouldPublish ? "published" : "draft"}\n`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Raksti faktoloģiski precīzu rakstu par šo tēmu: ${topic}

Izmanto meklēšanas rezultātus, lai iekļautu jaunākos faktus, skaitļus un notikumus. Norādi avotus.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.5,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No text response from Gemini");
  }

  // Extract grounding metadata
  const groundingMetadata =
    response.candidates?.[0]?.groundingMetadata;
  const groundingSources: { title: string; url: string }[] = [];

  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web?.uri) {
        const url = chunk.web.uri;
        // Skip irrelevant time zone queries
        if (url.includes("google.com/search?q=time")) {
          continue;
        }
        const title = chunk.web.title || "";
        // Skip entries without a title (can't display meaningfully)
        if (!title) continue;
        // Deduplicate by title (same source may appear multiple times)
        if (!groundingSources.some((s) => s.title === title)) {
          groundingSources.push({ title, url });
        }
      }
    }
  }

  // Resolve redirect URLs to get real destinations
  async function resolveUrl(url: string): Promise<string> {
    if (!url.includes("vertexaisearch") && !url.includes("grounding-api-redirect")) {
      return url;
    }
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      return res.url || url;
    } catch {
      return url;
    }
  }

  // Resolve all redirect URLs in parallel
  console.log(`Resolving ${groundingSources.length} source URLs...`);
  const resolvedSources = await Promise.all(
    groundingSources.map(async (s) => ({
      title: s.title,
      url: await resolveUrl(s.url),
    }))
  );

  if (groundingMetadata?.searchEntryPoint?.renderedContent) {
    console.log("Search grounding was used for this response.");
  }

  // Parse JSON response with robust extraction
  const article = parseArticleJson(text);

  // Use resolved grounding sources as the primary source list
  // Filter out any that still point to Google/vertex redirects after resolution
  const seenUrls = new Set<string>();
  const allSources: { title: string; url: string }[] = [];
  for (const s of resolvedSources) {
    if (
      !seenUrls.has(s.url) &&
      !s.url.includes("google.com/search?q=time")
    ) {
      seenUrls.add(s.url);
      allSources.push(s);
    }
  }

  // Clean slug
  const slug = article.suggested_slug
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Check for duplicate slug
  const existingSlugs = new Set(
    db
      .select({ slug: schema.articles.slug })
      .from(schema.articles)
      .all()
      .map((a) => a.slug)
  );
  const finalSlug = existingSlugs.has(slug) ? `${slug}-${Date.now()}` : slug;

  // Fetch thumbnail image from Unsplash
  const image = await fetchUnsplashImage(article.title, article.topic);
  if (image) {
    console.log(`Thumbnail: ${image.author}`);
  }

  const now = new Date();

  const result = db
    .insert(schema.articles)
    .values({
      slug: finalSlug,
      title: article.title,
      metaDescription: article.meta_description.substring(0, 160),
      content: article.content,
      excerpt: article.excerpt,
      topic: article.topic,
      type: "trending",
      sourceUrls: JSON.stringify(allSources),
      thumbnailUrl: image?.url || null,
      thumbnailAuthor: image?.author || null,
      status: shouldPublish ? "published" : "draft",
      publishedAt: shouldPublish ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const wordCount = article.content
    .replace(/<[^>]*>/g, "")
    .split(/\s+/)
    .filter((w: string) => w.length > 0).length;

  console.log(`Article created successfully!\n`);
  console.log(`  ID:       ${result.lastInsertRowid}`);
  console.log(`  Title:    ${article.title}`);
  console.log(`  Slug:     ${finalSlug}`);
  console.log(`  URL:      /aktualitates/${finalSlug}`);
  console.log(`  Topic:    ${article.topic}`);
  console.log(`  Status:   ${shouldPublish ? "published" : "draft"}`);
  console.log(`  Words:    ~${wordCount}`);
  console.log(`  Sources:  ${allSources.length}`);
  if (allSources.length > 0) {
    console.log(`\n  Source URLs:`);
    allSources.forEach((s, i) => console.log(`    ${i + 1}. ${s.title} — ${s.url}`));
  }

  return {
    id: Number(result.lastInsertRowid),
    slug: finalSlug,
    title: article.title,
    topic: article.topic,
    wordCount,
    sources: allSources,
  };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const topic = args[0];
  const shouldPublish = process.argv.includes("--publish");

  if (!topic) {
    printUsage();
    process.exit(1);
  }

  try {
    await generateGroundedArticle(topic, { publish: shouldPublish });
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// Only run main when executed directly, not when imported
const isDirectRun = process.argv[1]?.includes("generate-grounded-article");
if (isDirectRun) {
  main();
}
