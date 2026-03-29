"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import nameDaysData from "@/data/name-days.json";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

const LATVIAN_MONTHS_SHORT = [
  "", "jan.", "feb.", "mar.", "apr.", "mai.", "jūn.",
  "jūl.", "aug.", "sep.", "okt.", "nov.", "dec.",
];

const STORAGE_KEY = "sodien_saved_names";

function getSavedNames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveName(name: string) {
  const names = getSavedNames();
  if (!names.includes(name)) {
    names.push(name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  }
}

function removeName(name: string) {
  const names = getSavedNames().filter((n) => n !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

function getNameDayDate(name: string): { month: number; day: number } | null {
  for (const entry of nameDaysData as NameDayEntry[]) {
    if (entry.names.some((n) => n.toLowerCase() === name.toLowerCase())) {
      return { month: entry.month, day: entry.day };
    }
  }
  return null;
}

function getTodayInLatvia(): Date {
  const now = new Date();
  const latviaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Riga" })
  );
  return new Date(
    latviaTime.getFullYear(),
    latviaTime.getMonth(),
    latviaTime.getDate()
  );
}

function daysUntil(month: number, day: number): number {
  const today = getTodayInLatvia();
  const thisYear = today.getFullYear();
  let target = new Date(thisYear, month - 1, day);
  if (target < today) {
    target = new Date(thisYear + 1, month - 1, day);
  }
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Save button for individual name pages
export function SaveNameButton({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getSavedNames().includes(name));
  }, [name]);

  function toggle() {
    if (saved) {
      removeName(name);
      setSaved(false);
    } else {
      saveName(name);
      setSaved(true);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        saved
          ? "bg-accent/10 text-accent-dark border border-accent/30"
          : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border"
      }`}
    >
      <span>{saved ? "★" : "☆"}</span>
      {saved ? "Saglabāts" : "Saglabāt vārdu"}
    </button>
  );
}

// Homepage widget showing upcoming saved name days
export function SavedNamesWidget() {
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNames(getSavedNames());
  }, []);

  const upcoming = useMemo(() => {
    if (!mounted) return [];
    return names
      .map((name) => {
        const date = getNameDayDate(name);
        if (!date) return null;
        const days = daysUntil(date.month, date.day);
        return { name, month: date.month, day: date.day, daysUntil: days };
      })
      .filter(Boolean)
      .sort((a, b) => a!.daysUntil - b!.daysUntil) as {
      name: string;
      month: number;
      day: number;
      daysUntil: number;
    }[];
  }, [names, mounted]);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    // Capitalize first letter
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (!names.includes(formatted)) {
      saveName(formatted);
      setNames([...names, formatted]);
    }
    setNewName("");
  }

  function handleRemove(name: string) {
    removeName(name);
    setNames(names.filter((n) => n !== name));
  }

  if (!mounted) return null;

  // Don't show if no saved names and user hasn't interacted
  if (names.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-xl p-5">
        <h3 className="font-heading font-semibold text-base mb-2">
          Mani vārdi
        </h3>
        <p className="text-sm text-text-muted mb-3">
          Saglabā ģimenes un draugu vārdus, lai nekad neaizmirstu vārda dienu.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Pievieno vārdu..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-base">
          Mani vārdi
        </h3>
        <span className="text-xs text-text-muted">{names.length} saglabāti</span>
      </div>

      {/* Upcoming name days */}
      <div className="space-y-2 mb-4">
        {upcoming.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center justify-between group">
            <Link
              href={`/varda-dienas/${item.name.toLowerCase()}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-text-muted text-xs">
                {item.day}. {LATVIAN_MONTHS_SHORT[item.month]}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {item.daysUntil === 0 ? (
                <span className="text-xs font-semibold text-accent-dark bg-accent/10 px-2 py-0.5 rounded-full">
                  Šodien!
                </span>
              ) : item.daysUntil <= 7 ? (
                <span className="text-xs font-medium text-primary">
                  pēc {item.daysUntil} d.
                </span>
              ) : (
                <span className="text-xs text-text-muted">
                  pēc {item.daysUntil} d.
                </span>
              )}
              <button
                onClick={() => handleRemove(item.name)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all text-xs"
                title="Noņemt"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new name */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Pievieno vārdu..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
