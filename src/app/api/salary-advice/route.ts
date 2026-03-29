import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { position, experience, city, currentSalary } = await request.json();

    if (!position || !currentSalary) {
      return NextResponse.json(
        { error: "Amats un alga ir obligāti" },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu esi Latvijas darba tirgus eksperts un algu konsultants. Tavs uzdevums ir sniegt praktisku, konkrētu padomu par algu sarunām latviešu valodā.

Prasības:
- Atbilde 3-5 teikumos
- Iekļauj konkrētu skaitli — aptuvenu algu diapazonu šim amatam Latvijā
- Ņem vērā pieredzi un pilsētu (Rīgā algas ~15-20% augstākas)
- Sniedz 1-2 praktiskus padomus sarunām
- Tonis: profesionāls, atbalstošs
- Norādi, ka dati ir aptuveni un var atšķirties
- ATBILDI tikai ar tekstu, bez JSON vai markdown formatējuma`;

    const prompt = `Cilvēks strādā kā ${position}${experience ? ` ar ${experience} gadu pieredzi` : ""}${city ? ` pilsētā ${city}` : " Latvijā"}. Viņa pašreizējā bruto alga ir €${currentSalary} mēnesī. Vai tā ir adekvāta? Ko ieteiktu sarunās par algu?`;

    const advice = await generateContent(systemPrompt, prompt);

    return NextResponse.json({ advice: advice.trim() });
  } catch (error) {
    console.error("Salary advice error:", error);
    return NextResponse.json(
      { error: "Neizdevās ģenerēt padomu" },
      { status: 500 }
    );
  }
}
