import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/claude";

const TONES = {
  formal: "formāls, pieklājīgs, cieņpilns",
  warm: "silts, sirsnīgs, ģimenisks",
  funny: "jautrs, humoristisks, ar asprātību",
  poetic: "poētisks, romantisks, ar metaforām",
  short: "īss un kodolīgs — 1-2 teikumi",
} as const;

const RELATIONSHIPS = {
  friend: "draugs/draudzene",
  family: "ģimenes loceklis (mamma, tētis, brālis, māsa u.c.)",
  colleague: "kolēģis/kolēģe darbā",
  partner: "mīļotais/mīļotā, dzīvesbiedrs",
  boss: "priekšnieks/priekšniece",
  child: "bērns",
  grandparent: "vecmamma/vectēvs",
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tone, relationship, nameOrigin, nameMeaning } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Vārds ir obligāts" }, { status: 400 });
    }

    const toneDesc = TONES[tone as keyof typeof TONES] || TONES.warm;
    const relDesc = RELATIONSHIPS[relationship as keyof typeof RELATIONSHIPS] || "";

    const systemPrompt = `Tu esi radošs latviešu valodas speciālists. Tavs uzdevums ir radīt unikālus, skaistus vārda dienas apsveikumus latviešu valodā.

Prasības:
- Valoda: gramatiski pareiza, dabiska latviešu valoda
- Garums: 2-4 teikumi (ja nav norādīts īss)
- Tonis: ${toneDesc}
- Nekad neizmanto klišejiskas frāzes kā "Lai tava dzīve ir pilna..."
- Katrs apsveikums ir unikāls un personalizēts
- Ja zināma vārda nozīme vai izcelsme — iekļauj to radoši

Atbildi TIKAI ar JSON masīvu (bez markdown):
["Apsveikums 1", "Apsveikums 2", "Apsveikums 3"]`;

    let context = `Uzraksti 3 unikālus vārda dienas apsveikumus personai vārdā ${name}.`;

    if (relDesc) {
      context += ` Šī persona man ir ${relDesc}.`;
    }
    if (nameOrigin) {
      context += ` Vārda izcelsme: ${nameOrigin}.`;
    }
    if (nameMeaning) {
      context += ` Vārda nozīme: ${nameMeaning}.`;
    }

    const result = await generateContent(systemPrompt, context);

    // Parse the response
    let greetings: string[];
    try {
      let jsonText = result.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
      }
      const firstBracket = jsonText.indexOf("[");
      const lastBracket = jsonText.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1) {
        jsonText = jsonText.substring(firstBracket, lastBracket + 1);
      }
      greetings = JSON.parse(jsonText);
    } catch {
      // Fallback: split by newlines
      greetings = result
        .split("\n")
        .map((line) => line.replace(/^[\d\.\-\*]+\s*/, "").replace(/^["']|["']$/g, "").trim())
        .filter((line) => line.length > 10);
    }

    if (!greetings || greetings.length === 0) {
      return NextResponse.json({ error: "Neizdevās ģenerēt apsveikumus" }, { status: 500 });
    }

    return NextResponse.json({ greetings: greetings.slice(0, 3) });
  } catch (error) {
    console.error("Greeting generation error:", error);
    return NextResponse.json(
      { error: "Kaut kas nogāja greizi. Mēģini vēlreiz." },
      { status: 500 }
    );
  }
}
