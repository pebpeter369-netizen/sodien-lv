import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { GoogleGenAI } from "@google/genai";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const SYSTEM_PROMPT = `Tu esi pieredzējis latviešu žurnālists un satura veidotājs. Tavs uzdevums ir rakstīt informatīvus, SEO optimizētus rakstus latviešu valodā.

Raksta prasības:
- Garums: 800-1500 vārdi
- Valoda: Gramatiski pareiza latviešu valoda, dabiska un lasāma
- Struktūra: Izmanto H2 un H3 apakšvirsrakstus, īsas rindkopas (2-4 teikumi katrā)
- Tonis: Informatīvs, neitrāls, praktiski noderīgs
- Saturs: Praktiska, detalizēta informācija, ko cilvēki meklē Google
- SEO: Dabīgi iekļauj atslēgvārdus virsrakstos un tekstā. Raksta pirmajā rindkopā iekļauj galveno atslēgvārdu.
- Saites: Ja piemēroti, iekļauj iekšējās saites uz citām lapām (piem. /algu-kalkulators, /svetku-dienas, /varda-dienas)
- Saraksti: Izmanto <ul> un <ol> sarakstus, kur tas ir loģiski
- Tabulas: Izmanto <table> ar <thead> un <tbody>, kur dati ir labāk pārskatāmi tabulā
- NEIZMANTO: Clickbait virsrakstus, pārspīlējumus, nepamatotus apgalvojumus

Atbildi TIKAI ar JSON objektu (bez markdown, bez komentāriem, bez paskaidrojumiem pirms vai pēc JSON):
{
  "title": "SEO optimizēts virsraksts latviešu valodā (50-65 rakstzīmes)",
  "meta_description": "Meta apraksts meklētājprogrammām (140-160 rakstzīmes)",
  "excerpt": "2-3 teikumu kopsavilkums, kas iedrošina klikšķināt",
  "content": "Pilns raksta HTML saturs ar <h2>, <h3>, <p>, <ul>, <ol>, <table>, <strong> tagiem. Vismaz 800 vārdi.",
  "topic": "politics|economy|sports|culture|technology|society|eu|environment",
  "suggested_slug": "url-slug-latviesu-valoda-bez-diakritikas"
}`;

const EVERGREEN_TOPICS = [
  {
    prompt:
      "Kā aprēķināt neto algu Latvijā 2025. gadā — pilns ceļvedis ar piemēriem un tabulām",
    keyword: "neto-alga",
  },
  {
    prompt:
      "Latvijas svētku dienas 2025 — pilns saraksts ar datumiem un garām brīvdienām",
    keyword: "svetku-dienas-2025",
  },
  {
    prompt:
      "Vārda dienu tradīcijas Latvijā — vēsture un mūsdienu svinēšana",
    keyword: "varda-dienu-tradicijas",
  },
  {
    prompt:
      "Kad ir Lieldienas 2025, 2026 un 2027? Datumi un tradīcijas",
    keyword: "lieldienas",
  },
  {
    prompt:
      "Darba likums Latvijā — darbinieka pamattiesības un pienākumi",
    keyword: "darba-likums",
  },
  {
    prompt:
      "Slimības lapa Latvijā — kā noformēt, kā aprēķināt slimības pabalstu, termiņi",
    keyword: "slimibas-lapa",
  },
  {
    prompt:
      "Bērna kopšanas atvaļinājums Latvijā — ilgums, pabalsti, tēva tiesības un pieteikšanās",
    keyword: "berna-kopsanas-atvalinajums",
  },
  {
    prompt:
      "Nekustamā īpašuma nodoklis Latvijā — likmes, aprēķins, atlaides un samaksas termiņi",
    keyword: "nekustama-ipasuma-nodoklis",
  },
  {
    prompt:
      "Autoapliecības iegūšana Latvijā — soļi, izmaksas, eksāmeni un padomi",
    keyword: "autoaplieci",
  },
  {
    prompt:
      "Latvijas iedzīvotāju skaits — statistika, tendences, lielākās pilsētas",
    keyword: "iedzivotaju-skaits",
  },
  {
    prompt:
      "Minimālā alga Latvijā 2025 — bruto un neto summa, salīdzinājums ar iepriekšējiem gadiem un ES",
    keyword: "minimala-alga",
  },
  {
    prompt:
      "PVN likmes Latvijā — standarta, samazinātā un nulles likme, kas jāzina uzņēmējam",
    keyword: "pvn-likmes",
  },
  {
    prompt:
      "Pensijas aprēķins Latvijā — kā aprēķināt savu pensiju, 1., 2. un 3. līmenis",
    keyword: "pensijas-apreksin",
  },
  {
    prompt:
      "Uzņēmuma reģistrācija Latvijā — SIA dibināšana, soļi, izmaksas un dokumenti",
    keyword: "uznemuma-registracija",
  },
  {
    prompt:
      "Pilsonības iegūšana Latvijā — naturalizācija, prasības, eksāmens un termiņi",
    keyword: "pilsonibas-iegusana",
  },
];

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is required.");
    console.error("Set it in .env.local or pass directly:");
    console.error(
      "  GEMINI_API_KEY=... npx tsx src/scripts/seed-evergreen.ts"
    );
    process.exit(1);
  }

  const forceAll = process.argv.includes("--force");

  // Check which articles already exist (resume capability)
  const existingArticles = db
    .select({ slug: schema.articles.slug })
    .from(schema.articles)
    .all();
  const existingSlugs = new Set(existingArticles.map((a) => a.slug));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let created = 0;
  let skipped = 0;
  const startTime = Date.now();

  console.log(
    `Generating ${EVERGREEN_TOPICS.length} evergreen articles with gemini-2.5-flash...\n`
  );

  for (let i = 0; i < EVERGREEN_TOPICS.length; i++) {
    const { prompt: topicPrompt, keyword } = EVERGREEN_TOPICS[i];

    // Skip if an article with a matching slug keyword already exists
    if (!forceAll) {
      const alreadyExists = existingArticles.some((a) =>
        a.slug.includes(keyword)
      );
      if (alreadyExists) {
        console.log(
          `[${i + 1}/${EVERGREEN_TOPICS.length}] SKIP (exists): ${keyword}`
        );
        skipped++;
        continue;
      }
    }

    console.log(
      `[${i + 1}/${EVERGREEN_TOPICS.length}] Generating: ${topicPrompt.substring(0, 60)}...`
    );

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
        contents: `Raksti detalizētu, SEO optimizētu evergreen rakstu par šo tēmu: ${topicPrompt}

Pārliecinies, ka raksts ir vismaz 800 vārdu garš un satur praktiskus piemērus, skaitļus un konkrētu informāciju, kas būtu noderīga Latvijas iedzīvotājam.`,
      });

      const text = response.text;
      if (!text) {
        console.error("  No text response, skipping...");
        continue;
      }

      // Parse JSON — handle potential markdown wrapping
      let jsonText = text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText
          .replace(/^```json?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const article = JSON.parse(jsonText);
      const now = new Date();

      // Ensure slug doesn't have diacritics
      const slug = (article.suggested_slug || keyword)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Check for duplicate slug
      const slugExists = existingSlugs.has(slug);
      const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

      db.insert(schema.articles)
        .values({
          slug: finalSlug,
          title: article.title,
          metaDescription: article.meta_description.substring(0, 160),
          content: article.content,
          excerpt: article.excerpt,
          topic: article.topic,
          type: "evergreen",
          status: "published",
          publishedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      existingSlugs.add(finalSlug);
      created++;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(
        `  ✓ Created: "${article.title}" → /aktualitates/${finalSlug} (${elapsed}s elapsed)`
      );

      // Rate limiting — wait 2 seconds between requests
      if (i < EVERGREEN_TOPICS.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error}`);
      // Wait longer on error (rate limit?)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done in ${totalTime}s!`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${EVERGREEN_TOPICS.length - created - skipped}`);
  sqlite.close();
}

main().catch(console.error);
