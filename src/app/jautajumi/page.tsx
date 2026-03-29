import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Biežāk uzdotie jautājumi — TavaDiena.lv",
  description:
    "Atbildes uz biežāk uzdotajiem jautājumiem par vārda dienām, algu aprēķinu, svētku dienām un nodokļiem Latvijā.",
};

const FAQ_SECTIONS = [
  {
    title: "Vārda dienas",
    icon: "🎁",
    questions: [
      {
        q: "Kā uzzināt, kad ir mana vārda diena?",
        a: 'Ievadi savu vārdu <a href="/varda-dienas" class="text-primary underline">vārda dienu kalendārā</a> vai meklēšanas laukā. Katram vārdam ir sava diena — lielākajai daļai latviešu vārdu vārda diena ir noteikta oficiālajā kalendārā.',
      },
      {
        q: "Vai vārda diena ir brīvdiena?",
        a: "Nē, vārda diena nav valsts svētku diena un nav brīvdiena. Taču Latvijā tradicionāli vārda dienu svin līdzīgi dzimšanas dienai — ar apsveikumiem, ziediem un nelielām dāvanām.",
      },
      {
        q: "Kā apsveikt cilvēku vārda dienā?",
        a: 'Tradicionāli saka "Daudz laimes vārda dienā!" un dāvina ziedus. Mūsdienās populāri ir arī digitāli apsveikumi — izmanto mūsu <a href="/varda-dienas" class="text-primary underline">apsveikumu ģeneratoru</a>, lai izveidotu personalizētu apsveikumu.',
      },
      {
        q: "Ko darīt, ja mana vārda nav kalendārā?",
        a: "Ne visi vārdi ir iekļauti oficiālajā vārda dienu kalendārā. Ja tava vārda nav, tu vari svinēt Visu neparedzēto vārdu dienā (22. maijā) vai izvēlēties sev tuvāko vārdu no kalendāra.",
      },
    ],
  },
  {
    title: "Algu kalkulators",
    icon: "💰",
    questions: [
      {
        q: "Kā aprēķināt neto algu no bruto?",
        a: 'Izmanto mūsu <a href="/algu-kalkulators" class="text-primary underline">algu kalkulatoru</a>. No bruto algas tiek atņemtas VSAOI (10,50%), piemērots neapliekamais minimums, un aprēķināts IIN (25,5% vai 33%). Rezultāts ir neto alga — summa uz rokas.',
      },
      {
        q: "Kāda ir minimālā alga Latvijā 2026. gadā?",
        a: "Minimālā bruto alga Latvijā 2026. gadā ir €780 mēnesī. Pēc nodokļu atskaitīšanas tas atbilst aptuveni €590 neto algai.",
      },
      {
        q: "Kas ir neapliekamais minimums?",
        a: "Neapliekamais minimums ir ienākumu daļa, no kuras netiek aprēķināts IIN. 2026. gadā tas ir līdz €550 mēnesī zemāku ienākumu saņēmējiem un pakāpeniski samazinās, pieaugot algai.",
      },
      {
        q: "Kāda ir IIN likme Latvijā 2026. gadā?",
        a: "Latvijā darbojas progresīvā IIN likme: 25,5% ienākumiem līdz €105 300 gadā, 33% ienākumiem €105 300–€200 000, un 36% ienākumiem virs €200 000.",
      },
      {
        q: "Kā mainās alga, ja ir apgādājamie?",
        a: "Par katru apgādājamo no apliekamā ienākuma tiek atskaitīti €250 mēnesī. Tas samazina nodokļa bāzi, un neto alga palielinās par aptuveni €60-80 par katru apgādājamo.",
      },
    ],
  },
  {
    title: "Svētku dienas",
    icon: "🎉",
    questions: [
      {
        q: "Cik svētku dienu ir Latvijā?",
        a: 'Latvijā ir 15 valsts svētku dienas (brīvdienas) un vairāk nekā 50 ievērojamas dienas. Pilnu sarakstu skati <a href="/svetku-dienas" class="text-primary underline">svētku dienu kalendārā</a>.',
      },
      {
        q: "Kad ir nākamās garās brīvdienas?",
        a: 'Pārbaudi <a href="/svetku-dienas" class="text-primary underline">svētku dienu kalendāru</a> — tur redzēsi tuvākos svētkus ar atpakaļskaitīšanu un nedēļas dienām. Vari arī lejupielādēt .ics failu savam kalendāram.',
      },
      {
        q: "Vai Jāņi ir brīvdiena?",
        a: "Jā, Līgo svētki (23. jūnijs) un Jāņu diena (24. jūnijs) ir valsts svētku dienas — brīvdienas. Tie ir vieni no nozīmīgākajiem svētkiem Latvijā.",
      },
      {
        q: "Kā tiek aprēķināta samaksa par darbu svētku dienā?",
        a: "Darbs valsts svētku dienā tiek apmaksāts divkāršā apmērā vai arī darbiniekam piešķir citu brīvdienu. Darba devējs un darbinieks var vienoties par piemērotāko variantu.",
      },
    ],
  },
];

export default function FAQPage() {
  // Flatten all questions for structured data
  const allQuestions = FAQ_SECTIONS.flatMap((s) => s.questions);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Sākums
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">Biežāk uzdotie jautājumi</span>
      </nav>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-3">
        Biežāk uzdotie jautājumi
      </h1>
      <p className="text-text-secondary mb-8">
        Atbildes uz populārākajiem jautājumiem par vārda dienām, algu aprēķinu
        un svētku dienām Latvijā.
      </p>

      {FAQ_SECTIONS.map((section) => (
        <section key={section.title} className="mb-10">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <span>{section.icon}</span> {section.title}
          </h2>
          <div className="space-y-3">
            {section.questions.map((faq, i) => (
              <details
                key={i}
                className="border border-border rounded-lg bg-bg-secondary group"
              >
                <summary className="px-5 py-4 cursor-pointer font-medium text-text hover:text-primary transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-text-muted group-open:rotate-180 transition-transform ml-2 shrink-0">
                    ▾
                  </span>
                </summary>
                <div
                  className="px-5 pb-4 text-text-secondary leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: faq.a }}
                />
              </details>
            ))}
          </div>
        </section>
      ))}

      {/* Cross-links */}
      <section className="border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Noderīgi rīki</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/algu-kalkulators"
            className="text-sm text-primary hover:underline"
          >
            Algu kalkulators
          </Link>
          <Link
            href="/varda-dienas"
            className="text-sm text-primary hover:underline"
          >
            Vārda dienu kalendārs
          </Link>
          <Link
            href="/svetku-dienas"
            className="text-sm text-primary hover:underline"
          >
            Svētku dienu kalendārs
          </Link>
        </div>
      </section>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: allQuestions.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a.replace(/<[^>]+>/g, ""),
              },
            })),
          }),
        }}
      />
    </div>
  );
}
