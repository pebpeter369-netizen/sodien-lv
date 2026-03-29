"use client";

import { useState } from "react";
import { genitive } from "@/lib/latvian";

interface GreetingGeneratorProps {
  name: string;
  nameOrigin?: string | null;
  nameMeaning?: string | null;
}

const TONE_OPTIONS = [
  { value: "warm", label: "Sirsnīgs", icon: "❤️" },
  { value: "funny", label: "Jautrs", icon: "😄" },
  { value: "formal", label: "Formāls", icon: "🎩" },
  { value: "poetic", label: "Poētisks", icon: "✨" },
  { value: "short", label: "Īss", icon: "💬" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "Nav norādīts" },
  { value: "friend", label: "Draugs/draudzene" },
  { value: "family", label: "Ģimenes loceklis" },
  { value: "partner", label: "Mīļotais/mīļotā" },
  { value: "colleague", label: "Kolēģis/kolēģe" },
  { value: "boss", label: "Priekšnieks/ce" },
  { value: "child", label: "Bērns" },
  { value: "grandparent", label: "Vecmamma/vectēvs" },
];

export function GreetingGenerator({
  name,
  nameOrigin,
  nameMeaning,
}: GreetingGeneratorProps) {
  const [tone, setTone] = useState("warm");
  const [relationship, setRelationship] = useState("");
  const [greetings, setGreetings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setGreetings([]);

    try {
      const res = await fetch("/api/greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tone,
          relationship: relationship || undefined,
          nameOrigin: nameOrigin || undefined,
          nameMeaning: nameMeaning || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kaut kas nogāja greizi");
        return;
      }

      setGreetings(data.greetings);
    } catch {
      setError("Neizdevās savienot. Mēģini vēlreiz.");
    } finally {
      setLoading(false);
    }
  }

  async function copyGreeting(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  function shareGreeting(text: string) {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      // Fallback to WhatsApp
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  }

  return (
    <div className="border border-border rounded-xl p-5 sm:p-6 bg-bg-secondary">
      <h2 className="font-heading text-xl font-bold mb-1">
        Apsveikuma ģenerators
      </h2>
      <p className="text-sm text-text-muted mb-4">
        Izveido unikālu vārda dienas apsveikumu priekš {genitive(name)}
      </p>

      {/* Tone selector */}
      <div className="mb-4">
        <label className="text-sm font-medium text-text-secondary block mb-2">
          Tonis
        </label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                tone === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-secondary border-border text-text-secondary hover:border-primary"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Relationship selector */}
      <div className="mb-5">
        <label className="text-sm font-medium text-text-secondary block mb-2">
          Kam sveicam?
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ģenerē...
          </span>
        ) : greetings.length > 0 ? (
          "Ģenerēt jaunus"
        ) : (
          "Izveidot apsveikumu"
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 mt-3">{error}</p>
      )}

      {/* Generated greetings */}
      {greetings.length > 0 && (
        <div className="mt-5 space-y-3">
          {greetings.map((greeting, i) => {
            const cardUrl = `/api/greeting-card?name=${encodeURIComponent(name)}&message=${encodeURIComponent(greeting)}&theme=${["classic", "warm", "spring", "elegant", "sunset"][i % 5]}`;

            return (
              <div key={i} className="border border-border rounded-lg overflow-hidden bg-white">
                {/* Visual card preview */}
                <a
                  href={cardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={cardUrl}
                    alt={`Apsveikums ${name}`}
                    className="w-full aspect-[1200/630] object-cover"
                    loading="lazy"
                  />
                </a>

                {/* Actions */}
                <div className="flex items-center justify-between p-3 border-t border-border">
                  <p className="text-sm text-text-secondary line-clamp-1 flex-1 mr-3">
                    {greeting}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => copyGreeting(greeting, i)}
                      className="p-2 text-text-muted hover:text-primary transition-colors rounded-md hover:bg-bg-secondary"
                      title="Kopēt tekstu"
                    >
                      {copied === i ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => shareGreeting(greeting)}
                      className="p-2 text-text-muted hover:text-primary transition-colors rounded-md hover:bg-bg-secondary"
                      title="Dalīties"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <a
                      href={cardUrl}
                      download={`apsveikums-${name.toLowerCase()}.png`}
                      className="p-2 text-text-muted hover:text-primary transition-colors rounded-md hover:bg-bg-secondary"
                      title="Lejupielādēt attēlu"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
