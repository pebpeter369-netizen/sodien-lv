"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpcomingHoliday {
  name: string;
  slug: string;
  day: number;
  monthShort: string;
  weekday: string;
}

export function HomepageToolCards({
  upcomingHolidays,
}: {
  upcomingHolidays: UpcomingHoliday[];
}) {
  const [bruto, setBruto] = useState("");
  const [neto, setNeto] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  function calculateNeto(value: string) {
    const gross = parseFloat(value);
    if (isNaN(gross) || gross <= 0) {
      setNeto(null);
      return;
    }
    // Simplified 2026 Latvia calculation
    const iinRate = 0.2;
    const vsaoiRate = 0.105;
    const vsaoi = gross * vsaoiRate;
    const taxable = gross - vsaoi;
    const iinBase = Math.max(0, taxable - 500);
    const iinTax = iinBase * iinRate;
    const net = gross - vsaoi - iinTax;
    setNeto(net.toFixed(2));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/varda-dienas/${searchValue.trim().toLowerCase()}`);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Salary Calculator Preview */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💰</span>
          <h2 className="font-heading font-semibold text-lg">Algu kalkulators</h2>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">€</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Bruto alga"
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={bruto}
              onChange={(e) => {
                setBruto(e.target.value);
                calculateNeto(e.target.value);
              }}
            />
          </div>
          <span className="text-text-muted text-sm shrink-0">→</span>
          <div className="flex-1 bg-bg-secondary rounded-lg py-2.5 px-3 text-center">
            <span className="text-text-muted text-sm">
              {neto ? `€ ${neto}` : "Neto alga"}
            </span>
          </div>
        </div>
        <Link
          href="/algu-kalkulators"
          className="block mt-3 text-sm text-primary hover:underline text-center"
        >
          Detalizēts kalkulators →
        </Link>
      </div>

      {/* Upcoming Holidays */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📅</span>
          <h2 className="font-heading font-semibold text-lg">Tuvākie svētki</h2>
        </div>
        {upcomingHolidays.length > 0 ? (
          <ul className="space-y-2.5">
            {upcomingHolidays.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/svetku-dienas/${h.slug}`}
                  className="flex items-center justify-between text-sm hover:text-primary transition-colors group"
                >
                  <span className="font-medium group-hover:text-primary truncate mr-2">
                    {h.name}
                  </span>
                  <span className="text-text-muted text-xs shrink-0">
                    {h.day}. {h.monthShort}{" "}
                    <span className="hidden sm:inline">({h.weekday})</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">Nav tuvu svētku</p>
        )}
        <Link
          href="/svetku-dienas"
          className="block mt-3 text-sm text-primary hover:underline text-center"
        >
          Visi svētki →
        </Link>
      </div>

      {/* Name Search */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎁</span>
          <h2 className="font-heading font-semibold text-lg">Meklēt vārdu</h2>
        </div>
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <input
              type="text"
              placeholder="Meklēt vārdu..."
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </form>
        <Link
          href="/varda-dienas"
          className="block mt-3 text-sm text-primary hover:underline text-center"
        >
          Pilns kalendārs →
        </Link>
      </div>
    </div>
  );
}
