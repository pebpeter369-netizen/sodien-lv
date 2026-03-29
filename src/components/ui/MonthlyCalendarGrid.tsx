"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getLatvianMonth } from "@/lib/dates";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

interface MonthlyCalendarGridProps {
  nameDays: NameDayEntry[];
  initialMonth?: number;
}

const WEEKDAYS_FULL = [
  "Pirmdiena",
  "Otrdiena",
  "Trešdiena",
  "Ceturtdiena",
  "Piektdiena",
  "Sestdiena",
  "Svētdiena",
];
const WEEKDAYS_SHORT = ["P", "O", "T", "C", "Pk", "S", "Sv"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns 0 (Mon) – 6 (Sun) for the first day of the given month. */
function getFirstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

export function MonthlyCalendarGrid({
  nameDays,
  initialMonth,
}: MonthlyCalendarGridProps) {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const currentYear = now.getFullYear();

  const [month, setMonth] = useState(initialMonth ?? todayMonth);

  // Build a lookup: "month-day" -> names
  const lookup = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of nameDays) {
      map.set(`${entry.month}-${entry.day}`, entry.names);
    }
    return map;
  }, [nameDays]);

  const daysInMonth = getDaysInMonth(currentYear, month);
  const firstWeekday = getFirstWeekday(currentYear, month);

  // Previous month overflow days
  const prevMonth = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = getDaysInMonth(
    month === 1 ? currentYear - 1 : currentYear,
    prevMonth
  );

  // Build cells
  const cells: {
    day: number;
    month: number;
    isCurrentMonth: boolean;
  }[] = [];

  // Leading days from previous month
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      month: prevMonth,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, isCurrentMonth: true });
  }

  // Trailing days from next month
  const nextMonth = month === 12 ? 1 : month + 1;
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: nextMonth, isCurrentMonth: false });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const goToPrev = () => setMonth((m) => (m === 1 ? 12 : m - 1));
  const goToNext = () => setMonth((m) => (m === 12 ? 1 : m + 1));
  const goToToday = () => setMonth(todayMonth);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrev}
          className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text transition-colors"
          aria-label="Iepriekšējais mēnesis"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text">
            {getLatvianMonth(month - 1)} {currentYear}
          </h2>
          {month !== todayMonth && (
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors"
            >
              Šodien
            </button>
          )}
        </div>

        <button
          onClick={goToNext}
          className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text transition-colors"
          aria-label="Nākamais mēnesis"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-bg-secondary border-b border-border">
          {WEEKDAYS_FULL.map((day, i) => {
            const isWeekend = i >= 5;
            return (
              <div
                key={day}
                className={`py-2 text-center text-xs sm:text-sm font-semibold ${
                  isWeekend ? "text-accent-dark" : "text-text-secondary"
                }`}
              >
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{WEEKDAYS_SHORT[i]}</span>
              </div>
            );
          })}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 border-b border-border last:border-b-0"
          >
            {week.map((cell, ci) => {
              const isToday =
                cell.isCurrentMonth &&
                cell.month === todayMonth &&
                cell.day === todayDay;
              const isWeekend = ci >= 5;
              const names = cell.isCurrentMonth
                ? lookup.get(`${cell.month}-${cell.day}`) || []
                : [];

              return (
                <div
                  key={ci}
                  className={`min-h-[5rem] sm:min-h-[6.5rem] p-1.5 sm:p-2 border-r border-border last:border-r-0 transition-colors overflow-hidden flex flex-col ${
                    isToday
                      ? "bg-accent/10 ring-1 ring-inset ring-accent/40"
                      : isWeekend
                        ? "bg-accent/[0.03]"
                        : ""
                  } ${!cell.isCurrentMonth ? "bg-bg-secondary/50" : ""}`}
                >
                  <div
                    className={`text-xs sm:text-sm font-bold mb-1 flex-shrink-0 ${
                      !cell.isCurrentMonth
                        ? "text-text-muted/40"
                        : isToday
                          ? "text-accent-dark"
                          : "text-text-muted"
                    }`}
                  >
                    {cell.day}
                  </div>
                  {cell.isCurrentMonth && (
                    <NameList names={names} month={cell.month} day={cell.day} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function NameList({
  names,
  month,
  day,
}: {
  names: string[];
  month: number;
  day: number;
}) {
  if (names.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto min-w-0">
      {/* Desktop: show all names */}
      <div className="hidden md:block text-xs leading-snug">
        {names.map((name, i) => (
          <div key={name} className="truncate">
            <Link
              href={`/varda-dienas/${name.toLowerCase()}`}
              className="text-primary hover:text-primary-light hover:underline break-words"
            >
              {name}
            </Link>
          </div>
        ))}
      </div>
      {/* Mobile: show max 2, then +N */}
      <div className="md:hidden text-xs leading-snug">
        {names.slice(0, 2).map((name) => (
          <div key={name} className="truncate">
            <Link
              href={`/varda-dienas/${name.toLowerCase()}`}
              className="text-primary hover:text-primary-light hover:underline"
            >
              {name}
            </Link>
          </div>
        ))}
        {names.length > 2 && (
          <div className="text-text-muted text-[10px]">
            +{names.length - 2}
          </div>
        )}
      </div>
    </div>
  );
}
