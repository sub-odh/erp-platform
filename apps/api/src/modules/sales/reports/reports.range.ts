const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export type MonthKey = (typeof MONTH_KEYS)[number];

export function kathmanduDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function reportRange(
  month: string | undefined,
  now = new Date(),
): { start: string; end: string } {
  const today = kathmanduDate(now);
  const year = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  if (month && month !== "all" && /^(0[1-9]|1[0-2])$/.test(month)) {
    const selected = Number(month);
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${String(lastDay(year, selected)).padStart(2, "0")}`,
    };
  }
  let startYear = year;
  let startMonth = currentMonth - 11;
  while (startMonth <= 0) {
    startMonth += 12;
    startYear -= 1;
  }
  return {
    start: `${startYear}-${String(startMonth).padStart(2, "0")}-01`,
    end: `${year}-${String(currentMonth).padStart(2, "0")}-${String(lastDay(year, currentMonth)).padStart(2, "0")}`,
  };
}

export function monthWindow(monthKey: MonthKey, now = new Date()): { start: string; end: string } {
  const year = Number(kathmanduDate(now).slice(0, 4));
  const month = MONTH_KEYS.indexOf(monthKey) + 1;
  const padded = String(month).padStart(2, "0");
  return {
    start: `${year}-${padded}-01`,
    end: `${year}-${padded}-${String(lastDay(year, month)).padStart(2, "0")}`,
  };
}

export function currentMonthWindow(now = new Date()): { start: string; end: string } {
  const today = kathmanduDate(now);
  return monthWindow(MONTH_KEYS[Number(today.slice(5, 7)) - 1] ?? "jan", now);
}

export function calendarYearWindow(now = new Date()): { start: string; end: string } {
  const year = kathmanduDate(now).slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function effectiveTarget(
  baseTarget: number,
  targetStartDate: string | null | undefined,
  targetEndDate: string | null | undefined,
  filterStart: string,
  filterEnd: string,
  now = new Date(),
): number {
  if (!baseTarget || baseTarget <= 0) return 0;
  const year = calendarYearWindow(now);
  const empStart = dayNumber(targetStartDate || year.start);
  const empEnd = dayNumber(targetEndDate || year.end);
  const overlapStart = Math.max(empStart, dayNumber(filterStart));
  const overlapEnd = Math.min(empEnd, dayNumber(filterEnd));
  if (overlapStart > overlapEnd) return 0;
  const totalTargetDays = Math.max(1, empEnd - empStart + 1);
  const overlapDays = overlapEnd - overlapStart + 1;
  return (baseTarget / totalTargetDays) * overlapDays;
}

export function cappedPercent(achieved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 1000) / 10);
}

export function monthKeyFromIso(value: string): MonthKey {
  const month = Number(value.slice(5, 7));
  return MONTH_KEYS[month - 1] ?? "jan";
}

export function trendLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 2));
  const short = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  return `${short} ${year}`;
}

export function emptyMonths(): Record<MonthKey, number> {
  return {
    jan: 0,
    feb: 0,
    mar: 0,
    apr: 0,
    may: 0,
    jun: 0,
    jul: 0,
    aug: 0,
    sep: 0,
    oct: 0,
    nov: 0,
    dec: 0,
  };
}

function lastDay(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayNumber(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000;
}
