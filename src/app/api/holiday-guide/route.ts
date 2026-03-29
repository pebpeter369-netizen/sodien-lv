import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { holidays } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/claude";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const db = getDb();
  const [holiday] = await db
    .select()
    .from(holidays)
    .where(eq(holidays.slug, slug))
    .limit(1);

  if (!holiday) {
    return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
  }

  // Check if traditions already has a guide (cached)
  if (holiday.traditions && holiday.traditions.includes("celebration-guide")) {
    return NextResponse.json({ guide: holiday.traditions, cached: true });
  }

  const systemPrompt = `Tu esi Latvijas kultūras un tradīciju eksperts. Uzraksti praktisku svētku svinēšanas ceļvedi latviešu valodā.

Prasības:
- 3-4 sadaļas ar H3 virsrakstiem
- Sadaļas: Tradīcijas un nozīme, Ēdieni un receptes (2-3 tradicionāli ēdieni ar īsu aprakstu), Aktivitātes un idejas, Dāvanu idejas (ja piemēroti)
- Konkrēti, praktiski padomi — nevis vispārīgi
- Latviskā kontekstā — atsauces uz Latvijas tradīcijām
- HTML formatējums: <h3>, <p>, <ul>, <li>
- ATBILDI tikai ar HTML, bez JSON vai markdown`;

  const prompt = `Uzraksti svinēšanas ceļvedi svētkam: ${holiday.name}. ${holiday.description ? "Apraksts: " + holiday.description.replace(/<[^>]+>/g, "").substring(0, 200) : ""}`;

  try {
    const guide = await generateContent(systemPrompt, prompt);

    // Cache in database
    const existingTraditions = holiday.traditions || "";
    const fullContent = `${existingTraditions}<div class="celebration-guide">${guide}</div>`;

    await db
      .update(holidays)
      .set({ traditions: fullContent })
      .where(eq(holidays.slug, slug));

    return NextResponse.json({ guide: fullContent, cached: false });
  } catch (error) {
    console.error("Holiday guide error:", error);
    return NextResponse.json(
      { error: "Neizdevās ģenerēt ceļvedi" },
      { status: 500 }
    );
  }
}
