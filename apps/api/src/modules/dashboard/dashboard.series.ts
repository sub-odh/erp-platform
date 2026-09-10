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

export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function fillDailySeries(
  days: number,
  rows: Array<{ day: string; total: string | number }>,
): ChartPoint[] {
  const totals = new Map(
    rows.map((row) => [String(row.day).slice(0, 10), Number(row.total)]),
  );
  const points: ChartPoint[] = [];
  const cursor = startOfUtcDay();
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

export function fillMonthlySeries(
  months: number,
  rows: Array<{ month: string; total: string | number }>,
): ChartPoint[] {
  const totals = new Map(
    rows.map((row) => [row.month, Number(row.total)]),
  );
  const points: ChartPoint[] = [];
  const cursor = startOfUtcDay();
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
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}
