import { NextResponse } from "next/server";
import { generateContent } from "@/lib/claude";
import { getTodayInLatvia } from "@/lib/dates";
import fs from "fs";
import path from "path";

// Cache directory for generated history
const CACHE_DIR = path.join(process.cwd(), "data", "history-cache");

function getCacheKey(month: number, day: number): string {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function GET() {
  const now = getTodayInLatvia();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const cacheKey = getCacheKey(month, day);
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);

  // Check cache
  try {
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      return NextResponse.json({ events: cached, cached: true });
    }
  } catch { /* regenerate */ }

  // Generate
  const systemPrompt = `Tu esi Latvijas vēstures eksperts. Uzraksti 3-5 nozīmīgus vēsturiskus notikumus, kas notikuši šajā datumā Latvijā vai pasaulē ar saistību ar Latviju.

Prasības:
- Katram notikumam: gads un 1-2 teikumu apraksts
- Prioritāte: Latvijas vēsture > Baltijas vēsture > pasaules notikumi ar ietekmi uz Latviju
- Faktoloģiski precīzi — tikai reāli notikumi
- Latviešu valodā

Atbildi TIKAI ar JSON masīvu:
[{"year": 1918, "event": "Apraksts par notikumu..."}]`;

  const prompt = `Kādi nozīmīgi vēsturiski notikumi notikuši ${day}. ${getLatvianMonth(month)}?`;

  try {
    const result = await generateContent(systemPrompt, prompt);

    let events: { year: number; event: string }[];
    try {
      let jsonText = result.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
      }
      const first = jsonText.indexOf("[");
      const last = jsonText.lastIndexOf("]");
      if (first !== -1 && last !== -1) {
        jsonText = jsonText.substring(first, last + 1);
      }
      events = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ events: [], error: "Parse failed" });
    }

    // Cache for future requests
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(cacheFile, JSON.stringify(events));
    } catch { /* non-critical */ }

    return NextResponse.json({ events, cached: false });
  } catch (error) {
    console.error("History generation error:", error);
    return NextResponse.json({ events: [], error: "Generation failed" });
  }
}

function getLatvianMonth(month: number): string {
  const months = [
    "", "janvārī", "februārī", "martā", "aprīlī", "maijā", "jūnijā",
    "jūlijā", "augustā", "septembrī", "oktobrī", "novembrī", "decembrī",
  ];
  return months[month] || "";
}
