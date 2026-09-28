export type ChartPoint = { label: string; value: number };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function utcDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function fillDailySeries(
  days: number,
  rows: Array<{ day: string; total: string | number }>,
  anchorDate?: string,
): ChartPoint[] {
  const totals = new Map(
    rows.map((row) => [String(row.day).slice(0, 10), Number(row.total)]),
  );
  const points: ChartPoint[] = [];
  const cursor = anchorDate
    ? utcDate(anchorDate)
    : startOfUtcDay();
  cursor.setUTCDate(cursor.getUTCDate() - (days - 1));
  for (let index = 0; index < days; index += 1) {
    const key = isoDate(cursor);
    points.push({
      label: days > 30 ? `${MONTHS[cursor.getUTCMonth()]} ${String(cursor.getUTCDate()).padStart(2, '0')}` : WEEKDAYS[cursor.getUTCDay()],
      value: totals.get(key) ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

export function shiftIsoDate(value: string, days: number): string {
  const date = utcDate(value);
  date.setUTCDate(date.getUTCDate() + days);

  return isoDate(date);
}

export function shiftIsoMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (monthIndex ?? 1) - 1 + delta, 1));

  return isoMonth(date);
}

export function fillMonthlySeries(
  months: number,
  rows: Array<{ month: string; total: string | number }>,
  anchorMonth?: string,
): ChartPoint[] {
  const totals = new Map(
    rows.map((row) => [row.month, Number(row.total)]),
  );
  const points: ChartPoint[] = [];
  const cursor =
    anchorMonth && isYearMonth(anchorMonth)
      ? utcDate(`${anchorMonth}-01`)
      : startOfUtcDay();
  cursor.setUTCDate(1);
  cursor.setUTCMonth(cursor.getUTCMonth() - (months - 1));
  for (let index = 0; index < months; index += 1) {
    const key = isoMonth(cursor);
    points.push({
      label: `${MONTHS[cursor.getUTCMonth()]} ${String(cursor.getUTCFullYear()).slice(2)}`,
      value: totals.get(key) ?? 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return points;
}

export function isYearMonth(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export function resolveYearMonth(
  value: string | undefined,
  currentMonth: string,
): string {
  return isYearMonth(value) ? value : currentMonth;
}

/** PHP min(100, round(achieved / target * 100, 1)). */
export function cappedPercent(achieved: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((achieved / target) * 1000) / 10);
}

/** PHP round(achieved / target * 100, 1) on the progress doughnut. */
export function rawPercent(achieved: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.round((achieved / target) * 1000) / 10;
}

/** PHP yearly target falls back to monthly * 12 when yearly is not set. */
export function resolvedYearlyTarget(monthly: number, yearly: number): number {
  if (yearly <= 0 && monthly > 0) {
    return monthly * 12;
  }

  return yearly;
}

export function kathmanduClock(now = new Date()): {
  date: string;
  month: string;
  time: string;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const year = read('year');
  const month = read('month');
  const day = read('day');
  const hour = read('hour');

  return {
    date: `${year}-${month}-${day}`,
    month: `${year}-${month}`,
    time: `${hour.padStart(2, '0')}:${read('minute')}:${read('second')}`,
  };
}

export function formatBackTime(value: string): string {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, '0')}${suffix}`;
}
