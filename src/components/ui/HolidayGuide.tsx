"use client";

import { useState } from "react";

interface HolidayGuideProps {
  slug: string;
  holidayName: string;
  hasExistingTraditions: boolean;
}

export function HolidayGuide({ slug, holidayName, hasExistingTraditions }: HolidayGuideProps) {
  const [guide, setGuide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/holiday-guide?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setGuide(data.guide);
    } catch {
      setError("Neizdevās ielādēt");
    } finally {
      setLoading(false);
    }
  }

  if (guide) {
    return (
      <section className="mb-8">
        <h2 className="font-heading text-2xl font-bold mb-3">
          Kā svinēt {holidayName}
        </h2>
        <div
          className="article-content text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: guide }}
        />
      </section>
    );
  }

  // Don't show the button if there's already rich traditions content
  if (hasExistingTraditions) return null;

  return (
    <section className="mb-8">
      <button
        onClick={generate}
        disabled={loading}
        className="px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {loading ? "Ģenerē ceļvedi..." : `Kā svinēt ${holidayName}?`}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </section>
  );
}
