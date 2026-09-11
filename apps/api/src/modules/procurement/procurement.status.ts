export type TenderUrgency = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';

export const DUE_SOON_WINDOW_DAYS = 7;

/* Tenders carry no stored status; urgency is derived from the submission date. */
export function tenderUrgency(
  submissionDate: string,
  today: string,
): TenderUrgency {
  if (submissionDate < today) {
    return 'OVERDUE';
  }

  const dueSoonCutoff = addDays(today, DUE_SOON_WINDOW_DAYS);
  return submissionDate <= dueSoonCutoff ? 'DUE_SOON' : 'UPCOMING';
}

/* Matches the legacy rule: a tender is ended once its closing date is past. */
export function tenderEnded(
  closingDate: string | null,
  today: string,
): boolean {
  return Boolean(closingDate) && (closingDate as string) < today;
}

export function guaranteeExpiringSoon(
  expiryDate: string,
  today: string,
  withinDays = 30,
): boolean {
  return expiryDate >= today && expiryDate <= addDays(today, withinDays);
}

export function addDays(isoDate: string, days: number): string {
  const value = new Date(`${isoDate}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
