"use client";

import { useState, useEffect, FormEvent } from "react";

interface NewsletterSignupProps {
  variant?: "card" | "inline";
}

export function NewsletterSignup({ variant = "card" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAlreadySubscribed(localStorage.getItem("sodien_subscribed") === "true");
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error || "Kaut kas nogāja greizi.");
        return;
      }

      setState("success");
      localStorage.setItem("sodien_subscribed", "true");
      setAlreadySubscribed(true);
    } catch {
      setState("error");
      setErrorMessage("Neizdevās nosūtīt. Lūdzu mēģini vēlreiz.");
    }
  }

  if (alreadySubscribed && state !== "success") {
    return null;
  }

  if (variant === "inline") {
    return (
      <div className="w-full">
        <p className="text-sm text-text-muted mb-3">
          Saņem ikdienas apskatu e-pastā
        </p>
        {state === "success" ? (
          <p className="text-sm text-accent font-medium">
            Paldies! Pārbaudi e-pastu.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tavs e-pasts"
              required
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm text-text bg-white/10 border border-white/20 placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-60 shrink-0"
            >
              {state === "loading" ? "..." : "Pieteikties"}
            </button>
          </form>
        )}
        {state === "error" && (
          <p className="text-sm text-red-300 mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-sm">
      <h2 className="font-heading text-xl sm:text-2xl font-bold text-text mb-2">
        Saņem ikdienas apskatu e-pastā
      </h2>
      <p className="text-text-secondary text-sm sm:text-base mb-5 leading-relaxed">
        Vārda dienas, aktualitātes un svētku atgādinājumi — katru rītu tavā
        e-pastā.
      </p>
      {state === "success" ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium text-sm">
          Paldies! Pārbaudi e-pastu.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tavs e-pasts"
            required
            className="flex-1 px-4 py-3 rounded-lg border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 shrink-0"
          >
            {state === "loading" ? "Nosūta..." : "Pieteikties"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
