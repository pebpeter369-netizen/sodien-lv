"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import nameDaysData from "@/data/name-days.json";

const LATVIAN_MONTHS_GENITIVE = [
  "",
  "janvārī",
  "februārī",
  "martā",
  "aprīlī",
  "maijā",
  "jūnijā",
  "jūlijā",
  "augustā",
  "septembrī",
  "oktobrī",
  "novembrī",
  "decembrī",
];

interface NameEntry {
  name: string;
  month: number;
  day: number;
}

// Build a flat lookup of name -> date
const allNames: NameEntry[] = [];
for (const entry of nameDaysData as {
  month: number;
  day: number;
  names: string[];
}[]) {
  for (const name of entry.names) {
    allNames.push({ name, month: entry.month, day: entry.day });
  }
}

export function InlineNameSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return allNames
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Meklēt vārdu..."
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {open && results.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
            {results.map((r) => (
              <Link
                key={`${r.name}-${r.month}-${r.day}`}
                href={`/varda-dienas/${r.name.toLowerCase()}`}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-secondary transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-text-muted text-xs">
                  {r.day}. {LATVIAN_MONTHS_GENITIVE[r.month]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
