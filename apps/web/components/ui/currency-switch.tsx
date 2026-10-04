"use client";

import { ArrowLeftRight } from "lucide-react";

type DocumentCurrency = "NPR" | "USD";

export function CurrencyTag({ children }: { children: string }) {
  return (
    <span className="rounded bg-[#ffe066] px-1 font-semibold text-slate-900">
      {children}
    </span>
  );
}

export function CurrencySwitch({
  value,
  onChange,
  className = "",
}: {
  value: DocumentCurrency;
  onChange: (next: DocumentCurrency) => void;
  className?: string;
}) {
  const badge = value === "USD" ? "USD" : "Rs.";

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded border border-slate-900 bg-amber-300 px-3 py-1 text-sm font-bold text-slate-900 ${className}`}
      aria-label={`Currency ${badge}. Click to switch currency.`}
      onClick={() => onChange(value === "NPR" ? "USD" : "NPR")}
    >
      <ArrowLeftRight size={14} aria-hidden />
      Currency:
      <span className="ml-1 rounded bg-slate-900 px-1.5 text-white">{badge}</span>
    </button>
  );
}
