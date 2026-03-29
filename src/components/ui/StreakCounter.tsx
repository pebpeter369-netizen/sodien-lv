"use client";

import { useEffect, useState, useCallback } from "react";

interface StreakData {
  count: number;
  lastVisit: string;
}

function getLocalDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getYesterdayDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MILESTONES: Record<number, string> = {
  3: "3 dienas pēc kārtas! \u{1F525}",
  7: "Vesela nedēļa! \u{1F525}\u{1F525}",
  14: "2 nedēļas! Tu esi pastāvīgs!",
  30: "30 dienu sērija! \u{1F525}\u{1F525}\u{1F525} Izcili!",
  50: "50 dienas! Tu esi leģenda!",
  100: "100 dienu sērija! \u{1F3C6}",
};

function readStreak(): StreakData | null {
  try {
    const raw = localStorage.getItem("sodien_streak");
    if (!raw) return null;
    return JSON.parse(raw) as StreakData;
  } catch {
    return null;
  }
}

function writeStreak(data: StreakData): void {
  try {
    localStorage.setItem("sodien_streak", JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

export function useStreak() {
  const [count, setCount] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    const existing = readStreak();

    if (!existing) {
      // First ever visit
      writeStreak({ count: 1, lastVisit: today });
      setCount(1);
      return;
    }

    if (existing.lastVisit === today) {
      // Already visited today
      setCount(existing.count);
      return;
    }

    let newCount: number;
    if (existing.lastVisit === yesterday) {
      newCount = existing.count + 1;
    } else {
      newCount = 1;
    }

    writeStreak({ count: newCount, lastVisit: today });
    setCount(newCount);

    if (newCount > 1) {
      setAnimated(true);
      setTimeout(() => setAnimated(false), 600);
    }

    if (MILESTONES[newCount]) {
      setMilestone(MILESTONES[newCount]);
      setTimeout(() => setMilestone(null), 4000);
    }
  }, []);

  return { count, milestone, animated };
}

function getFlames(count: number): string {
  if (count >= 30) return "\u{1F525}\u{1F525}\u{1F525}";
  if (count >= 14) return "\u{1F525}\u{1F525}";
  return "\u{1F525}";
}

export function StreakCounter() {
  const { count, milestone, animated } = useStreak();

  if (count < 2) return null;

  const flames = getFlames(count);
  const isGold = count >= 30;
  const isBold = count >= 7;
  const isSubtle = count < 3;

  return (
    <>
      <div
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium
          transition-transform duration-300
          ${animated ? "scale-125" : "scale-100"}
          ${isGold ? "bg-amber-100 text-amber-700 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : ""}
          ${isBold && !isGold ? "bg-orange-50 text-orange-600" : ""}
          ${isSubtle ? "bg-surface-raised text-text-muted" : ""}
        `}
      >
        <span className={isBold ? "text-base" : "text-sm"}>{flames}</span>
        <span>{count}</span>
      </div>

      {/* Milestone toast */}
      {milestone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-out">
          <div className="bg-white border border-amber-200 shadow-lg rounded-lg px-5 py-3 text-center font-medium text-amber-800">
            {milestone}
          </div>
        </div>
      )}
    </>
  );
}

export function StreakBanner() {
  const { count } = useStreak();

  if (count < 3) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-center text-sm text-amber-800">
        Tu apmeklē TavaDiena.lv jau <strong>{count}</strong> dienas pēc kārtas! {getFlames(count)}
      </div>
    </div>
  );
}
