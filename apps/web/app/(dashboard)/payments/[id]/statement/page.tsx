"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { getRecoveryStatement, type RecoveryStatement } from "@/lib/recoveries";

export default function RecoveryStatementPage() {
  const params = useParams<{ id: string }>();
  const [statement, setStatement] = useState<RecoveryStatement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getRecoveryStatement(params.id)
      .then((result) => {
        if (active) setStatement(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof ApiError ? reason.message : "Record not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (error) return <p className="p-6 text-sm text-rose-700">{error}</p>;
  if (!statement) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 print:hidden">
        <Link href="/payments"><Button variant="outline" size="sm">Back</Button></Link>
        <Button size="sm" onClick={() => window.print()}>Print Statement</Button>
      </div>
      <article className="relative mx-auto max-w-2xl overflow-hidden rounded-xl bg-white p-8 shadow-sm print:max-w-none print:shadow-none">
        {statement.paid ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] rounded-3xl border-[10px] border-emerald-600/10 px-10 py-2 text-7xl font-black uppercase text-emerald-600/10">Paid</div>
        ) : null}
        <div className="relative mb-6 flex items-start justify-between gap-4">
          <div>
            {statement.logoUrl ? <AuthenticatedImage src={statement.logoUrl} alt="" className="mb-2 max-h-11" /> : null}
            <h1 className="text-xl font-bold">Account Statement</h1>
            <div className="mt-1 flex gap-1 text-xs">
              <span className="rounded border border-slate-200 px-2 py-0.5">DO: #{statement.deliveryNumber}</span>
              {statement.invoiceNumber ? <span className="rounded border border-slate-200 px-2 py-0.5">INV: #{statement.invoiceNumber}</span> : null}
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-xs font-bold uppercase">{statement.companyName}</p>
            <p className="whitespace-pre-line text-slate-500">{statement.companyAddress}</p>
            {statement.taxNumber ? <p className="text-slate-500">PAN/VAT: {statement.taxNumber}</p> : null}
          </div>
        </div>
        <div className="relative mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Customer Details</p>
            <p className="font-semibold">{statement.customerName}</p>
            <p className="whitespace-pre-line text-sm text-slate-500">{statement.customerAddress}</p>
            <p className="text-sm text-slate-500">{statement.customerPhone}</p>
            {statement.customerTaxNumber ? <p className="mt-1 text-sm font-semibold">VAT/PAN: {statement.customerTaxNumber}</p> : null}
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs">
            <Row label="Invoiced Amount:" value={formatCurrency(statement.invoicedAmount)} />
            <Row label="Received Amount:" value={formatCurrency(statement.receivedAmount)} />
            <Row label="Balance Outstanding:" value={formatCurrency(statement.balance)} strong />
          </div>
        </div>
        <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">Ledger Details</p>
        <table className="w-full border border-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="py-2 text-left">Method</th>
              <th className="py-2 text-left">Reference</th>
              <th className="px-2 py-2 text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {statement.payments.length === 0 ? (
              <tr><td colSpan={4} className="py-3 text-center text-slate-500">No payments found.</td></tr>
            ) : statement.payments.map((payment, index) => (
              <tr key={`${payment.paidAt}-${index}`} className="border-t border-slate-200">
                <td className="px-2 py-2">{formatLedger(payment.paidAt)}</td>
                <td className="py-2 text-[9px] font-semibold uppercase">{payment.method}</td>
                <td className="py-2 text-slate-500">{payment.referenceNumber}</td>
                <td className="px-2 py-2 text-right font-semibold">{formatCurrency(Number(payment.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-12 grid grid-cols-2 text-center text-[10px] font-bold uppercase text-slate-400">
          <div><div className="mx-auto mb-1 w-2/3 border-t border-slate-300" />Authorized Signatory</div>
          <div><div className="mx-auto mb-1 w-2/3 border-t border-slate-300" />Customer Signature</div>
        </div>
        <p className="mt-6 border-t border-slate-200 pt-2 text-center text-[8px] text-slate-400">
          Generated on {generatedOn()}. Computer generated document from <strong>{statement.companyName}</strong>.
        </p>
      </article>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${strong ? "border-t border-slate-200 font-semibold text-rose-600" : ""}`}>
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatLedger(value: string): string {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day}-${month}-${date.getFullYear()}`;
}

function generatedOn(): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}
