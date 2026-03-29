import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { nameDetails } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { SaveNameButton } from "@/components/ui/SavedNames";
import { GreetingGenerator } from "@/components/ui/GreetingGenerator";
import { NameProfile } from "@/components/ui/NameProfile";
import {
  daysUntil,
  getLatvianMonthGenitive,
  getLatvianMonth,
} from "@/lib/dates";
import { genitive } from "@/lib/latvian";
import nameDaysData from "@/data/name-days.json";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

const allEntries = nameDaysData as NameDayEntry[];

const allNames = allEntries.flatMap((entry) =>
  entry.names.map((name) => ({
    name,
    month: entry.month,
    day: entry.day,
    coNames: entry.names.filter((n) => n !== name),
  }))
);

// Build a map of names in the same month for cross-linking
const namesByMonth = new Map<number, string[]>();
for (const entry of allEntries) {
  const existing = namesByMonth.get(entry.month) || [];
  existing.push(...entry.names);
  namesByMonth.set(entry.month, existing);
}

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateStaticParams() {
  return allNames.map((entry) => ({
    name: entry.name.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name: nameParam } = await params;
  const entry = allNames.find(
    (n) =>
      n.name.toLowerCase() === decodeURIComponent(nameParam).toLowerCase()
  );
  if (!entry) return {};

  const db = getDb();
  const [details] = await db
    .select()
    .from(nameDetails)
    .where(eq(nameDetails.name, entry.name))
    .limit(1);

  const dateStr = `${entry.day}. ${getLatvianMonthGenitive(entry.month - 1)}`;
  const meaningSnippet = details?.meaning
    ? ` ${details.meaning.slice(0, 80)}.`
    : "";

  return {
    title: `${genitive(entry.name)} vārda diena — ${dateStr}`,
    description: `${genitive(entry.name)} vārda diena ir ${dateStr}.${meaningSnippet} Uzzini vārda izcelsmi, nozīmi, popularitāti un tradīcijas Latvijā.`,
    openGraph: {
      title: `${entry.name} — vārda diena ${dateStr}`,
      description: `Kad ir ${genitive(entry.name)} vārda diena? ${dateStr}. Vārda nozīme, izcelsme un Latvijas tradīcijas.`,
    },
  };
}

export default async function NameDayPage({ params }: Props) {
  const { name: nameParam } = await params;
  const decodedName = decodeURIComponent(nameParam);
  const entry = allNames.find(
    (n) => n.name.toLowerCase() === decodedName.toLowerCase()
  );

  if (!entry) {
    notFound();
  }

  const db = getDb();
  const [details] = await db
    .select()
    .from(nameDetails)
    .where(eq(nameDetails.name, entry.name))
    .limit(1);

  const famousPersons: string[] = details?.famousPersons
    ? JSON.parse(details.famousPersons)
    : [];

  const dateStr = `${entry.day}. ${getLatvianMonthGenitive(entry.month - 1)}`;
  const days = daysUntil(entry.month, entry.day);
  const monthName = getLatvianMonth(entry.month - 1);

  // Get other names from the same month for cross-linking (exclude self and co-names)
  const sameMonthNames = (namesByMonth.get(entry.month) || [])
    .filter((n) => n !== entry.name && !entry.coNames.includes(n))
    .slice(0, 8);

  const popularityLabel =
    details?.popularity === "common"
      ? "Izplatīts vārds"
      : details?.popularity === "uncommon"
        ? "Vidēji izplatīts vārds"
        : details?.popularity === "rare"
          ? "Reti izplatīts vārds"
          : null;

  const baseUrl = process.env.SITE_URL || "https://tavadiena.lv";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Sākums
        </Link>
        <span className="mx-1">/</span>
        <Link href="/varda-dienas" className="hover:text-primary">
          Vārda dienas
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">{entry.name}</span>
      </nav>

      <div className="text-center mb-8">
        <h1
          className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4"
          style={{ viewTransitionName: `name-${entry.name.toLowerCase()}` }}
        >
          {entry.name}
        </h1>
        <div className="bg-accent/10 rounded-xl px-6 py-4 inline-block mb-3">
          <p className="text-lg font-medium text-text">
            Vārda diena: <span className="font-bold">{dateStr}</span>
          </p>
        </div>
        {popularityLabel && (
          <p className="text-sm text-text-muted">{popularityLabel} Latvijā</p>
        )}
      </div>

      {/* Countdown */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-8 text-center mb-8">
        {days === 0 ? (
          <div>
            <p className="text-accent-light text-lg font-medium">
              Šodien ir {genitive(entry.name)} vārda diena!
            </p>
            <p className="text-4xl font-heading font-bold mt-2">
              Apsveicam! &#127881;
            </p>
          </div>
        ) : (
          <div>
            <p className="text-4xl font-heading font-bold">{days}</p>
            <p className="text-accent-light mt-1">
              {days === 1 ? "diena" : "dienas"} līdz {genitive(entry.name)} vārda dienai
            </p>
          </div>
        )}
      </div>

      {/* Share & save buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <ShareButtons name={entry.name} date={dateStr} variant="inline" />
        <SaveNameButton name={entry.name} />
      </div>

      {/* Greeting generator */}
      <section className="mb-8">
        <GreetingGenerator
          name={entry.name}
          nameOrigin={details?.origin}
          nameMeaning={details?.meaning}
        />
      </section>

      {/* Name origin and meaning — the key differentiating content */}
      {(details?.origin || details?.meaning) && (
        <section className="mb-8 bg-bg-secondary rounded-xl p-6">
          <h2 className="font-heading text-xl font-bold mb-3">
            Vārda {entry.name} nozīme un izcelsme
          </h2>
          {details.origin && (
            <p className="text-text-secondary mb-3 leading-relaxed">
              <span className="font-medium text-text">Izcelsme:</span>{" "}
              {details.origin}
            </p>
          )}
          {details.meaning && (
            <p className="text-text-secondary leading-relaxed">
              <span className="font-medium text-text">Nozīme:</span>{" "}
              {details.meaning}
            </p>
          )}
        </section>
      )}

      {/* Famous persons */}
      {famousPersons.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl font-bold mb-3">
            Pazīstami cilvēki ar vārdu {entry.name}
          </h2>
          <ul className="space-y-1.5 text-text-secondary">
            {famousPersons.map((person) => (
              <li key={person} className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#8226;</span>
                {person}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Co-celebrants */}
      {entry.coNames.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl font-bold mb-3">
            {dateStr} vārda dienu svin arī
          </h2>
          <div className="flex flex-wrap gap-2">
            {entry.coNames.map((name) => (
              <Link
                key={name}
                href={`/varda-dienas/${name.toLowerCase()}`}
                className="px-3 py-1.5 bg-bg-secondary rounded-full text-sm font-medium text-primary hover:bg-bg-tertiary transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Traditions — season-specific content */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">
          {genitive(entry.name)} vārda dienas tradīcijas
        </h2>
        <div className="text-text-secondary leading-relaxed space-y-3">
          <p>
            {genitive(entry.name)} vārda diena iekrīt {dateStr} —{" "}
            {entry.month >= 3 && entry.month <= 5
              ? "pavasara laikā, kad daba mostas un ziedēšana sākas. Šajā laikā vārda dienā bieži dāvina pavasara ziedus — tulpes, narcises vai pirmās pļavas puķes."
              : entry.month >= 6 && entry.month <= 8
                ? "vasaras sezonā, kad Latvijā ir garās, gaišās dienas. Vasarā vārda dienas bieži svin ārā — dārzā, pie ugunskura vai piejūrā. Dāvina pļavas ziedus un lauku puķes."
                : entry.month >= 9 && entry.month <= 11
                  ? "rudens laikā, kad Latvijā krāšņi zelta un sarkanie toņi rotā ainavu. Rudenī vārda dienā bieži dāvina rudens ziedus, kā arī tradicionāli sagatavotus gardumus."
                  : "ziemas sezonā, kad Latvijā īsās dienas un svētku noskaņa. Ziemā vārda dienas svinēšana bieži savijas ar Adventes un Ziemassvētku tradīcijām — silti apsveikumi un kopīgas ģimenes vakariņas."}
          </p>
          <p>
            Vārda dienas svinēšana Latvijā ir sena tradīcija, kuras pirmsākumi
            meklējami kristīgajā svēto kalendārā, taču tā ir kļuvusi par
            neatņemamu latviešu kultūras daļu. Latvijas Zinātņu akadēmijas
            Latviešu valodas institūts uztur oficiālo vārda dienu kalendāru,
            kurā katram gada datumam ir piešķirti viens vai vairāki vārdi.
          </p>
          <p>
            Vārda dienā vārdadienas svinētājus apsveic ģimene, draugi, kolēģi
            un paziņas. Darbavietā kolēģi nereti sarūpē kūku vai nelielu
            kopīgu svinēšanu. Daudzi latvieši uzskata vārda dienu par tikpat
            nozīmīgu kā dzimšanas dienu, jo vārda dienas datums ir
            vispārzināms un nav jāatceras katram individuāli.
          </p>
          <p>
            Ja vēlies apsveikt vārdadienas svinētāju, dari to ar siltiem
            vārdiem un nelielu uzmanības zīmi. Latvijā ir ierasts pateikt
            &ldquo;Daudz laimes vārda dienā!&rdquo; vai vienkārši
            &ldquo;Apsveicu vārda dienā!&rdquo;. Vari arī izmantot{" "}
            <Link href="#greeting-generator" className="text-primary hover:underline">
              apsveikuma ģeneratoru
            </Link>{" "}
            šīs lapas augšdaļā, lai izveidotu unikālu apsveikumu.
          </p>
        </div>
      </section>

      {/* Same month names — internal cross-links */}
      {sameMonthNames.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl font-bold mb-3">
            Citas vārda dienas {getLatvianMonthGenitive(entry.month - 1).replace(
              /^./,
              (c) => c.toLowerCase()
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            {sameMonthNames.map((name) => (
              <Link
                key={name}
                href={`/varda-dienas/${name.toLowerCase()}`}
                className="px-3 py-1.5 bg-bg-secondary rounded-full text-sm font-medium text-text-secondary hover:text-primary hover:bg-bg-tertiary transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Personality profile */}
      <section className="mb-8">
        <NameProfile name={entry.name} />
      </section>

      {/* Cross-section links */}
      <section className="mb-8 border border-border rounded-xl p-6 bg-bg-secondary">
        <h3 className="font-semibold text-text mb-3">Noderīgi rīki</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/varda-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#128197; Pilns vārda dienu kalendārs
          </Link>
          <Link
            href="/algu-kalkulators"
            className="text-sm text-primary hover:underline"
          >
            &#128176; Algu kalkulators
          </Link>
          <Link
            href="/svetku-dienas"
            className="text-sm text-primary hover:underline"
          >
            &#127874; Svētku dienas Latvijā
          </Link>
        </div>
      </section>

      {/* FAQ Schema */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-4">
          Biežāk uzdotie jautājumi
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">
              Kad ir {genitive(entry.name)} vārda diena?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {genitive(entry.name)} vārda diena ir {dateStr}. Latvijas vārda dienu
              kalendārā katram gada datumam ir piešķirti viens vai vairāki
              vārdi, un {entry.name} ir piešķirts tieši šim datumam.
            </p>
          </div>
          {details?.origin && (
            <div>
              <h3 className="font-semibold mb-1">
                Kāda ir vārda {entry.name} izcelsme?
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {details.origin}
              </p>
            </div>
          )}
          <div>
            <h3 className="font-semibold mb-1">
              Kā apsveikt vārdadienas svinētāju {entry.name}?
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Vārda dienā ir ierasts teikt &ldquo;Daudz laimes vārda
              dienā!&rdquo; un dāvināt ziedus, konfektes vai nelielu dāvanu.
              Darbavietā kolēģi bieži sarūpē kūku. Apsveikumu var sūtīt
              arī elektroniski — īsziņā vai sociālajos tīklos.
            </p>
          </div>
        </div>
      </section>

      {/* Floating share bar for mobile */}
      <ShareButtons name={entry.name} date={dateStr} variant="floating" />

      {/* Structured data — Article + FAQ + Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: `${genitive(entry.name)} vārda diena — ${dateStr}`,
              description: `${genitive(entry.name)} vārda diena ir ${dateStr}. ${details?.meaning || "Uzzini par vārda nozīmi un tradīcijām."}`,
              url: `${baseUrl}/varda-dienas/${entry.name.toLowerCase()}`,
              inLanguage: "lv",
              about: {
                "@type": "Thing",
                name: entry.name,
                description: details?.origin || `Latviešu vārds ${entry.name}`,
              },
              publisher: {
                "@type": "Organization",
                name: "TavaDiena.lv",
                url: baseUrl,
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: `Kad ir ${genitive(entry.name)} vārda diena?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${genitive(entry.name)} vārda diena ir ${dateStr}.`,
                  },
                },
                ...(details?.origin
                  ? [
                      {
                        "@type": "Question",
                        name: `Kāda ir vārda ${entry.name} izcelsme?`,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: details.origin,
                        },
                      },
                    ]
                  : []),
                {
                  "@type": "Question",
                  name: `Kā apsveikt ${entry.name} vārda dienā?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: 'Vārda dienā ir ierasts teikt "Daudz laimes vārda dienā!" un dāvināt ziedus, konfektes vai nelielu dāvanu.',
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
                  item: baseUrl,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Vārda dienas",
                  item: `${baseUrl}/varda-dienas`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: entry.name,
                  item: `${baseUrl}/varda-dienas/${entry.name.toLowerCase()}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
