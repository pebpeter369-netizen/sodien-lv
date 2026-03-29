import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import { GoogleGenAI } from "@google/genai";
import nameDaysData from "../data/name-days.json";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const SYSTEM_PROMPT = `Tu esi latviešu vārdu eksperts. Sniedz īsu informāciju par latviešu vārdu.

Atbildi TIKAI ar JSON (bez markdown):
{
  "origin": "Vārda izcelsme (piem. 'Latviskas izcelsmes vārds', 'Ģermāniskas izcelsmes', 'Grieķu izcelsmes')",
  "meaning": "Vārda nozīme (1-2 teikumi)",
  "famous_persons": ["Pazīstami latvieši ar šo vārdu"],
  "popularity": "common|uncommon|rare",
  "description": "<p>Īss HTML apraksts (2-3 teikumi) par vārdu — piemērots attēlošanai vārda lapā. Var ietvert izcelsmi, nozīmi un interesantus faktus.</p>"
}`;

const forceFlag = process.argv.includes("--force");

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is required.");
    console.error("Set it in .env.local or pass directly:");
    console.error(
      "  GEMINI_API_KEY=... npx tsx src/scripts/enrich-names.ts"
    );
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Get all unique names
  const allNames = new Set<string>();
  for (const entry of nameDaysData as { names: string[] }[]) {
    for (const name of entry.names) {
      allNames.add(name);
    }
  }

  const nameList = Array.from(allNames).sort();

  // Resume capability — check which names already have entries
  let namesToProcess: string[];
  if (forceFlag) {
    namesToProcess = nameList;
    console.log(
      `--force flag set, re-processing all ${nameList.length} names.\n`
    );
  } else {
    const existingRows = db
      .select({ name: schema.nameDetails.name })
      .from(schema.nameDetails)
      .all();
    const existingNames = new Set(existingRows.map((r) => r.name));
    namesToProcess = nameList.filter((n) => !existingNames.has(n));
    const skipped = nameList.length - namesToProcess.length;
    if (skipped > 0) {
      console.log(
        `Skipping ${skipped} names that already have entries (use --force to re-process).`
      );
    }
    if (namesToProcess.length === 0) {
      console.log("All names already enriched. Nothing to do.");
      sqlite.close();
      return;
    }
    console.log(`Enriching ${namesToProcess.length} names with gemini-3.1-flash-lite-preview...\n`);
  }

  // Process in batches of 10 names per request to save API calls
  const batchSize = 10;
  let processed = 0;
  const totalNames = namesToProcess.length;
  const totalBatches = Math.ceil(totalNames / batchSize);
  const startTime = Date.now();

  for (let i = 0; i < totalNames; i += batchSize) {
    const batch = namesToProcess.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const pct = Math.round((i / totalNames) * 100);

    let eta = "";
    if (processed > 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = (totalNames - processed) / rate;
      eta = ` | ETA: ${formatTime(remaining)}`;
    }

    console.log(
      `[${batchNum}/${totalBatches}] ${pct}%${eta} — Processing: ${batch.join(", ")}`
    );

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction: `${SYSTEM_PROMPT}\n\nAtbildi ar JSON masīvu — katram vārdam viens objekts. Masīva secība atbilst vārdu secībai pieprasījumā.`,
          temperature: 0.5,
        },
        contents: `Sniedz informāciju par šiem latviešu vārdiem: ${batch.join(", ")}`,
      });

      const text = response.text;
      if (!text) continue;

      // Parse JSON — handle potential markdown wrapping
      let jsonText = text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText
          .replace(/^```json?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const results = JSON.parse(jsonText);

      for (let j = 0; j < batch.length; j++) {
        const name = batch[j];
        const info = Array.isArray(results) ? results[j] : results;
        if (!info) continue;

        const values = {
          name,
          origin: info.origin || null,
          meaning: info.meaning || null,
          famousPersons: info.famous_persons
            ? JSON.stringify(info.famous_persons)
            : null,
          popularity: info.popularity || null,
          description: info.description || null,
        };

        db.insert(schema.nameDetails)
          .values(values)
          .onConflictDoUpdate({
            target: schema.nameDetails.name,
            set: {
              origin: values.origin,
              meaning: values.meaning,
              famousPersons: values.famousPersons,
              popularity: values.popularity,
              description: values.description,
            },
          })
          .run();

        processed++;
      }

      console.log(`  ✓ Processed ${batch.length} names`);

      // Rate limiting
      if (i + batchSize < totalNames) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error}`);
      // Wait longer on error
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const elapsed = formatTime((Date.now() - startTime) / 1000);
  console.log(`\nDone! Enriched ${processed} names in ${elapsed}.`);
  sqlite.close();
}

main().catch(console.error);
