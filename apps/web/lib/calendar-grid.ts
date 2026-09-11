import {
  addBsMonths,
  bsMonthLength,
  bsMonthName,
  formatBsMonthTitle,
  fromBsDate,
  toBsDate,
  toIsoDate,
  type CalendarSystem,
} from "@/lib/nepali-date";

export const SATURDAY = 6;

const WEEKDAY_LABELS = [
  { short: "Sun", np: "आइत" },
  { short: "Mon", np: "सोम" },
  { short: "Tue", np: "मङ्गल" },
  { short: "Wed", np: "बुध" },
  { short: "Thu", np: "बिहि" },
  { short: "Fri", np: "शुक्र" },
  { short: "Sat", np: "शनि" },
];

export interface WeekdayColumn {
  /* Sunday is 0, matching the JavaScript convention. */
  index: number;
  short: string;
  np: string;
}

export interface MonthGrid {
  /* Heading in the active calendar, for example "Bhadau 2083". */
  title: string;
  /* The span the month covers in the other calendar, like "Aug/Sep 2026". */
  subtitle: string;
  start: Date;
  end: Date;
  /* Six weeks, so the grid height never jumps between months. */
  days: Date[];
  weekdays: WeekdayColumn[];
}

/* Nepali calendars start the week on Sunday; the Gregorian views here start on Monday. */
export function weekStartsOn(system: CalendarSystem): number {
  return system === "BS" ? 0 : 1;
}

export function weekdayColumns(system: CalendarSystem): WeekdayColumn[] {
  const first = weekStartsOn(system);

  return Array.from({ length: 7 }, (_, offset) => {
    const index = (first + offset) % 7;
    return { index, ...WEEKDAY_LABELS[index] };
  });
}

export function buildMonthGrid(
  anchor: Date,
  system: CalendarSystem,
): MonthGrid {
  const { start, length, title } =
    system === "BS" ? bsMonthBounds(anchor) : adMonthBounds(anchor);

  const end = addDays(start, length - 1);

  const leadingDays = (start.getDay() - weekStartsOn(system) + 7) % 7;
  const firstCell = addDays(start, -leadingDays);

  return {
    title,
    subtitle: oppositeMonthRange(start, end, system),
    start,
    end,
    days: Array.from({ length: 42 }, (_, index) => addDays(firstCell, index)),
    weekdays: weekdayColumns(system),
  };
}

export function shiftMonth(
  anchor: Date,
  system: CalendarSystem,
  delta: number,
): Date {
  if (system === "BS") {
    const bs = toBsDate(anchor);
    const next = addBsMonths(bs.year, bs.month, delta);
    return fromBsDate(next.year, next.month, 1);
  }

  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

/* The headline number in a cell, shown in whichever calendar is active. */
export function dayOfMonth(date: Date, system: CalendarSystem): number {
  return system === "BS" ? toBsDate(date).day : date.getDate();
}

/* The small companion number, always the other calendar's day. */
export function secondaryDayOfMonth(
  date: Date,
  system: CalendarSystem,
): number {
  return system === "BS" ? date.getDate() : toBsDate(date).day;
}

export function isWithinMonth(date: Date, grid: MonthGrid): boolean {
  const iso = toIsoDate(date);
  return iso >= toIsoDate(grid.start) && iso <= toIsoDate(grid.end);
}

export function isSameDay(first: Date, second: Date): boolean {
  return toIsoDate(first) === toIsoDate(second);
}

export function isSaturday(date: Date): boolean {
  return date.getDay() === SATURDAY;
}

function adMonthBounds(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const length = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + 1,
    0,
  ).getDate();

  return {
    start,
    length,
    title: new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(start),
  };
}

function bsMonthBounds(anchor: Date) {
  const bs = toBsDate(anchor);

  return {
    start: fromBsDate(bs.year, bs.month, 1),
    length: bsMonthLength(bs.year, bs.month),
    title: formatBsMonthTitle(bs.year, bs.month),
  };
}

/*
 * A Bikram Sambat month straddles two Gregorian months and vice versa, so the
 * subtitle names both ends of the span the way Nepali Patro does.
 */
function oppositeMonthRange(
  start: Date,
  end: Date,
  system: CalendarSystem,
): string {
  if (system === "BS") {
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short" });
    const startMonth = formatter.format(start);
    const endMonth = formatter.format(end);
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    }

    return start.getFullYear() === year
      ? `${startMonth}/${endMonth} ${year}`
      : `${startMonth} ${start.getFullYear()}/${endMonth} ${year}`;
  }

  const startBs = toBsDate(start);
  const endBs = toBsDate(end);

  if (startBs.month === endBs.month) {
    return `${bsMonthName(startBs.month)} ${startBs.year}`;
  }

  return startBs.year === endBs.year
    ? `${bsMonthName(startBs.month)}/${bsMonthName(endBs.month)} ${endBs.year}`
    : `${bsMonthName(startBs.month)} ${startBs.year}/${bsMonthName(endBs.month)} ${endBs.year}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
