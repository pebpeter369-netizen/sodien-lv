import Link from "next/link";
import { NewsletterSignup } from "@/components/ui/NewsletterSignup";

export function Footer() {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              <span className="text-white">Tava</span><span className="text-accent">Diena</span><span className="text-white">.lv</span>
            </h3>
            <p className="text-sm leading-relaxed text-white opacity-90">
              Aktuālā informācija Latvijā — vārda dienas, algu kalkulators,
              svētku dienas un aktuālākās ziņas.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Rīki</h4>
            <ul className="space-y-2 text-sm text-white opacity-90">
              <li>
                <Link
                  href="/varda-dienas"
                  className="text-white hover:text-accent transition-colors"
                >
                  Vārda dienu kalendārs
                </Link>
              </li>
              <li>
                <Link
                  href="/algu-kalkulators"
                  className="text-white hover:text-accent transition-colors"
                >
                  Algu kalkulators
                </Link>
              </li>
              <li>
                <Link
                  href="/svetku-dienas"
                  className="text-white hover:text-accent transition-colors"
                >
                  Svētku dienas
                </Link>
              </li>
              <li>
                <Link
                  href="/aktualitates"
                  className="text-white hover:text-accent transition-colors"
                >
                  Aktualitātes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Informācija</h4>
            <ul className="space-y-2 text-sm text-white opacity-90">
              <li>
                <Link
                  href="/par-mums"
                  className="text-white hover:text-accent transition-colors"
                >
                  Par mums
                </Link>
              </li>
              <li>
                <Link
                  href="/privatuma-politika"
                  className="text-white hover:text-accent transition-colors"
                >
                  Privātuma politika
                </Link>
              </li>
              <li>
                <Link
                  href="/jautajumi"
                  className="text-white hover:text-accent transition-colors"
                >
                  Biežāk uzdotie jautājumi
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="text-white hover:text-accent transition-colors"
                >
                  Lapas karte
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <NewsletterSignup variant="inline" />
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white opacity-75">
          © {new Date().getFullYear()} TavaDiena.lv. Visas tiesības aizsargātas.
        </div>
      </div>
    </footer>
  );
}
