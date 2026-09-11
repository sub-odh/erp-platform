import NepaliDate from "nepali-date-converter";

export type CalendarSystem = "AD" | "BS";

/*
 * Colloquial Bikram Sambat month names, which are what Nepali users read on a
 * wall calendar. The converter library ships the Sanskrit forms (Bhadra rather
 * than Bhadau), so the names live here instead.
 */
const BS_MONTHS_EN = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadau",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const BS_MONTHS_NP = [
  "बैशाख",
  "जेठ",
  "असार",
  "साउन",
  "भदौ",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फागुन",
  "चैत",
];

const WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAYS_NP = [
  "आइतबार",
  "सोमबार",
  "मंगलबार",
  "बुधबार",
  "बिहिबार",
  "शुक्रबार",
  "शनिबार",
];

const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export interface BsDate {
  /* Bikram Sambat year, for example 2083. */
  year: number;
  /* One-based month, so 5 is Bhadau. */
  month: number;
  day: number;
  /* Sunday is 0, matching the JavaScript convention. */
  weekday: number;
}

export function toBsDate(date: Date): BsDate {
  const converted = new NepaliDate(date);

  return {
    year: converted.getYear(),
    month: converted.getMonth() + 1,
    day: converted.getDate(),
    weekday: date.getDay(),
  };
}

export function fromBsDate(year: number, month: number, day: number): Date {
  return new NepaliDate(year, month - 1, day).toJsDate();
}

export function bsMonthName(month: number, numerals: "en" | "np" = "en"): string {
  const names = numerals === "np" ? BS_MONTHS_NP : BS_MONTHS_EN;
  return names[month - 1] ?? "";
}

export function weekdayName(
  weekday: number,
  numerals: "en" | "np" = "en",
): string {
  const names = numerals === "np" ? WEEKDAYS_NP : WEEKDAYS_EN;
  return names[weekday] ?? "";
}

export function toDevanagariDigits(value: number | string): string {
  return String(value).replace(
    /\d/g,
    (digit) => DEVANAGARI_DIGITS[Number(digit)],
  );
}

/* Days in a Bikram Sambat month vary year to year, so measure the gap to the next month. */
export function bsMonthLength(year: number, month: number): number {
  const start = fromBsDate(year, month, 1);
  const next =
    month === 12 ? fromBsDate(year + 1, 1, 1) : fromBsDate(year, month + 1, 1);

  return Math.round((next.getTime() - start.getTime()) / 86_400_000);
}

export function addBsMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12) + 1,
  };
}

/* Long form used in headings, for example "Bhadau 26, 2083" or "२६ भदौ, २०८३". */
export function formatBsDate(
  date: Date,
  options: { numerals?: "en" | "np"; withWeekday?: boolean } = {},
): string {
  const numerals = options.numerals ?? "en";
  const bs = toBsDate(date);

  const base =
    numerals === "np"
      ? `${toDevanagariDigits(bs.day)} ${bsMonthName(bs.month, "np")}, ${toDevanagariDigits(bs.year)}`
      : `${bsMonthName(bs.month)} ${bs.day}, ${bs.year}`;

  if (!options.withWeekday) {
    return base;
  }

  return `${base} ${weekdayName(bs.weekday, numerals)}`;
}

export function formatBsMonthTitle(
  year: number,
  month: number,
  numerals: "en" | "np" = "en",
): string {
  return numerals === "np"
    ? `${bsMonthName(month, "np")} ${toDevanagariDigits(year)}`
    : `${bsMonthName(month)} ${year}`;
}

/* Renders an ISO (yyyy-mm-dd) value in whichever calendar the user picked. */
export function formatCalendarDate(
  isoDate: string | null | undefined,
  system: CalendarSystem,
): string {
  if (!isoDate) {
    return "—";
  }

  const date = parseIsoDate(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  if (system === "BS") {
    return formatBsDate(date);
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* Treats a date-only string as local time so the day never shifts across time zones. */
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
