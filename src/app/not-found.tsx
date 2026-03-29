import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lapa nav atrasta | TavaDiena.lv",
};

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl font-heading font-bold text-primary mb-4">404</p>
      <h1 className="text-2xl font-heading font-bold text-text mb-3">
        Lapa nav atrasta
      </h1>
      <p className="text-text-secondary mb-8">
        Diemžēl šāda lapa neeksistē vai ir pārvietota. Izmēģini kādu no šīm
        saitēm:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
        <Link
          href="/"
          className="px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          Sākumlapa
        </Link>
        <Link
          href="/varda-dienas"
          className="px-4 py-3 border border-border text-text font-medium rounded-lg hover:bg-bg-secondary transition-colors"
        >
          Vārda dienas
        </Link>
        <Link
          href="/algu-kalkulators"
          className="px-4 py-3 border border-border text-text font-medium rounded-lg hover:bg-bg-secondary transition-colors"
        >
          Algu kalkulators
        </Link>
        <Link
          href="/aktualitates"
          className="px-4 py-3 border border-border text-text font-medium rounded-lg hover:bg-bg-secondary transition-colors"
        >
          Aktualitātes
        </Link>
      </div>
    </div>
  );
}
