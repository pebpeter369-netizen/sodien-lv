import type { Metadata } from "next";
import Link from "next/link";
import { SalaryCalculator } from "@/components/calculators/SalaryCalculator";
import { SalaryAdvice } from "@/components/ui/SalaryAdvice";
import taxConfig from "@/data/tax-config.json";

const currentYear = taxConfig.year;

export const metadata: Metadata = {
  title: `Algu kalkulators ${currentYear} — Bruto Neto aprēķins Latvijā`,
  description: `Aprēķini savu neto algu Latvijā ${currentYear}. gadā. Bruto → neto un neto → bruto kalkulators ar aktuālajām nodokļu likmēm — IIN (25,5%, 33%), VSAOI (10,50%), neapliekamais minimums €550.`,
};

export default function SalaryCalculatorPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Sākums
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">Algu kalkulators</span>
      </nav>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-center text-text mb-3">
        Algu kalkulators {currentYear}
      </h1>
      <p className="text-center text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
        Šis algu kalkulators aprēķina neto algu no bruto algas (vai
        apgriezti), izmantojot {currentYear}. gada aktuālās Latvijas nodokļu
        likmes. Kalkulators ņem vērā darbinieka VSAOI (10,50%), iedzīvotāju
        ienākuma nodokli (progresīvā likme: 25,5% un 33%) un diferencēto
        neapliekamo minimumu (līdz €550 mēnesī).
      </p>

      <SalaryCalculator />

      {/* Tax brackets table — static SEO content */}
      <section className="mt-12 max-w-2xl mx-auto">
        <h2 className="font-heading text-2xl font-bold mb-4">
          Nodokļu likmes Latvijā {currentYear}. gadā
        </h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Latvijā iedzīvotāju ienākuma nodoklis (IIN) tiek aprēķināts
          progresīvi — jo augstāki ienākumi, jo lielāka nodokļa likme. Zemāk
          ir aktuālās IIN likmes un ienākumu slieksni.
        </p>
        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  Gada ienākumi
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  IIN likme
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  Mēneša bruto (aptuveni)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3">Līdz €105 300</td>
                <td className="px-4 py-3 font-semibold text-green-700">25,5%</td>
                <td className="px-4 py-3 text-text-muted">Līdz ~€8 775</td>
              </tr>
              <tr>
                <td className="px-4 py-3">€105 300 — €200 000</td>
                <td className="px-4 py-3 font-semibold text-yellow-700">33%</td>
                <td className="px-4 py-3 text-text-muted">~€8 775 — €16 667</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Virs €200 000</td>
                <td className="px-4 py-3 font-semibold text-red-700">36%</td>
                <td className="px-4 py-3 text-text-muted">Virs ~€16 667</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold mb-3">
          Citi nodokļi un atvieglojumi
        </h3>
        <div className="border border-border rounded-lg overflow-hidden mb-8">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-text-secondary">
                  Darbinieka VSAOI
                </td>
                <td className="px-4 py-3 font-semibold">10,50%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-secondary">
                  Darba devēja VSAOI
                </td>
                <td className="px-4 py-3 font-semibold">23,59%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-secondary">
                  Neapliekamais minimums (max)
                </td>
                <td className="px-4 py-3 font-semibold">€550 mēnesī</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-secondary">
                  Minimālā alga
                </td>
                <td className="px-4 py-3 font-semibold">€780 mēnesī</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-secondary">
                  Atvieglojums par apgādājamo
                </td>
                <td className="px-4 py-3 font-semibold">€250 mēnesī</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CSP salary distribution — static SEO content */}
      <section className="mt-12 max-w-2xl mx-auto">
        <h2 className="font-heading text-2xl font-bold mb-4">
          Algu sadalījums Latvijā {currentYear}. gadā
        </h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Saskaņā ar CSP (Centrālās statistikas pārvaldes) datiem, vidējā bruto
          alga Latvijā ir <strong>€1 680</strong>, bet mediāna —{" "}
          <strong>€1 400</strong>. Tas nozīmē, ka vairāk nekā puse strādājošo
          saņem zem €1 400 bruto mēnesī. Zemāk ir aptuvens algu sadalījums
          pēc procentīlēm.
        </p>
        <div className="border border-border rounded-lg overflow-hidden mb-4">
          <table className="w-full">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  Procentīle
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  Bruto alga
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  Nozīme
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3">10.</td>
                <td className="px-4 py-3 font-semibold">€780</td>
                <td className="px-4 py-3 text-text-muted text-sm">Minimālā alga</td>
              </tr>
              <tr>
                <td className="px-4 py-3">25.</td>
                <td className="px-4 py-3 font-semibold">€980</td>
                <td className="px-4 py-3 text-text-muted text-sm">Zemākais kvartils</td>
              </tr>
              <tr>
                <td className="px-4 py-3">50.</td>
                <td className="px-4 py-3 font-semibold">€1 400</td>
                <td className="px-4 py-3 text-text-muted text-sm">Mediāna — puse saņem mazāk</td>
              </tr>
              <tr>
                <td className="px-4 py-3">75.</td>
                <td className="px-4 py-3 font-semibold">€2 100</td>
                <td className="px-4 py-3 text-text-muted text-sm">Augšējais kvartils</td>
              </tr>
              <tr>
                <td className="px-4 py-3">90.</td>
                <td className="px-4 py-3 font-semibold">€3 200</td>
                <td className="px-4 py-3 text-text-muted text-sm">Augsti atalgoti darbinieki</td>
              </tr>
              <tr>
                <td className="px-4 py-3">95.</td>
                <td className="px-4 py-3 font-semibold">€4 500</td>
                <td className="px-4 py-3 text-text-muted text-sm">Top 5% algotāko</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">
          * Aptuveni dati, pamatojoties uz CSP publicēto algu statistiku.
          Izmanto kalkulatoru augstāk, lai redzētu savu pozīciju sadalījumā.
        </p>
      </section>

      {/* Methodology — E-E-A-T trust signal */}
      <section className="mt-8 max-w-2xl mx-auto bg-bg-secondary border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-lg mb-2">
          Mūsu metodoloģija
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed">
          Šī kalkulatora nodokļu likmes iegūtas no Ministru kabineta
          noteikumiem un VID (Valsts ieņēmumu dienesta) publicētajām
          metodiskajām norādēm. IIN progresīvās likmes, VSAOI iemaksu likmes
          un diferencētā neapliekamā minimuma formula atbilst {currentYear}. gada
          Latvijas normatīvajiem aktiem. Algu sadalījuma dati pamatojas uz CSP
          (Centrālās statistikas pārvaldes) publicēto statistiku. Kalkulatora
          precizitāte tiek regulāri pārbaudīta pret VID piemēriem.
        </p>
      </section>

      {/* Salary advice coach */}
      <section className="max-w-2xl mx-auto mt-8 mb-12">
        <SalaryAdvice />
      </section>

      {/* Expanded FAQ */}
      <section className="max-w-2xl mx-auto">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Biežāk uzdotie jautājumi
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kā aprēķināt neto algu Latvijā?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              No bruto algas vispirms tiek atņemtas darbinieka valsts sociālās
              apdrošināšanas obligātās iemaksas (VSAOI) 10,50% apmērā. Tad
              tiek piemērots diferencētais neapliekamais minimums un
              atvieglojumi par apgādājamajiem. No atlikušā apliekamā ienākuma
              tiek aprēķināts iedzīvotāju ienākuma nodoklis (IIN) pēc
              progresīvās likmes — 25,5% vai 33%. Neto alga ir summa, kas
              paliek pēc visu nodokļu atskaitīšanas.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kāda ir minimālā alga Latvijā {currentYear}. gadā?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Minimālā bruto alga Latvijā {currentYear}. gadā ir €780 mēnesī
              pilna laika darbiniekam. Pēc nodokļu atskaitīšanas tas atbilst
              aptuveni €590 neto algai (uz rokas). Minimālā alga Latvijā tiek
              pārskatīta regulāri, un tās apmēru nosaka Ministru kabinets.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kas ir neapliekamais minimums?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Neapliekamais minimums ir ienākumu daļa, no kuras netiek
              aprēķināts iedzīvotāju ienākuma nodoklis. Latvijā tas ir
              diferencēts — līdz €550 mēnesī zemāku ienākumu saņēmējiem un
              pakāpeniski samazinās, pieaugot ienākumiem. Ja bruto alga pārsniedz
              aptuveni €1 800 mēnesī, neapliekamais minimums kļūst nulle.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kas ir VSAOI un kā tā tiek aprēķināta?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              VSAOI jeb valsts sociālās apdrošināšanas obligātās iemaksas ir
              sociālais nodoklis, ko maksā gan darbinieks, gan darba devējs.
              Darbinieka daļa ir 10,50% no bruto algas, un darba devēja daļa
              ir 23,59%. VSAOI finansē pensiju sistēmu, veselības aprūpi,
              bezdarba apdrošināšanu, maternitātes un slimības pabalstus.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kā mainās neto alga, ja ir apgādājamie?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Par katru apgādājamo (bērnu, nestrādājošu laulāto u.c.) no
              apliekamā ienākuma tiek atskaitīti €250 mēnesī. Tas nozīmē, ka
              mazāka ienākumu daļa tiek aplikta ar IIN, un neto alga palielinās.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Ko nozīmē bruto alga?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Bruto alga ir darba līgumā noteiktā alga pirms nodokļu
              atskaitīšanas. Tā ietver gan darbinieka IIN, gan darbinieka
              VSAOI daļu. Bruto alga nav summa, ko darbinieks saņem uz rokas —
              to sauc par neto algu. Darba devēja kopējās izmaksas ir vēl
              lielākas, jo papildus bruto algai tiek maksāta arī darba devēja
              VSAOI daļa (23,59%).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Kādos gadījumos piemēro 33% IIN likmi?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Latvijā IIN tiek aprēķināts progresīvi. Ienākumiem līdz €105 300
              gadā (aptuveni €8 775 mēnesī) piemēro 25,5% likmi. Ienākumiem
              no €105 300 līdz €200 000 gadā piemēro 33% likmi. Ienākumiem
              virs €200 000 gadā piemēro 36% likmi (33% + 3% solidaritātes nodoklis).
              Augstākā likme attiecas tikai uz to ienākumu daļu, kas pārsniedz
              slieksni, nevis uz visu algu.
            </p>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mt-8 max-w-2xl mx-auto border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Saistīts arī</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/svetku-dienas"
            className="text-sm text-primary hover:underline"
          >
            Svētku dienas — atalgojums svētku dienā
          </Link>
          <Link
            href="/varda-dienas"
            className="text-sm text-primary hover:underline"
          >
            Vārda dienu kalendārs
          </Link>
          <Link
            href="/aktualitates"
            className="text-sm text-primary hover:underline"
          >
            Aktualitātes par ekonomiku un nodokļiem
          </Link>
        </div>
      </section>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Kā aprēķināt neto algu Latvijā?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No bruto algas tiek atņemtas darbinieka VSAOI (10,50%), piemērots neapliekamais minimums un atvieglojumi par apgādājamajiem, un no apliekamā ienākuma aprēķināts IIN (25,5% vai 33%).",
                  },
                },
                {
                  "@type": "Question",
                  name: `Kāda ir minimālā alga Latvijā ${currentYear}. gadā?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Minimālā bruto alga Latvijā ${currentYear}. gadā ir €780 mēnesī, kas atbilst aptuveni €590 neto algai.`,
                  },
                },
                {
                  "@type": "Question",
                  name: "Kas ir neapliekamais minimums?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Neapliekamais minimums ir ienākumu daļa, no kuras netiek aprēķināts IIN. Tas ir līdz €550 mēnesī zemāku ienākumu saņēmējiem un samazinās, pieaugot ienākumiem.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Kas ir VSAOI?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "VSAOI ir valsts sociālās apdrošināšanas obligātās iemaksas. Darbinieka daļa ir 10,50% no bruto algas, darba devēja — 23,59%.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Ko nozīmē bruto alga?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Bruto alga ir darba līgumā noteiktā alga pirms nodokļu atskaitīšanas. Neto alga ir summa, ko darbinieks saņem uz rokas.",
                  },
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Sākums",
                  item: "https://tavadiena.lv",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Algu kalkulators",
                  item: "https://tavadiena.lv/algu-kalkulators",
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
