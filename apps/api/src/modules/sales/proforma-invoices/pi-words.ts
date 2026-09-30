const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "Ten",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function spell(value: number, ones: string[], tens: string[]): string {
  let remaining = value;
  let text = "";
  if (remaining >= 100) {
    text += `${ones[Math.floor(remaining / 100)]} Hundred`;
    remaining %= 100;
  }
  if (remaining >= 20) {
    text += ` ${tens[Math.floor(remaining / 10)]} ${ones[remaining % 10]}`;
  } else if (remaining > 0) {
    text += ` ${ones[remaining]}`;
  }
  return text.trim();
}

/**
 * Amount in words from views/admin/pi_print.php.
 * NPR uses crore/lakh. USD uses billion/million.
 */
export function amountInWords(
  amount: number,
  currency: "NPR" | "USD",
): string {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const decimals = Math.round((safe - Math.floor(safe)) * 100);
  let whole = Math.floor(safe);
  const chunks: Array<[number, string]> =
    currency === "USD"
      ? [
          [1_000_000_000, "Billion"],
          [1_000_000, "Million"],
          [1000, "Thousand"],
          [100, "Hundred"],
        ]
      : [
          [10_000_000, "Crore"],
          [100_000, "Lakh"],
          [1000, "Thousands"],
          [100, "Hundred"],
        ];

  let words = "";
  if (whole === 0) {
    words = "Zero";
  } else {
    for (const [size, label] of chunks) {
      if (whole >= size) {
        const count = Math.floor(whole / size);
        whole %= size;
        words += ` ${spell(count, ONES, TENS)} ${label}`;
      }
    }
    if (whole > 0) words += ` ${spell(whole, ONES, TENS)}`;
  }

  const prefix = currency === "USD" ? "US Dollars" : "Nepalese Rupees";
  let result = `${prefix} ${words.trim()} Only`;
  if (decimals > 0) {
    const fraction = currency === "USD" ? "Cents" : "Paisa";
    result += ` and ${spell(decimals, ONES, TENS)} ${fraction}`;
  }
  return result.replace(/\s+/g, " ").trim();
}

export function proformaTotal(
  items: Array<{ quantity: number; unitPrice: number }>,
  currency: "NPR" | "USD",
): { subtotal: number; vat: number; total: number } {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const vat = currency === "NPR" ? subtotal * 0.13 : 0;
  return { subtotal, vat, total: subtotal + vat };
}
