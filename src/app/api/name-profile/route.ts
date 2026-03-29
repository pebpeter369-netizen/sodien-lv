import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nameDetails } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/claude";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const db = getDb();

  // Check if we already have a description (cached profile)
  const [existing] = await db
    .select()
    .from(nameDetails)
    .where(eq(nameDetails.name, name))
    .limit(1);

  if (existing?.description && existing.description.includes("personality")) {
    // Already generated — return cached
    return NextResponse.json({ profile: existing.description, cached: true });
  }

  // Generate personality profile
  const systemPrompt = `Tu esi radošs latviešu kultūras eksperts. Tavs uzdevums ir radīt interesantu un izklaidi vārda "personības profilu" latviešu valodā.

Prasības:
- 3-4 teikumi par rakstura iezīmēm, kas asociējas ar šo vārdu
- Balstīts uz vārda nozīmi, izcelsmi un kultūras asociācijām
- Tonis: pozitīvs, patīkams, ar humora pieskaņu
- Viegli pārspīlēts — tas ir izklaides saturs, ne horoskops
- ATBILDI tikai ar tekstu, bez JSON vai markdown`;

  let context = `Uzraksti īsu personības profilu cilvēkam ar vārdu ${name}.`;
  if (existing?.origin) context += ` Vārda izcelsme: ${existing.origin}.`;
  if (existing?.meaning) context += ` Vārda nozīme: ${existing.meaning}.`;

  try {
    const profile = await generateContent(systemPrompt, context);

    // Cache it in the database
    if (existing) {
      await db
        .update(nameDetails)
        .set({ description: `<personality>${profile.trim()}</personality>${existing.description || ""}` })
        .where(eq(nameDetails.name, name));
    }

    return NextResponse.json({ profile: profile.trim(), cached: false });
  } catch (error) {
    console.error("Name profile error:", error);
    return NextResponse.json(
      { error: "Neizdevās ģenerēt profilu" },
      { status: 500 }
    );
  }
}
