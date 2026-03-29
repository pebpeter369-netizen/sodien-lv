"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface HolidayInfo {
  name: string;
  slug: string;
  isPublicHoliday: boolean;
}

interface NameDayEntry {
  month: number;
  day: number;
  names: string[];
}

interface TransferredDay {
  freeDay: { month: number; day: number };
  workDay: { month: number; day: number };
  reason: string;
}

interface ShortenedDay {
  month: number;
  day: number;
  hours: number;
  reason: string;
}

interface WorkCalendarData {
  transferredDays: TransferredDay[];
  shortenedDays: ShortenedDay[];
  description: string;
}

interface Props {
  year: number;
  holidays: Record<string, HolidayInfo[]>; // "M-D" -> holidays
  nameDays: NameDayEntry[];
  workCalendar: WorkCalendarData | null; // null if year has no MK data
}

const WEEKDAY_SHORT = ["P", "O", "T", "C", "Pk", "S", "Sv"];
const MONTHS_LV = [
  "Janvāris",
  "Februāris",
  "Marts",
  "Aprīlis",
  "Maijs",
  "Jūnijs",
  "Jūlijs",
  "Augusts",
  "Septembris",
  "Oktobris",
  "Novembris",
  "Decembris",
];

const WEEKDAY_NAMES = [
  "Svētdiena",
  "Pirmdiena",
  "Otrdiena",
  "Trešdiena",
  "Ceturtdiena",
  "Piektdiena",
  "Sestdiena",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

interface MonthStats {
  workDays: number;
  workHours: number;
  calendarDays: number;
  holidays: number;
}

function calcMonthStats(
  year: number,
  month: number,
  holidayMap: Record<string, HolidayInfo[]>,
  transferredFreeDays: Set<string>,
  transferredWorkDays: Set<string>,
  shortenedDayMap: Map<string, number>
): MonthStats {
  const daysInMonth = getDaysInMonth(year, month);
  let workDays = 0;
  let workHours = 0;
  let publicHolidayCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    const key = `${month + 1}-${d}`;
    const isHoliday = holidayMap[key]?.some((h) => h.isPublicHoliday);
    const isTransferredFree = transferredFreeDays.has(key);
    const isTransferredWork = transferredWorkDays.has(key);
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

    if (isHoliday) {
      publicHolidayCount++;
    }

    // A day is a work day if:
    // - It's a normal weekday that's not a holiday and not a transferred free day
    // - OR it's a transferred work day (Saturday that became a work day)
    let isWorkDay = false;
    if (isTransferredWork && !isHoliday) {
      isWorkDay = true;
    } else if (!isWeekendDay && !isHoliday && !isTransferredFree) {
      isWorkDay = true;
    }

    if (isWorkDay) {
      workDays++;
      const hours = shortenedDayMap.get(key) ?? 8;
      workHours += hours;
    }
  }

  return {
    workDays,
    workHours,
    calendarDays: daysInMonth,
    holidays: publicHolidayCount,
  };
}

export default function AnnualCalendar({
  year,
  holidays,
  nameDays,
  workCalendar,
}: Props) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);

  const nameDayMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const nd of nameDays) {
      map[`${nd.month}-${nd.day}`] = nd.names;
    }
    return map;
  }, [nameDays]);

  // Build sets for transferred days
  const { transferredFreeDays, transferredWorkDays, transferredFreeReasons, transferredWorkReasons } =
    useMemo(() => {
      const freeDays = new Set<string>();
      const workDays = new Set<string>();
      const freeReasons: Record<string, string> = {};
      const workReasons: Record<string, string> = {};

      if (workCalendar) {
        for (const t of workCalendar.transferredDays) {
          const freeKey = `${t.freeDay.month}-${t.freeDay.day}`;
          const workKey = `${t.workDay.month}-${t.workDay.day}`;
          freeDays.add(freeKey);
          workDays.add(workKey);
          freeReasons[freeKey] = t.reason;
          workReasons[workKey] = `Pārcelta darba diena (no ${t.freeDay.day}.${t.freeDay.month < 10 ? "0" : ""}${t.freeDay.month}.)`;
        }
      }

      return {
        transferredFreeDays: freeDays,
        transferredWorkDays: workDays,
        transferredFreeReasons: freeReasons,
        transferredWorkReasons: workReasons,
      };
    }, [workCalendar]);

  // Build shortened day map
  const shortenedDayMap = useMemo(() => {
    const map = new Map<string, number>();
    if (workCalendar) {
      for (const s of workCalendar.shortenedDays) {
        // If this day is a transferred free day, the shortened hours apply to
        // the transferred work day instead
        const key = `${s.month}-${s.day}`;
        if (transferredFreeDays.has(key)) {
          // Find which work day this was transferred to
          const transfer = workCalendar.transferredDays.find(
            (t) => t.freeDay.month === s.month && t.freeDay.day === s.day
          );
          if (transfer) {
            map.set(`${transfer.workDay.month}-${transfer.workDay.day}`, s.hours);
          }
        } else {
          map.set(key, s.hours);
        }
      }
    }
    return map;
  }, [workCalendar, transferredFreeDays]);

  // Build shortened day reasons map for tooltips
  const shortenedDayReasons = useMemo(() => {
    const reasons: Record<string, string> = {};
    if (workCalendar) {
      for (const s of workCalendar.shortenedDays) {
        const key = `${s.month}-${s.day}`;
        if (!transferredFreeDays.has(key)) {
          reasons[key] = `${s.reason} (${s.hours} st.)`;
        }
        // Also mark the transferred work day
        const transfer = workCalendar.transferredDays.find(
          (t) => t.freeDay.month === s.month && t.freeDay.day === s.day
        );
        if (transfer) {
          const workKey = `${transfer.workDay.month}-${transfer.workDay.day}`;
          reasons[workKey] = `Saīsināta darba diena (${s.hours} st.)`;
        }
      }
    }
    return reasons;
  }, [workCalendar, transferredFreeDays]);

  const yearStats = useMemo(() => {
    const stats: MonthStats[] = [];
    for (let m = 0; m < 12; m++) {
      stats.push(
        calcMonthStats(
          selectedYear,
          m,
          holidays,
          transferredFreeDays,
          transferredWorkDays,
          shortenedDayMap
        )
      );
    }
    return stats;
  }, [selectedYear, holidays, transferredFreeDays, transferredWorkDays, shortenedDayMap]);

  const totalWorkDays = yearStats.reduce((s, m) => s + m.workDays, 0);
  const totalWorkHours = yearStats.reduce((s, m) => s + m.workHours, 0);
  const totalHolidays = yearStats.reduce((s, m) => s + m.holidays, 0);

  const today = new Date();
  const isCurrentYear = selectedYear === today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const hasWorkCalendarData = workCalendar !== null;

  function handleDayHover(e: React.MouseEvent, month: number, day: number) {
    const key = `${month + 1}-${day}`;
    const dayHolidays = holidays[key] || [];
    const dayNames = nameDayMap[key] || [];
    const date = new Date(selectedYear, month, day);
    const weekdayName = WEEKDAY_NAMES[date.getDay()];

    const isTransferredFree = transferredFreeDays.has(key);
    const isTransferredWork = transferredWorkDays.has(key);
    const isShortenedDay = shortenedDayReasons[key];

    const rect = (e.target as HTMLElement).getBoundingClientRect();

    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      content: (
        <div className="text-left">
          <div className="font-semibold text-sm">
            {day}. {MONTHS_LV[month].toLowerCase()} — {weekdayName}
          </div>
          {dayHolidays.length > 0 && (
            <div className="mt-1">
              {dayHolidays.map((h) => (
                <div key={h.slug} className="flex items-center gap-1.5">
                  {h.isPublicHoliday && (
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                  <span
                    className={
                      h.isPublicHoliday
                        ? "text-red-600 font-medium"
                        : ""
                    }
                  >
                    {h.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          {isTransferredFree && (
            <div className="mt-1 text-xs font-medium text-blue-600">
              Pārcelta brīvdiena
              {transferredFreeReasons[key] && (
                <span className="font-normal text-text-muted">
                  {" "}— {transferredFreeReasons[key]}
                </span>
              )}
            </div>
          )}
          {isTransferredWork && (
            <div className="mt-1 text-xs font-medium text-orange-600">
              {transferredWorkReasons[key]}
            </div>
          )}
          {isShortenedDay && (
            <div className="mt-1 text-xs text-purple-600">
              {shortenedDayReasons[key]}
            </div>
          )}
          {dayNames.length > 0 && (
            <div className="mt-1 text-xs text-text-muted">
              Vārda dienas: {dayNames.join(", ")}
            </div>
          )}
        </div>
      ),
    });
  }

  return (
    <div>
      {/* Year selector and summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-surface-raised text-sm font-medium transition-colors"
            aria-label="Iepriekšējais gads"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold font-heading text-primary">
            {selectedYear}. gads
          </h2>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-surface-raised text-sm font-medium transition-colors"
            aria-label="Nākamais gads"
          >
            →
          </button>
        </div>

        <div className="flex gap-3 text-sm">
          <div className="text-center px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="font-bold text-emerald-700 text-lg">
              {totalWorkDays}
            </div>
            <div className="text-emerald-600 text-xs">
              darba dienas
            </div>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <div className="font-bold text-blue-700 text-lg">
              {totalWorkHours}
            </div>
            <div className="text-blue-600 text-xs">
              darba stundas
            </div>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <div className="font-bold text-red-700 text-lg">
              {totalHolidays}
            </div>
            <div className="text-red-600 text-xs">
              svētku dienas
            </div>
          </div>
        </div>
      </div>

      {/* MK data notice */}
      {hasWorkCalendarData && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
          Iekļautas pārceltās darba dienas un pirmssvētku saīsinātās dienas
          saskaņā ar {workCalendar.description}.
        </div>
      )}
      {!hasWorkCalendarData && selectedYear !== year && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          {selectedYear}. gadam vēl nav apstiprināts MK rīkojums par pārceltajām darba dienām.
          Rādīts aprēķins bez pārceltajām dienām.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-500/90" />{" "}
          Svētku diena
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-gray-200" />{" "}
          Brīvdiena
        </span>
        {hasWorkCalendarData && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-blue-200 border border-blue-400" />{" "}
              Pārcelta brīvdiena
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-orange-200 border border-orange-400" />{" "}
              Pārcelta darba diena (S)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded border-b-2 border-purple-500" />{" "}
              Saīsināta diena (7 st.)
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-300" />{" "}
          Atzīmējamā diena
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-accent ring-offset-1" />{" "}
          Šodiena
        </span>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const daysInMonth = getDaysInMonth(selectedYear, monthIdx);
          const firstDay = getFirstDayOfWeek(selectedYear, monthIdx);
          const stats = yearStats[monthIdx];

          return (
            <div
              key={monthIdx}
              className="border border-border rounded-xl bg-white overflow-hidden shadow-sm"
            >
              {/* Month header */}
              <div className="bg-primary text-white px-3 py-2 flex items-center justify-between">
                <span className="font-heading font-bold text-sm">
                  {MONTHS_LV[monthIdx]}
                </span>
                <span className="text-xs opacity-80">
                  {stats.workDays} d.d. / {stats.workHours} st.
                </span>
              </div>

              {/* Weekday header */}
              <div className="grid grid-cols-7 text-center text-[10px] font-medium text-text-muted border-b border-border px-1.5 py-1">
                {WEEKDAY_SHORT.map((wd, i) => (
                  <div
                    key={wd}
                    className={
                      i >= 5 ? "text-text-muted" : ""
                    }
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 text-center px-1.5 py-1 gap-y-0.5">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const key = `${monthIdx + 1}-${day}`;
                  const dayHolidays = holidays[key] || [];
                  const hasPublicHoliday = dayHolidays.some(
                    (h) => h.isPublicHoliday
                  );
                  const hasNotableDay =
                    dayHolidays.length > 0 && !hasPublicHoliday;
                  const weekend = isWeekend(selectedYear, monthIdx, day);
                  const isToday =
                    isCurrentYear &&
                    monthIdx === todayMonth &&
                    day === todayDay;
                  const isTransferredFree = transferredFreeDays.has(key);
                  const isTransferredWork = transferredWorkDays.has(key);
                  const isShortenedDay = shortenedDayMap.has(key);

                  let cellClass =
                    "relative text-xs leading-6 rounded cursor-default transition-colors ";

                  if (hasPublicHoliday) {
                    cellClass +=
                      "bg-red-500/90 text-white font-bold hover:bg-red-600 ";
                  } else if (isTransferredFree) {
                    cellClass +=
                      "bg-blue-200 text-blue-800 font-medium hover:bg-blue-300 border border-blue-400 ";
                  } else if (isTransferredWork) {
                    cellClass +=
                      "bg-orange-200 text-orange-800 font-medium hover:bg-orange-300 border border-orange-400 ";
                  } else if (hasNotableDay) {
                    cellClass +=
                      "bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 ";
                  } else if (weekend) {
                    cellClass +=
                      "bg-surface-raised text-text-muted ";
                  } else {
                    cellClass +=
                      "text-text-secondary hover:bg-surface-raised ";
                  }

                  if (isToday) {
                    cellClass +=
                      "ring-2 ring-accent ring-offset-1 ";
                  }

                  return (
                    <div
                      key={day}
                      className={cellClass}
                      onMouseEnter={(e) => handleDayHover(e, monthIdx, day)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {day}
                      {isShortenedDay &&
                        !hasPublicHoliday &&
                        !isTransferredFree && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-0.5 bg-purple-500 rounded-full" />
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transferred days info */}
      {hasWorkCalendarData && workCalendar.transferredDays.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-heading font-bold text-primary mb-3">
            Pārceltās darba dienas {selectedYear}. gadā
          </h3>
          <div className="space-y-2">
            {workCalendar.transferredDays.map((t, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-white border border-border"
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                    {t.freeDay.day}.
                    {t.freeDay.month < 10 ? "0" : ""}
                    {t.freeDay.month}.
                  </span>
                  <span className="text-text-muted text-xs">
                    brīvdiena
                  </span>
                  <span className="text-text-muted">→</span>
                  <span className="shrink-0 px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">
                    {t.workDay.day}.
                    {t.workDay.month < 10 ? "0" : ""}
                    {t.workDay.month}.
                  </span>
                  <span className="text-text-muted text-xs">
                    darba diena
                  </span>
                </div>
                <span className="text-xs text-text-muted sm:ml-auto">
                  {t.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortened days info */}
      {hasWorkCalendarData && workCalendar.shortenedDays.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-heading font-bold text-primary mb-3">
            Pirmssvētku saīsinātās dienas (7 stundas)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {workCalendar.shortenedDays.map((s, i) => {
              const date = new Date(selectedYear, s.month - 1, s.day);
              const weekday = WEEKDAY_NAMES[date.getDay()];
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border"
                >
                  <span className="shrink-0 w-1 h-6 rounded-full bg-purple-500" />
                  <div>
                    <div className="text-sm font-medium text-text">
                      {s.day}.{s.month < 10 ? "0" : ""}
                      {s.month}. — {weekday}
                    </div>
                    <div className="text-xs text-text-muted">
                      {s.reason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly breakdown table */}
      <div className="mt-8 overflow-x-auto">
        <h3 className="text-lg font-heading font-bold text-primary mb-3">
          Darba dienas un stundas pa mēnešiem
        </h3>
        <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-primary text-white text-xs">
              <th className="text-left px-3 py-2 font-medium">Mēnesis</th>
              <th className="text-center px-2 py-2 font-medium">
                Kalendāra dienas
              </th>
              <th className="text-center px-2 py-2 font-medium">
                Darba dienas
              </th>
              <th className="text-center px-2 py-2 font-medium">
                Darba stundas
              </th>
              <th className="text-center px-2 py-2 font-medium">
                Svētku dienas
              </th>
            </tr>
          </thead>
          <tbody>
            {yearStats.map((stats, i) => (
              <tr
                key={i}
                className={
                  i % 2 === 0
                    ? "bg-white"
                    : "bg-surface-raised"
                }
              >
                <td className="px-3 py-1.5 font-medium text-text">
                  {MONTHS_LV[i]}
                </td>
                <td className="text-center px-2 py-1.5 text-text-secondary">
                  {stats.calendarDays}
                </td>
                <td className="text-center px-2 py-1.5 font-semibold text-emerald-700">
                  {stats.workDays}
                </td>
                <td className="text-center px-2 py-1.5 text-blue-700">
                  {stats.workHours}
                </td>
                <td className="text-center px-2 py-1.5 text-red-600">
                  {stats.holidays > 0 ? stats.holidays : "—"}
                </td>
              </tr>
            ))}
            <tr className="bg-primary/5 font-bold border-t-2 border-primary">
              <td className="px-3 py-2 text-text">
                Kopā
              </td>
              <td className="text-center px-2 py-2 text-text-secondary">
                {selectedYear % 4 === 0 &&
                (selectedYear % 100 !== 0 || selectedYear % 400 === 0)
                  ? 366
                  : 365}
              </td>
              <td className="text-center px-2 py-2 text-emerald-700">
                {totalWorkDays}
              </td>
              <td className="text-center px-2 py-2 text-blue-700">
                {totalWorkHours}
              </td>
              <td className="text-center px-2 py-2 text-red-600">
                {totalHolidays}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Public holidays list */}
      <div className="mt-8">
        <h3 className="text-lg font-heading font-bold text-primary mb-3">
          Svētku dienas {selectedYear}. gadā
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(holidays)
            .filter(([, hols]) => hols.some((h) => h.isPublicHoliday))
            .sort(([a], [b]) => {
              const [am, ad] = a.split("-").map(Number);
              const [bm, bd] = b.split("-").map(Number);
              return am !== bm ? am - bm : ad - bd;
            })
            .map(([key, hols]) => {
              const [m, d] = key.split("-").map(Number);
              const date = new Date(selectedYear, m - 1, d);
              const weekdayName = WEEKDAY_NAMES[date.getDay()];

              return hols
                .filter((h) => h.isPublicHoliday)
                .map((h) => (
                  <Link
                    key={h.slug}
                    href={`/svetku-dienas/${h.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-border hover:border-[#d69e2e] transition-colors group"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/90 text-white flex flex-col items-center justify-center text-xs leading-tight font-bold">
                      <span>{d}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {MONTHS_LV[m - 1].slice(0, 3).toLowerCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-text group-hover:text-accent transition-colors">
                        {h.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {weekdayName}
                      </div>
                    </div>
                  </Link>
                ));
            })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-white border border-border rounded-lg shadow-lg text-sm max-w-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
