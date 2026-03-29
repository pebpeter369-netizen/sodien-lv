"use client";

// Latvian gross salary distribution (approximate, based on CSP 2025 data)
// Percentile -> gross monthly salary in EUR
const SALARY_PERCENTILES = [
  { percentile: 10, salary: 780 },
  { percentile: 20, salary: 900 },
  { percentile: 25, salary: 980 },
  { percentile: 30, salary: 1050 },
  { percentile: 40, salary: 1200 },
  { percentile: 50, salary: 1400 }, // median
  { percentile: 60, salary: 1600 },
  { percentile: 70, salary: 1900 },
  { percentile: 75, salary: 2100 },
  { percentile: 80, salary: 2400 },
  { percentile: 90, salary: 3200 },
  { percentile: 95, salary: 4500 },
  { percentile: 99, salary: 8000 },
];

const AVERAGE_SALARY = 1680; // CSP average gross salary 2025 Q4

function getPercentile(grossSalary: number): number {
  if (grossSalary <= SALARY_PERCENTILES[0].salary) return SALARY_PERCENTILES[0].percentile;
  if (grossSalary >= SALARY_PERCENTILES[SALARY_PERCENTILES.length - 1].salary) return 99;

  for (let i = 1; i < SALARY_PERCENTILES.length; i++) {
    const prev = SALARY_PERCENTILES[i - 1];
    const curr = SALARY_PERCENTILES[i];
    if (grossSalary <= curr.salary) {
      // Linear interpolation
      const ratio = (grossSalary - prev.salary) / (curr.salary - prev.salary);
      return Math.round(prev.percentile + ratio * (curr.percentile - prev.percentile));
    }
  }
  return 99;
}

interface SalaryComparisonProps {
  grossSalary: number;
}

export function SalaryComparison({ grossSalary }: SalaryComparisonProps) {
  if (grossSalary <= 0) return null;

  const percentile = getPercentile(grossSalary);
  const vsAverage = ((grossSalary / AVERAGE_SALARY - 1) * 100).toFixed(0);
  const isAboveAverage = grossSalary > AVERAGE_SALARY;

  return (
    <div className="mt-6 p-4 border border-border rounded-lg bg-bg-secondary">
      <h3 className="text-sm font-semibold text-text-muted mb-3">
        Tava alga salīdzinājumā
      </h3>

      {/* Percentile bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>€780</span>
          <span>Vidējā €{AVERAGE_SALARY.toLocaleString("lv")}</span>
          <span>€8 000+</span>
        </div>
        <div className="relative h-3 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 rounded-full"
            style={{ width: `${Math.min(percentile, 100)}%` }}
          />
          {/* Average marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-text-muted"
            style={{ left: "50%" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-text-muted">Tava pozīcija: </span>
          <span className="font-semibold text-text">
            augstāka par {percentile}% darbinieku
          </span>
        </div>
        <div>
          <span className="text-text-muted">Pret vidējo: </span>
          <span className={`font-semibold ${isAboveAverage ? "text-green-700" : "text-red-600"}`}>
            {isAboveAverage ? "+" : ""}{vsAverage}%
          </span>
        </div>
      </div>

      <p className="text-[11px] text-text-muted mt-2">
        * Aptuvens salīdzinājums, pamatojoties uz CSP datiem par bruto algām Latvijā.
      </p>
    </div>
  );
}
