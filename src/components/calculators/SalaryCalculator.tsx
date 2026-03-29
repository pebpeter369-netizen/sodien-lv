"use client";

import { useState, useMemo } from "react";
import { formatLatvianNumber, formatLatvianCurrency } from "@/lib/latvian";
import { SalaryComparison } from "@/components/ui/SalaryComparison";
import taxConfig from "@/data/tax-config.json";

interface CalculationResult {
  grossMonthly: number;
  employeeSocialContrib: number;
  nonTaxableMinimum: number;
  dependentRelief: number;
  taxableIncome: number;
  incomeTax: number;
  netMonthly: number;
  employerCost: number;
  employerSocialContrib: number;
}

function calculateGrossToNet(
  grossMonthly: number,
  dependents: number
): CalculationResult {
  // Employee social contributions
  const employeeSocialContrib =
    grossMonthly * taxConfig.employeeSocialContribution;

  // Non-taxable minimum calculation
  const ntmConfig = taxConfig.nonTaxableMinimum;
  let nonTaxableMinimum = 0;
  if (grossMonthly <= ntmConfig.thresholdMonthly) {
    nonTaxableMinimum = ntmConfig.maxMonthly;
  } else {
    nonTaxableMinimum = Math.max(
      0,
      ntmConfig.maxMonthly -
        ntmConfig.coefficient * (grossMonthly - ntmConfig.thresholdMonthly)
    );
  }

  // Dependent relief
  const dependentRelief = dependents * taxConfig.dependentRelief.monthly;

  // Taxable income
  const taxableIncome = Math.max(
    0,
    grossMonthly - employeeSocialContrib - nonTaxableMinimum - dependentRelief
  );

  // Income tax (progressive)
  const annualTaxable = taxableIncome * 12;
  let annualTax = 0;
  let remaining = annualTaxable;

  for (const bracket of taxConfig.incomeTaxBrackets) {
    const limit = bracket.upTo ?? Infinity;
    const taxableInBracket = Math.min(remaining, limit - (annualTax > 0 ? taxConfig.incomeTaxBrackets[taxConfig.incomeTaxBrackets.indexOf(bracket) - 1]?.upTo ?? 0 : 0));

    if (remaining <= 0) break;

    if (bracket.upTo === null) {
      annualTax += remaining * bracket.rate;
      remaining = 0;
    } else {
      const prevLimit = taxConfig.incomeTaxBrackets.indexOf(bracket) > 0
        ? taxConfig.incomeTaxBrackets[taxConfig.incomeTaxBrackets.indexOf(bracket) - 1].upTo ?? 0
        : 0;
      const bracketSize = bracket.upTo - prevLimit;
      const inThisBracket = Math.min(remaining, bracketSize);
      annualTax += inThisBracket * bracket.rate;
      remaining -= inThisBracket;
    }
  }

  const incomeTax = annualTax / 12;

  // Net salary
  const netMonthly = grossMonthly - employeeSocialContrib - incomeTax;

  // Employer cost
  const employerSocialContrib =
    grossMonthly * taxConfig.employerSocialContribution;
  const employerCost = grossMonthly + employerSocialContrib;

  return {
    grossMonthly,
    employeeSocialContrib,
    nonTaxableMinimum,
    dependentRelief,
    taxableIncome,
    incomeTax,
    netMonthly: Math.max(0, netMonthly),
    employerCost,
    employerSocialContrib,
  };
}

function calculateNetToGross(
  targetNet: number,
  dependents: number
): CalculationResult {
  // Binary search for the gross that produces the target net
  let low = targetNet;
  let high = targetNet * 2;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const result = calculateGrossToNet(mid, dependents);
    if (Math.abs(result.netMonthly - targetNet) < 0.01) {
      return result;
    }
    if (result.netMonthly < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return calculateGrossToNet((low + high) / 2, dependents);
}

export function SalaryCalculator() {
  const [amount, setAmount] = useState("1500");
  const [mode, setMode] = useState<"gross-to-net" | "net-to-gross">(
    "gross-to-net"
  );
  const [dependents, setDependents] = useState(0);
  const [showAnnual, setShowAnnual] = useState(false);

  const result = useMemo(() => {
    const num = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
    if (isNaN(num) || num <= 0) return null;

    return mode === "gross-to-net"
      ? calculateGrossToNet(num, dependents)
      : calculateNetToGross(num, dependents);
  }, [amount, mode, dependents]);

  const multiplier = showAnnual ? 12 : 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden mb-6">
        <button
          onClick={() => setMode("gross-to-net")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === "gross-to-net"
              ? "bg-primary text-white"
              : "bg-white text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Bruto → Neto
        </button>
        <button
          onClick={() => setMode("net-to-gross")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === "net-to-gross"
              ? "bg-primary text-white"
              : "bg-white text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Neto → Bruto
        </button>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {mode === "gross-to-net"
            ? "Bruto alga mēnesī (EUR)"
            : "Vēlamā neto alga mēnesī (EUR)"}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted">
            €
          </span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="1 500"
          />
        </div>
      </div>

      {/* Dependents */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Apgādājamo skaits
        </label>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setDependents(n)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                dependents === n
                  ? "bg-primary text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Annual toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setShowAnnual(!showAnnual)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            showAnnual ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              showAnnual ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className="text-sm text-text-secondary">
          Rādīt gada summas
        </span>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Visual bar */}
          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="flex rounded-full overflow-hidden h-8">
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{
                  width: `${(result.netMonthly / result.employerCost) * 100}%`,
                }}
              >
                Neto
              </div>
              <div
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                style={{
                  width: `${(result.incomeTax / result.employerCost) * 100}%`,
                }}
              >
                IIN
              </div>
              <div
                className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                style={{
                  width: `${(result.employeeSocialContrib / result.employerCost) * 100}%`,
                }}
              >
                VSAOI
              </div>
              <div
                className="bg-red-400 flex items-center justify-center text-white text-xs font-medium"
                style={{
                  width: `${(result.employerSocialContrib / result.employerCost) * 100}%`,
                }}
              >
                Darbd.
              </div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="bg-white border border-border rounded-lg divide-y divide-border">
            <Row
              label="Darba devēja izmaksas"
              value={result.employerCost * multiplier}
              className="text-text-muted"
            />
            <Row
              label="Darba devēja VSAOI (23,59%)"
              value={result.employerSocialContrib * multiplier}
              className="text-text-muted text-sm"
              indent
            />
            <Row
              label="Bruto alga"
              value={result.grossMonthly * multiplier}
              className="font-semibold"
              highlight
            />
            <Row
              label="Darbinieka VSAOI (10,50%)"
              value={-result.employeeSocialContrib * multiplier}
              className="text-sm"
              indent
            />
            <Row
              label="Neapliekamais minimums"
              value={result.nonTaxableMinimum * multiplier}
              className="text-sm text-text-muted"
              indent
            />
            {dependents > 0 && (
              <Row
                label={`Atvieglojumi par apgādājamajiem (${dependents})`}
                value={result.dependentRelief * multiplier}
                className="text-sm text-text-muted"
                indent
              />
            )}
            <Row
              label="Apliekamais ienākums"
              value={result.taxableIncome * multiplier}
              className="text-sm"
              indent
            />
            <Row
              label="Iedzīvotāju ienākuma nodoklis"
              value={-result.incomeTax * multiplier}
              className="text-sm"
              indent
            />
            <Row
              label="Neto alga (uz rokas)"
              value={result.netMonthly * multiplier}
              className="font-bold text-lg"
              highlight
              green
            />
          </div>
        </div>
      )}

      {/* Salary comparison */}
      {result && (
        <SalaryComparison grossSalary={result.grossMonthly} />
      )}

      {/* Updated badge */}
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-bg-secondary rounded-full text-xs text-text-muted">
          Aktualizēts: {taxConfig.lastUpdated} | Likmes {taxConfig.year}. gadam
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  className = "",
  indent = false,
  highlight = false,
  green = false,
}: {
  label: string;
  value: number;
  className?: string;
  indent?: boolean;
  highlight?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${highlight ? "bg-bg-secondary" : ""} ${className}`}
    >
      <span className={indent ? "pl-4" : ""}>{label}</span>
      <span className={green ? "text-green-600" : ""}>
        {value < 0 ? "−" : ""}
        {formatLatvianCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
