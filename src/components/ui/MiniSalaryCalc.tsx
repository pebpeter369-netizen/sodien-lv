"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import taxConfig from "@/data/tax-config.json";

function quickGrossToNet(gross: number): number {
  const employeeSocial = gross * taxConfig.employeeSocialContribution;

  const ntm = taxConfig.nonTaxableMinimum;
  let nonTaxable = 0;
  if (gross <= ntm.thresholdMonthly) {
    nonTaxable = ntm.maxMonthly;
  } else {
    nonTaxable = Math.max(
      0,
      ntm.maxMonthly - ntm.coefficient * (gross - ntm.thresholdMonthly)
    );
  }

  const taxableIncome = Math.max(0, gross - employeeSocial - nonTaxable);

  // Progressive income tax
  const annualTaxable = taxableIncome * 12;
  let annualTax = 0;
  let remaining = annualTaxable;

  for (const bracket of taxConfig.incomeTaxBrackets) {
    if (remaining <= 0) break;
    if (bracket.upTo === null) {
      annualTax += remaining * bracket.rate;
      remaining = 0;
    } else {
      const prevLimit =
        taxConfig.incomeTaxBrackets.indexOf(bracket) > 0
          ? taxConfig.incomeTaxBrackets[
              taxConfig.incomeTaxBrackets.indexOf(bracket) - 1
            ].upTo ?? 0
          : 0;
      const bracketSize = bracket.upTo - prevLimit;
      const inThisBracket = Math.min(remaining, bracketSize);
      annualTax += inThisBracket * bracket.rate;
      remaining -= inThisBracket;
    }
  }

  const incomeTax = annualTax / 12;
  return Math.max(0, gross - employeeSocial - incomeTax);
}

export function MiniSalaryCalc() {
  const [input, setInput] = useState("");

  const net = useMemo(() => {
    const num = parseFloat(input.replace(/\s/g, "").replace(",", "."));
    if (isNaN(num) || num <= 0) return null;
    return quickGrossToNet(num);
  }, [input]);

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">&#128176;</span>
        <h2 className="font-heading font-semibold text-lg">Algu kalkulators</h2>
      </div>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            €
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bruto alga"
            className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <span className="text-text-muted text-sm shrink-0">→</span>
        <div className="flex-1 bg-bg-secondary rounded-lg py-2.5 px-3 text-center">
          {net !== null ? (
            <span className="font-semibold text-green-700 text-sm">
              €{net.toFixed(2).replace(".", ",")} neto
            </span>
          ) : (
            <span className="text-text-muted text-sm">Neto alga</span>
          )}
        </div>
      </div>
      <Link
        href="/algu-kalkulators"
        className="block mt-3 text-sm text-primary hover:underline text-center"
      >
        Detalizēts kalkulators →
      </Link>
    </div>
  );
}
