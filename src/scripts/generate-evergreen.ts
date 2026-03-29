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

const SYSTEM_PROMPT = `Tu esi pieredzējis latviešu satura veidotājs, kas specializējas praktiskos, izglītojošos rakstos. Tavs mērķis ir radīt ilgmūžīgu (evergreen) saturu, kas ir noderīgs Latvijas iedzīvotājiem gadiem ilgi.

SVARĪGI — informācijas pievienotā vērtība:
- Pirms rakstīšanas identificē vienu konkrētu aspektu par šo tēmu, ko Latvijas lielākie portāli (apollo.lv, tvnet.lv, nra.lv) apskata nepilnīgi vai neapskata vispār
- Raksti no šī unikālā skatu punkta — neatkārto to pašu, ko var atrast 10 citos rakstos
- Iekļauj vismaz vienu datu punktu, kas ir grūti atrodams vienuviet (piemēram, salīdzinājums ar Igauniju/Lietuvu, reģionālās atšķirības Latvijā, vēsturiskā tendence)
- Obligāti iekļauj sadaļu "Kāpēc tas ir svarīgi Latvijā" ar Latvijas specifiku, ne vispārīgu informāciju

Raksta prasības:
- Garums: 600-1200 vārdi
- Valoda: Gramatiski pareiza latviešu valoda, dabiska un lasāma
- Struktūra: H2 un H3 apakšvirsraksti, īsas rindkopas (2-3 teikumi)
- Tonis: Praktisks, informatīvs, draudzīgs — kā gudrs padomdevējs
- Saturs: Konkrēti padomi, skaitļi, piemēri, soļi — ar Latvijas kontekstu
- SEO: Dabīgi iekļauj atslēgvārdus virsrakstos un tekstā
- Saites: Iekļauj iekšējās saites uz /algu-kalkulators, /svetku-dienas, /varda-dienas kur tas ir loģiski
- Saraksti: Izmanto <ul> un <ol> kur tas uzlabo lasāmību
- NEIZMANTO: Sensacionālismus, clickbait, viedokļus bez pamatojuma
- Katram rakstam jābūt unikālam un ar reālu pievienoto vērtību lasītājam

Atbildi TIKAI ar JSON objektu (bez markdown, bez komentāriem):
{
  "title": "SEO optimizēts virsraksts (50-65 rakstzīmes)",
  "meta_description": "Meta apraksts (140-160 rakstzīmes)",
  "excerpt": "2-3 teikumu kopsavilkums",
  "content": "Pilns HTML saturs ar <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <a> tagiem.",
  "topic": "economy|society|culture|technology|environment|politics|eu|sports",
  "suggested_slug": "url-slug-bez-diakritikas"
}`;

async function generateEvergreenArticle(
  topic: string,
  options: { publish?: boolean } = {}
) {
  const shouldPublish = options.publish ?? true;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }

  console.log(`Generating evergreen article: "${topic}"`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Uzraksti praktisku, izglītojošu rakstu par šo tēmu: ${topic}

Pirms rakstīšanas: identificē vienu aspektu par šo tēmu, kas Latvijā ir maz vai nepilnīgi apskatīts. Raksti no tā skatu punkta.

Prasības:
- Rakstam jābūt noderīgam Latvijas iedzīvotājiem vairākus gadus
- Iekļauj konkrētus skaitļus, piemērus un praktiskus padomus ar Latvijas kontekstu
- Salīdzini ar Igauniju vai Lietuvu kur tas ir relevanti
- Iekļauj vismaz vienu datu punktu, ko grūti atrast vienuviet latviešu valodā`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No text response from Gemini");

  // Extract grounding sources
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const sources: { title: string; url: string }[] = [];

  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        const url = chunk.web.uri;
        if (url.includes("google.com/search?q=time")) continue;
        if (!sources.some((s) => s.title === chunk.web!.title)) {
          sources.push({ title: chunk.web.title, url });
        }
      }
    }
  }

  // Resolve redirect URLs
  const resolvedSources = await Promise.all(
    sources.map(async (s) => {
      if (!s.url.includes("vertexaisearch") && !s.url.includes("grounding-api-redirect")) {
        return s;
      }
      try {
        const res = await fetch(s.url, { method: "HEAD", redirect: "follow" });
        return { title: s.title, url: res.url || s.url };
      } catch {
        return s;
      }
    })
  );

  // Parse JSON with robust extraction
  const article = parseArticleJson(text);

  // Fetch thumbnail
  const image = await fetchUnsplashImage(article.title, article.topic);

  // Clean slug
  const slug = article.suggested_slug
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const existingSlugs = new Set(
    db.select({ slug: schema.articles.slug }).from(schema.articles).all().map((a) => a.slug)
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
      type: "evergreen",
      sourceUrls: JSON.stringify(resolvedSources),
      thumbnailUrl: image?.url || null,
      thumbnailAuthor: image?.author || null,
      status: shouldPublish ? "published" : "draft",
      publishedAt: shouldPublish ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const wordCount = article.content.replace(/<[^>]*>/g, "").split(/\s+/).filter((w: string) => w.length > 0).length;

  console.log(`  ✓ ${article.title} (~${wordCount} words, ${resolvedSources.length} sources${image ? ', with image' : ''})`);

  return { id: Number(result.lastInsertRowid), slug: finalSlug, title: article.title };
}

// Evergreen topic library — practical content that ties tools together
const EVERGREEN_TOPICS = [
  // Salary & Finance (links to /algu-kalkulators)
  "Kā sarunāt augstāku algu Latvijā — praktisks ceļvedis",
  "Pirmā darba alga Latvijā — ko sagaidīt un kā plānot budžetu",
  "Kā saprast savu algas lapiņu — visi ieturējumi paskaidroti",
  "Ģimenes budžeta plānošana Latvijā — praktiski padomi",
  "Kas notiek ar tavu algu, ja strādā nepilnu darba laiku",
  // Holidays (links to /svetku-dienas)
  "Garās brīvdienas Latvijā — kā plānot atvaļinājumu efektīvi",
  "Latvijas valsts svētki — ko svin un kāpēc",
  "Lieldienu tradīcijas Latvijā — no olu krāsošanas līdz šūpolēm",
  "Jāņu svinēšana — tradīcijas, ēdieni un mūsdienu Līgo",
  "Ziemassvētku tradīcijas Latvijā — no Adventes līdz Vecgada vakaram",
  // Name days (links to /varda-dienas)
  "Kā apsveikt vārda dienā — tradīcijas un modernās idejas",
  "Populārākie latviešu vārdi un to nozīme",
  "Vārda dienas vs dzimšanas diena — Latvijas unikālā tradīcija",
  "Kā izvēlēties vārdu bērnam Latvijā — padomi vecākiem",
  // Practical guides
  "Darba līguma veidi Latvijā — ko tev vajag zināt",
  "Atvaļinājuma nauda Latvijā — aprēķins un tiesības",
  "Slimības lapa Latvijā — kā noformēt un cik saņemsi",
  "Bērna kopšanas pabalsts Latvijā — summas un nosacījumi",
  "Kā reģistrēt uzņēmumu Latvijā — soļi un izmaksas",
  "Nekustamā īpašuma nodoklis Latvijā — likmes pēc novadiem",
];

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  let topics: string[];
  const countArg = args.length === 1 && /^\d+$/.test(args[0]) ? parseInt(args[0]) : null;

  if (args.length > 0 && !countArg) {
    // Custom topic provided
    topics = [args.join(" ")];
  } else {
    // Use built-in library — find topics we haven't written about yet
    const existingTitles = new Set(
      db.select({ title: schema.articles.title }).from(schema.articles).all().map((a) => a.title.toLowerCase())
    );

    topics = EVERGREEN_TOPICS.filter(
      (t) => !existingTitles.has(t.toLowerCase())
    );

    const count = countArg || 5;
    topics = topics.slice(0, count);
  }

  if (topics.length === 0) {
    console.log("All evergreen topics already generated!");
    return;
  }

  console.log(`Generating ${topics.length} evergreen articles...\n`);

  let success = 0;
  for (const topic of topics) {
    try {
      await generateEvergreenArticle(topic);
      success++;
    } catch (error) {
      console.log(`  ✗ ${topic}: ${error instanceof Error ? error.message : error}`);
    }
    // Brief delay between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone! ${success}/${topics.length} articles generated.`);
  sqlite.close();
}

main();
