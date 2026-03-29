"use client";

import Link from "next/link";
import { MonthlyCalendarGrid } from "@/components/ui/MonthlyCalendarGrid";
import {
  CalendarViewToggle,
  useCalendarView,
} from "@/components/ui/CalendarViewToggle";
import { getLatvianMonth } from "@/lib/dates";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

interface CalendarSectionProps {
  nameDaysData: NameDayEntry[];
}

function groupByMonth(data: NameDayEntry[]): Map<number, NameDayEntry[]> {
  const map = new Map<number, NameDayEntry[]>();
  for (const entry of data) {
    const list = map.get(entry.month) || [];
    list.push(entry);
    map.set(entry.month, list);
  }
  return map;
}

export function CalendarSection({ nameDaysData }: CalendarSectionProps) {
  const [view, setView] = useCalendarView();
  const byMonth = groupByMonth(nameDaysData);

  return (
    <div>
      <div className="flex justify-center mb-6">
        <CalendarViewToggle value={view} onChange={setView} />
      </div>

      {view === "grid" ? (
        <MonthlyCalendarGrid nameDays={nameDaysData} />
      ) : (
        <div className="space-y-6">
          {Array.from(byMonth.entries()).map(([month, entries]) => (
            <div
              key={month}
              className="border border-border rounded-lg overflow-hidden bg-bg-secondary"
            >
              <div className="bg-primary text-white px-4 py-3 font-heading font-semibold">
                {getLatvianMonth(month - 1)}
              </div>
              <div className="divide-y divide-border">
                {entries.map((entry) => (
                  <div
                    key={`${entry.month}-${entry.day}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-bg-tertiary text-sm transition-colors"
                  >
                    <span className="text-text-muted font-mono w-6 text-right shrink-0 font-semibold">
                      {entry.day}.
                    </span>
                    <div className="flex flex-wrap gap-2 min-w-0">
                      {entry.names.map((name, i) => (
                        <span key={name}>
                          <Link
                            href={`/varda-dienas/${name.toLowerCase()}`}
                            className="text-primary hover:text-primary-light hover:underline font-medium"
                          >
                            {name}
                          </Link>
                          {i < entry.names.length - 1 && (
                            <span className="text-text-muted">, </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
