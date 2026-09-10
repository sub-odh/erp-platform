/**
 * Single source of truth for the currency prefix shown in the UI.
 * Changing this constant re-labels every amount across the app.
 */
export const CURRENCY_SYMBOL = "Rs.";

export function formatCurrency(
  value: string | number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const amount = Number(value);
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;

  return `${CURRENCY_SYMBOL} ${(Number.isFinite(amount) ? amount : 0).toLocaleString(
    "en-NP",
    {
      minimumFractionDigits,
      maximumFractionDigits:
        options?.maximumFractionDigits ?? minimumFractionDigits,
    },
  )}`;
}
