"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import nameDaysData from "@/data/name-days.json";

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
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

export function NameDayBanner() {
  const [todayNames, setTodayNames] = useState<string[]>([]);

  useEffect(() => {
    const now = getTodayInLatvia();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const today = (nameDaysData as NameDayEntry[]).find(
      (nd) => nd.month === month && nd.day === day
    );
    if (today) {
      setTodayNames(today.names);
    }
  }, []);

  if (todayNames.length === 0) return null;

  return (
    <div className="bg-primary text-white py-1.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <span className="text-accent">&#127873;</span>
        <span>
          Šodien vārda dienu svin:{" "}
          {todayNames.map((name, i) => (
            <span key={name}>
              {i > 0 && ", "}
              <Link
                href={`/varda-dienas/${name.toLowerCase()}`}
                className="font-semibold hover:text-accent-light transition-colors underline decoration-accent/30"
              >
                {name}
              </Link>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
