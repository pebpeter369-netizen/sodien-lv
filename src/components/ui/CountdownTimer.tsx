"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  label: string;
}

export function CountdownTimer({ targetDate, label }: CountdownTimerProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
  }, [targetDate]);

  if (days === null) return null;

  return (
    <div className="text-center">
      <div className="text-4xl font-heading font-bold text-primary">{days}</div>
      <div className="text-sm text-text-secondary mt-1">
        {days === 1 ? "diena" : "dienas"} līdz
      </div>
      <div className="font-semibold text-text mt-1">{label}</div>
    </div>
  );
}
