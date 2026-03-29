"use client";

import { useState } from "react";

interface NameProfileProps {
  name: string;
}

export function NameProfile({ name }: NameProfileProps) {
  const [profile, setProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/name-profile?name=${encodeURIComponent(name)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kaut kas nogāja greizi");
        return;
      }

      setProfile(data.profile);
    } catch {
      setError("Neizdevās savienot");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border rounded-xl p-5 bg-gradient-to-br from-purple-50 to-indigo-50">
      <h3 className="font-heading font-bold text-base mb-1">
        {name} — personības profils
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Izklaides saturs, balstīts uz vārda nozīmi
      </p>

      {profile ? (
        <p className="text-text-secondary leading-relaxed text-sm italic">
          &ldquo;{profile}&rdquo;
        </p>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 bg-white border border-border text-sm font-medium rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-60"
        >
          {loading ? "Ģenerē..." : "Uzzināt profilu"}
        </button>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
