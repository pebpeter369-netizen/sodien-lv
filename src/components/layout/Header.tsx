"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";

const StreakCounter = dynamic(
  () => import("@/components/ui/StreakCounter").then((m) => m.StreakCounter),
  { ssr: false }
);

const NAV_ITEMS = [
  { href: "/varda-dienas", label: "Vārda dienas" },
  { href: "/algu-kalkulators", label: "Algu kalkulators" },
  { href: "/svetku-dienas", label: "Svētku dienas" },
  { href: "/darba-dienu-kalendars", label: "Kalendārs" },
  { href: "/aktualitates", label: "Aktualitātes" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-8">
          <Link
            href="/"
            className="font-heading text-2xl font-bold text-primary shrink-0"
          >
            Tava<span className="text-accent">Diena</span>.lv
          </Link>

          {/* Desktop nav — left-aligned after logo */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-bg rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/meklet"
              className="p-2 text-text-muted hover:text-primary transition-colors"
              aria-label="Meklēt"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <StreakCounter />
          </div>

          <div className="flex items-center gap-2 md:hidden ml-auto">
            <StreakCounter />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-text-secondary hover:text-primary"
              aria-label="Atvērt izvēlni"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu with slide transition */}
        <nav
          className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
            mobileMenuOpen ? "max-h-60 pb-4 border-t border-border" : "max-h-0"
          }`}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-base font-medium text-text-secondary hover:text-primary hover:bg-bg rounded-md"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/meklet"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-3 text-base font-medium text-text-secondary hover:text-primary hover:bg-bg rounded-md"
          >
            Meklēt
          </Link>
        </nav>
      </div>
    </header>
  );
}
