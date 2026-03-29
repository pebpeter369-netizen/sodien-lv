"use client";

import { useState, useEffect } from "react";

interface HistoryEvent {
  year: number;
  event: string;
}

export function TodayInHistory() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/today-history")
      .then((res) => res.json())
      .then((data) => {
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-5 bg-bg-secondary animate-pulse">
        <div className="h-5 bg-bg-tertiary rounded w-40 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-bg-tertiary rounded w-full" />
          <div className="h-4 bg-bg-tertiary rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="border border-border rounded-xl p-5 bg-bg-secondary">
      <h3 className="font-heading font-bold text-base mb-3">
        Šodien vēsturē
      </h3>
      <ul className="space-y-2.5">
        {events.slice(0, 4).map((e, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="font-bold text-primary shrink-0 w-12 text-right">
              {e.year}
            </span>
            <span className="text-text-secondary">{e.event}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
