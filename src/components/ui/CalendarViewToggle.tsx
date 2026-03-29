"use client";

import { useEffect, useState } from "react";

export type CalendarView = "grid" | "list";

const STORAGE_KEY = "sodien_calendar_view";

interface CalendarViewToggleProps {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}

export function CalendarViewToggle({ value, onChange }: CalendarViewToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-border bg-bg-secondary p-0.5">
      <button
        onClick={() => onChange("grid")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          value === "grid"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:text-text"
        }`}
      >
        Režģis
      </button>
      <button
        onClick={() => onChange("list")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          value === "list"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:text-text"
        }`}
      >
        Saraksts
      </button>
    </div>
  );
}

export function useCalendarView(): [CalendarView, (v: CalendarView) => void] {
  const [view, setView] = useState<CalendarView>("list");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

  const updateView = (v: CalendarView) => {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  return [view, updateView];
}
