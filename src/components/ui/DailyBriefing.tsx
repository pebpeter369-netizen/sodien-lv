"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import nameDaysData from "@/data/name-days.json";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

const LATVIAN_MONTHS = [
  "", "janvāra", "februāra", "marta", "aprīļa", "maija", "jūnija",
  "jūlija", "augusta", "septembra", "oktobra", "novembra", "decembra",
];

const LATVIAN_WEEKDAYS = [
  "Svētdiena", "Pirmdiena", "Otrdiena", "Trešdiena",
  "Ceturtdiena", "Piektdiena", "Sestdiena",
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
  if (target.getTime() < today.getTime()) {
    target = new Date(thisYear + 1, month - 1, day);
  }
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DailyBriefing() {
  const [mounted, setMounted] = useState(false);
  const [savedNames, setSavedNames] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setSavedNames(getSavedNames());
  }, []);

  const now = getTodayInLatvia();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Today's name days
  const todayEntry = (nameDaysData as NameDayEntry[]).find(
    (e) => e.month === month && e.day === day
  );
  const todayNames = todayEntry?.names || [];

  // Check if any saved names celebrate today or soon
  const savedAlerts = useMemo(() => {
    if (!mounted) return [];
    return savedNames
      .map((name) => {
        const date = getNameDayDate(name);
        if (!date) return null;
        const days = daysUntil(date.month, date.day);
        if (days > 7) return null; // Only show within next 7 days
        return { name, days, month: date.month, day: date.day };
      })
      .filter(Boolean)
      .sort((a, b) => a!.days - b!.days) as {
      name: string;
      days: number;
      month: number;
      day: number;
    }[];
  }, [savedNames, mounted]);

  // Day of year progress
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const isLeapYear = now.getFullYear() % 4 === 0;
  const totalDays = isLeapYear ? 366 : 365;
  const yearProgress = Math.round((dayOfYear / totalDays) * 100);

  if (!mounted) return null;

  // Don't show if no saved names and no alerts — keep it clean
  const hasAlerts = savedAlerts.length > 0;
  const hasSavedCelebrantToday = savedAlerts.some((a) => a.days === 0);

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-base">
          {LATVIAN_WEEKDAYS[now.getDay()]}, {day}. {LATVIAN_MONTHS[month]}
        </h3>
        <span className="text-xs text-text-muted">
          {yearProgress}% no gada
        </span>
      </div>

      {/* Year progress bar */}
      <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
          style={{ width: `${yearProgress}%` }}
        />
      </div>

      {/* Alerts for saved names */}
      {hasAlerts && (
        <div className="space-y-2 mb-3">
          {savedAlerts.map((alert) => (
            <Link
              key={alert.name}
              href={`/varda-dienas/${alert.name.toLowerCase()}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                alert.days === 0
                  ? "bg-accent/15 text-accent-dark font-medium"
                  : "bg-bg-secondary hover:bg-bg-tertiary"
              }`}
            >
              <span>
                {alert.days === 0 ? "🎉 " : "📅 "}
                {alert.name}
              </span>
              <span className={alert.days === 0 ? "font-bold" : "text-text-muted"}>
                {alert.days === 0
                  ? "Šodien svin!"
                  : alert.days === 1
                    ? "Rīt"
                    : `pēc ${alert.days} d.`}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Today's name days (compact) */}
      {!hasSavedCelebrantToday && todayNames.length > 0 && (
        <p className="text-sm text-text-secondary">
          Šodien svin:{" "}
          {todayNames.map((name, i) => (
            <span key={name}>
              {i > 0 && ", "}
              <Link
                href={`/varda-dienas/${name.toLowerCase()}`}
                className="font-medium text-text hover:text-primary"
              >
                {name}
              </Link>
            </span>
          ))}
        </p>
      )}

      {savedNames.length === 0 && (
        <p className="text-xs text-text-muted mt-2">
          <Link href="/varda-dienas" className="text-primary hover:underline">
            Saglabā vārdus
          </Link>
          , lai redzētu personalizētu pārskatu.
        </p>
      )}
    </div>
  );
}
