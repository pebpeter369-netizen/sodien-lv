"use client";

import { useState, useEffect } from "react";

interface HolidayCountdownProps {
  targetDate: string; // ISO date string
  holidayName: string;
}

export function HolidayCountdown({ targetDate, holidayName }: HolidayCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const target = new Date(targetDate + "T00:00:00");
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  const isToday = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-6 mb-8">
      <p className="text-white/70 text-sm mb-2">Līdz svētkiem atlicis</p>

      {isToday ? (
        <p className="text-2xl font-heading font-bold text-accent-light">
          Šodien ir {holidayName}!
        </p>
      ) : (
        <div className="flex gap-4 sm:gap-6">
          <CountdownUnit value={timeLeft.days} label="dienas" />
          <CountdownUnit value={timeLeft.hours} label="stundas" />
          <CountdownUnit value={timeLeft.minutes} label="minūtes" />
          <CountdownUnit value={timeLeft.seconds} label="sekundes" />
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-heading font-bold tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-xs text-white/60 mt-1">{label}</p>
    </div>
  );
}
