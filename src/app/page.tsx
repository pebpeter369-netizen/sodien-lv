import Link from "next/link";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getTodayInLatvia, getLatvianWeekday, getLatvianMonthGenitive } from "@/lib/dates";
import nameDaysData from "@/data/name-days.json";
import Image from "next/image";
import readingTime from "reading-time";
import { TopicBadge } from "@/components/ui/TopicBadge";
import { NewsletterSignup } from "@/components/ui/NewsletterSignup";
import type { ArticleTopic } from "@/types";
import { timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

interface HistoricalEvent {
  year: number;
  event: string;
}

// Historical events for "today in history"
const historicalEvents: HistoricalEvent[] = [
  { year: 1918, event: "Vācu okupācijas iestādes Rīgā oficiāli atļauj veidot Vidzemes, Latgales un Kurzemes apvienoto landesrādu (Zemes padomi). Tas bija solis uz vācu atbalstītas Baltijas hercogistes izveidi, kas konkurēja ar latviešu centieniem pēc neatkarības." },
  { year: 1945, event: "Sākās Otrais Pasaules Karš Eiropā. Šis bija kritisks moments Latvijas vēsturē." },
  { year: 1990, event: "Latvija pieņem deklarāciju par neatkarības atjaunošanu." },
];

export default async function Home() {
  const today = getTodayInLatvia();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const weekday = getLatvianWeekday(today.getDay());
  const monthGenitive = getLatvianMonthGenitive(today.getMonth());

  // Get today's name days
  const todayNameDays = (nameDaysData as NameDayEntry[]).find(
    (entry) => entry.month === todayMonth && entry.day === todayDay
  );
  const names = todayNameDays?.names || [];

  // Get databases articles
  const db = getDb();
  const recentArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(5);

  // Calculate year progress
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  const yearProgress = Math.round(
    ((today.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100
  );

  // Get today's historical events
  const todayHistoricalEvents = historicalEvents.slice(0, 3);

  const formattedDate = `${weekday}, ${todayDay}. ${monthGenitive}`;

  return (
    <main className="min-h-screen">
      {/* SECTION 1: Name Days Highlight */}
      <section className="bg-accent-light border-b border-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-text-muted text-sm tracking-wide uppercase mb-4">
            {formattedDate}
          </p>
          <p className="text-text-secondary text-base mb-3">
            {names.length > 0 ? "Šodien vārda dienu svin" : "Šodien nav vārda dienu"}
          </p>

          {names.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3 mb-6">
              {names.map((name) => (
                <Link
                  key={name}
                  href={`/varda-dienas/${name.toLowerCase()}`}
                  className="name-highlight font-heading text-4xl sm:text-6xl lg:text-7xl font-bold text-primary hover:text-primary-light transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/varda-dienas"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Vārda dienu kalendārs →
          </Link>
        </div>
      </section>

      {/* SECTION 2: Salary Calculator Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/algu-kalkulators"
            className="bg-white rounded-lg shadow-md p-5 border border-border hover:shadow-lg hover:border-primary transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💰</span>
              <h2 className="font-heading font-semibold text-lg">Algu kalkulators</h2>
            </div>
            <p className="text-text-secondary text-sm">
              Aprēķini bruto un neto algu. Uzzini, cik daudz tu nopelnī pēc nodokļiem.
            </p>
            <p className="text-primary text-sm font-medium mt-3">Detalizēts kalkulators →</p>
          </Link>

          <Link
            href="/svetku-dienas"
            className="bg-white rounded-lg shadow-md p-5 border border-border hover:shadow-lg hover:border-primary transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎉</span>
              <h2 className="font-heading font-semibold text-lg">Svētku dienas</h2>
            </div>
            <p className="text-text-secondary text-sm">
              Latvijas valsts svētku dienas, brīvdienas un ievērojamas dienas.
            </p>
            <p className="text-primary text-sm font-medium mt-3">Svētku saraksts →</p>
          </Link>

          <Link
            href="/darba-dienu-kalendars"
            className="bg-white rounded-lg shadow-md p-5 border border-border hover:shadow-lg hover:border-primary transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📅</span>
              <h2 className="font-heading font-semibold text-lg">Darba dienu kalendārs</h2>
            </div>
            <p className="text-text-secondary text-sm">
              Interaktīvs gada kalendārs ar svētku dienām un brīvdienām.
            </p>
            <p className="text-primary text-sm font-medium mt-3">Atvērt →</p>
          </Link>
        </div>
      </section>

      {/* SECTION 3: Year Progress */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-base">{formattedDate}</h3>
              <span className="text-xs text-text-muted">{yearProgress}% no gada</span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
            <p className="text-sm text-text-secondary">
              {names.length > 0 && (
                <>
                  Šodien svin: <span className="font-medium">{names.join(", ")}</span>
                </>
              )}
              {names.length === 0 && "Šodien nav vārda dienu"}
            </p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <div className="flex gap-2">
              <span className="text-2xl">💾</span>
              <div>
                <h3 className="font-heading font-bold text-sm mb-1">Saglabā ģimenes un draugu vārdus</h3>
                <p className="text-xs text-text-muted">
                  Nekad neaizmirsti svarīgo cilvēku vārda dienas
                </p>
                <Link href="/varda-dienas" className="text-xs text-primary hover:underline mt-2 block">
                  Skatīt saglabātos vārdus →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Today in History */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="border border-border rounded-xl p-5 bg-bg-secondary">
          <h3 className="font-heading font-bold text-base mb-3">Šodien vēsturē</h3>
          <ul className="space-y-2.5">
            {todayHistoricalEvents.map((event) => (
              <li key={event.year} className="flex gap-3 text-sm">
                <span className="font-bold text-primary shrink-0 w-12 text-right">{event.year}</span>
                <span className="text-text-secondary">{event.event}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 5: Recent Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-text">Aktualitātes</h2>
          <Link href="/aktualitates" className="text-sm font-medium text-primary hover:text-primary-light">
            Visi raksti →
          </Link>
        </div>

        <div className="space-y-4">
          {recentArticles.map((article, idx) => {
            let sourceCount = 0;
            if (article.sourceUrls) {
              try {
                const sources = JSON.parse(article.sourceUrls);
                sourceCount = sources.filter((s: string | { url: string }) => {
                  const url = typeof s === "string" ? s : s.url;
                  return !url.includes("vertexaisearch") && !url.includes("google.com/search?q=time");
                }).length;
              } catch {}
            }

            return (
              <article
                key={article.id}
                className="group border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-bg-secondary"
              >
                <Link href={`/aktualitates/${article.slug}`} className="block md:grid md:grid-cols-5 gap-0">
                  {article.thumbnailUrl ? (
                    <div className="md:col-span-2 aspect-[16/9] md:aspect-auto relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      <Image
                        src={article.thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-2 aspect-[16/9] md:aspect-auto bg-gradient-to-br from-primary/10 to-primary/5" />
                  )}

                  <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <TopicBadge topic={article.topic as ArticleTopic} />
                        {article.publishedAt && (
                          <span className="text-xs text-text-muted">{timeAgo(article.publishedAt)}</span>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-text group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-text-secondary line-clamp-2">{article.excerpt}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-text-muted pt-3 border-t border-border">
                      <span>{readingTime(article.content).text.replace(" read", "")}</span>
                      <span>{sourceCount > 0 ? `${sourceCount} avotos` : ""}</span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        <Link
          href="/aktualitates"
          className="block mt-6 text-center text-primary hover:underline font-medium text-sm"
        >
          Skatīt visus rakstus →
        </Link>
      </section>

      {/* SECTION 6: Newsletter Signup */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <NewsletterSignup variant="card" />
      </section>
    </main>
  );
}
