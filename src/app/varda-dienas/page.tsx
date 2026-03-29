import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/ui/NewsletterSignup";
import { CompactShareButtons } from "@/components/ui/ShareButtons";
import { SearchBar } from "@/components/ui/SearchBar";
import { CalendarSection } from "./CalendarSection";
import {
  formatLatvianDate,
  getLatvianMonthGenitive,
} from "@/lib/dates";
import nameDaysData from "@/data/name-days.json";

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Vārda dienu kalendārs ${currentYear} — Latvijas oficiālais saraksts`,
  description: `Latvijas vārda dienu kalendārs ${currentYear}. gadam. Uzzini šodienas un rītdienas vārda dienas, meklē pēc vārda un pārlūko visu gadu pa mēnešiem. Vairāk nekā 700 vārdu.`,
};

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

function getTodayAndTomorrow() {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowMonth = tomorrow.getMonth() + 1;
  const tomorrowDay = tomorrow.getDate();

  const todayEntry = (nameDaysData as NameDayEntry[]).find(
    (nd) => nd.month === todayMonth && nd.day === todayDay
  );
  const tomorrowEntry = (nameDaysData as NameDayEntry[]).find(
    (nd) => nd.month === tomorrowMonth && nd.day === tomorrowDay
  );

  return { today: todayEntry, tomorrow: tomorrowEntry };
}

export default function NameDaysPage() {
  const { today, tomorrow } = getTodayAndTomorrow();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Today's name days */}
      <section className="text-center mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-3">
          Vārda dienu kalendārs {currentYear}
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
          Latvijas vārda dienu kalendārs ir sastādīts atbilstoši Latvijas
          Zinātņu akadēmijas Latviešu valodas institūta apstiprinātajam
          sarakstam. Katram kalendāra datumam ir piešķirti viens vai vairāki
          vārdi — kopā vairāk nekā 700 unikālu vārdu. Vārda diena Latvijā ir
          tradicionāla svinēšanas reize, ko daudzi latvieši uzskata par tikpat
          nozīmīgu kā dzimšanas dienu.
        </p>

        {today && (
          <div className="bg-accent-light border border-accent/15 rounded-xl p-8 mb-4">
            <p className="text-accent-dark text-sm font-medium mb-2">
              Šodien, {formatLatvianDate(new Date())}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 mb-5">
              {today.names.map((name) => (
                <Link
                  key={name}
                  href={`/varda-dienas/${name.toLowerCase()}`}
                  className="name-highlight font-heading text-4xl sm:text-5xl font-bold text-primary hover:text-primary-light transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {today.names.map((name) => (
                <Link
                  key={name}
                  href={`/varda-dienas/${name.toLowerCase()}`}
                  className="inline-flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-full px-4 py-2 text-sm text-primary transition-colors"
                >
                  Apsveikt {name} →
                </Link>
              ))}
            </div>
            <p className="text-text-muted text-xs mt-4">
              Uzzini vārda nozīmi, ģenerē apsveikumu un dalies ar draugiem
            </p>
          </div>
        )}

        {tomorrow && (
          <div className="bg-bg-secondary rounded-xl p-4 inline-flex items-center gap-2 flex-wrap justify-center">
            <span className="text-text-secondary">
              Rīt vārda dienu svin:{" "}
            </span>
            {tomorrow.names.map((name, i) => (
              <span key={name}>
                <Link
                  href={`/varda-dienas/${name.toLowerCase()}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {name}
                </Link>
                {i < tomorrow.names.length - 1 && <span>, </span>}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Search */}
      <section className="max-w-md mx-auto mb-10">
        <SearchBar
          placeholder="Atrodi savu vārda dienu..."
          basePath="/varda-dienas"
        />
      </section>

      {/* Calendar section with grid/list toggle */}
      <section className="mt-8">
        <CalendarSection nameDaysData={nameDaysData as NameDayEntry[]} />
      </section>

      {/* FAQ Section */}
      <section className="mt-12 max-w-3xl mx-auto">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Biežāk uzdotie jautājumi par vārda dienām
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kas ir vārda diena?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Vārda diena ir datums Latvijas vārda dienu kalendārā, kas
              piešķirts konkrētam vārdam. Latvijā vārda diena tiek svinēta
              līdzīgi kā dzimšanas diena — cilvēku apsveic ģimene, draugi un
              kolēģi, dāvina ziedus un nelielas dāvanas. Tradīcijas pirmsākumi
              ir saistīti ar kristīgo svēto kalendāru, taču mūsdienās tā ir
              laicīga kultūras tradīcija.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Cik vārdu ir Latvijas vārda dienu kalendārā?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Latvijas oficiālajā vārda dienu kalendārā ir vairāk nekā 700
              unikālu vārdu, kas sadalīti pa visām 366 gada dienām (ieskaitot
              29. februāri). Katrai dienai var būt piešķirti no viena līdz
              četriem vai pat pieciem vārdiem. Kalendāru uztur un aktualizē
              Latvijas Zinātņu akadēmijas Latviešu valodas institūts.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kāda ir atšķirība starp vārda dienu un dzimšanas dienu?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Dzimšanas diena ir individuāla — tā ir datums, kad cilvēks ir
              piedzimis. Vārda diena ir datums kalendārā, kas piešķirts
              konkrētam vārdam, un visi cilvēki ar šo vārdu to svin vienā
              dienā. Latvijā vārda diena bieži tiek svinēta plašāk nekā
              dzimšanas diena, jo tās datums ir vispārzināms un viegli
              atrodams kalendārā.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kā atrast savu vārda dienu?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Izmanto meklēšanas lauku šīs lapas augšdaļā — ievadi savu vārdu
              un tev tiks parādīts precīzs datums. Vari arī pārlūkot kalendāru
              pa mēnešiem un atrast savu vārdu sarakstā. Katram vārdam ir
              individuāla lapa ar detalizētu informāciju par vārda izcelsmi un
              nozīmi.
            </p>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mt-8 max-w-3xl mx-auto border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Noderīgi rīki</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/algu-kalkulators"
            className="text-sm text-primary hover:underline"
          >
            &#128176; Algu kalkulators — bruto un neto aprēķins
          </Link>
          <Link
            href="/svetku-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#128197; Svētku dienas un brīvdienas Latvijā
          </Link>
        </div>
      </section>

      {/* Newsletter signup */}
      <section className="mt-8 max-w-3xl mx-auto">
        <NewsletterSignup variant="card" />
      </section>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Kas ir vārda diena?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Vārda diena ir datums Latvijas vārda dienu kalendārā, kas piešķirts konkrētam vārdam. Latvijā vārda diena tiek svinēta līdzīgi kā dzimšanas diena — cilvēku apsveic ģimene, draugi un kolēģi.",
                },
              },
              {
                "@type": "Question",
                name: "Cik vārdu ir Latvijas vārda dienu kalendārā?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Latvijas oficiālajā vārda dienu kalendārā ir vairāk nekā 700 unikālu vārdu, kas sadalīti pa visām 366 gada dienām.",
                },
              },
              {
                "@type": "Question",
                name: "Kāda ir atšķirība starp vārda dienu un dzimšanas dienu?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Dzimšanas diena ir individuāla — datums, kad cilvēks ir piedzimis. Vārda diena ir kalendāra datums, kas piešķirts konkrētam vārdam, un visi ar šo vārdu to svin vienā dienā.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
