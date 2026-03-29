import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { GoogleGenAI } from "@google/genai";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const SYSTEM_PROMPT = `Tu esi pieredzējis latviešu žurnālists un satura veidotājs. Tavs uzdevums ir rakstīt informatīvus, SEO optimizētus rakstus latviešu valodā par aktuālām tēmām.

Raksta prasības:
- Garums: 800-1500 vārdi
- Valoda: Gramatiski pareiza latviešu valoda, dabiska un lasāma
- Struktūra: H2 un H3 apakšvirsraksti, īsi rindkopas (2-4 teikumi)
- Tonis: Informatīvs, neitrāls, bez sensacionālisma
- Saturs: Izskaidro kontekstu, vēsturi, kāpēc tas ir svarīgi, kas notiks tālāk
- SEO: Dabīgi iekļauj atslēgvārdus virsrakstos un tekstā. Pirmajā rindkopā — galvenais atslēgvārds.
- Saraksti: Izmanto <ul> un <ol>, kur tas ir loģiski
- Tabulas: Izmanto <table> ar <thead> un <tbody>, kur dati ir labāk pārskatāmi tabulā
- Saites: Ja piemēroti, iekļauj iekšējās saites uz /algu-kalkulators, /svetku-dienas, /varda-dienas
- NEIZMANTO: Clickbait virsrakstus, pārspīlējumus, viedokļus bez pamatojuma

Atbildi TIKAI ar JSON objektu (bez markdown, bez paskaidrojumiem):
{
  "title": "SEO optimizēts virsraksts latviešu valodā (50-65 rakstzīmes)",
  "meta_description": "Meta apraksts meklētājprogrammām (140-160 rakstzīmes)",
  "excerpt": "2-3 teikumu kopsavilkums",
  "content": "Pilns raksta HTML saturs ar <h2>, <h3>, <p>, <ul>, <strong> tagiem. Vismaz 800 vārdi.",
  "topic": "politics|economy|sports|culture|technology|society|eu|environment",
  "suggested_slug": "url-slug-bez-diakritikas"
}`;

function printUsage() {
  console.log(`
Usage: npx tsx src/scripts/generate-article.ts <topic> [options]

Options:
  --publish     Set status to 'published' immediately
  --evergreen   Mark as evergreen content (default: trending)

Examples:
  npx tsx src/scripts/generate-article.ts "Rail Baltica izmaksu pieaugums"
  npx tsx src/scripts/generate-article.ts "Inflācija Latvijā 2025" --publish
  npx tsx src/scripts/generate-article.ts "PVN likmes Latvijā" --evergreen --publish
`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const topic = args[0];
  const shouldPublish = process.argv.includes("--publish");
  const articleType = process.argv.includes("--evergreen")
    ? "evergreen"
    : "trending";

  if (!topic) {
    printUsage();
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is required.");
    console.error("Set it in .env.local or pass directly:");
    console.error(
      '  GEMINI_API_KEY=... npx tsx src/scripts/generate-article.ts "topic"'
    );
    process.exit(1);
  }

  console.log(`Generating ${articleType} article about: "${topic}"`);
  console.log(`Model: gemini-2.5-flash`);
  console.log(`Status: ${shouldPublish ? "published" : "draft"}\n`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
    contents: `Raksti detalizētu rakstu par šo tēmu: ${topic}

Pārliecinies, ka raksts ir vismaz 800 vārdu garš un satur konkrētu, aktuālu informāciju.`,
  });

  const text = response.text;
  if (!text) {
    console.error("No text response from Gemini");
    process.exit(1);
  }

  // Parse JSON — handle potential markdown wrapping
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  }

  let article;
  try {
    article = JSON.parse(jsonText);
  } catch {
    console.error("Failed to parse JSON response. Raw output:");
    console.error(text.substring(0, 500));
    process.exit(1);
  }

  // Clean slug — remove diacritics and invalid chars
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
      type: articleType,
      status: shouldPublish ? "published" : "draft",
      publishedAt: shouldPublish ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // Count words in generated content
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
  console.log(`  Type:     ${articleType}`);
  console.log(`  Status:   ${shouldPublish ? "published" : "draft"}`);
  console.log(`  Words:    ~${wordCount}`);

  if (!shouldPublish) {
    console.log(
      `\nTo publish: npx tsx src/scripts/publish-article.ts ${result.lastInsertRowid}`
    );
  }

  sqlite.close();
}

main().catch(console.error);
