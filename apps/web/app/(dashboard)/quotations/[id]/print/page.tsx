"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCurrentCompany } from "@/lib/company";
import { formatPiAmount } from "@/lib/pi-format";
import { getQuotation } from "@/lib/quotations";
import type { Company } from "@/types/company";
import type { QuotationDetails } from "@/types/quotations";

export default function QuotationPrintPage() {
  const params = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [quote, setQuote] = useState<QuotationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentCompany().catch(() => null), getQuotation(params.id)])
      .then(([current, details]) => {
        if (!active) return;
        setCompany(current);
        setQuote(details);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Quotation not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!quote) return;
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [quote]);

  if (error) return <p className="p-6 text-sm text-rose-700">{error}</p>;
  if (!quote) return <p className="p-6 text-sm text-slate-500">Loading quotation...</p>;

  const companyName = company?.legalName || company?.name || "Main Corporation Ltd.";
  const address =
    [company?.addressLine1, company?.addressLine2, company?.city, company?.country]
      .filter(Boolean)
      .join(", ") || "Corporate Office Complex, Building A";
  const phone = company?.phone || "+977-1-0000000";
  const email = company?.email || "info@company.com";
  const website = company?.website?.trim();
  const vatOn = quote.currency === "NPR" && quote.vatApplicable === 1;
  const unit = quote.currency === "USD" ? "USD" : "Rs.";
  const expiry = quote.expiryDate || "On Notice";

  return (
    <div className="min-h-screen bg-slate-100 text-[13px] text-slate-800 print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-950 px-5 py-3 text-white print:hidden">
        <span className="text-sm font-semibold">Print Preview Mode</span>
        <div className="flex gap-2">
          <Link href="/quotations">
            <Button variant="secondary" size="sm">
              Return
            </Button>
          </Link>
          <Button variant="success" size="sm" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>
      <div className="flex justify-center py-8 print:block print:py-0">
        <article className="relative min-h-[297mm] w-[210mm] bg-white px-10 pb-24 pt-8 shadow-xl print:w-full print:min-h-0 print:px-[10mm] print:pb-[20mm] print:pt-0 print:shadow-none">
          <header className="print:fixed print:left-0 print:right-0 print:top-0 print:bg-white print:px-[10mm] print:pt-[10mm]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[1.85rem] font-extrabold uppercase tracking-tight text-blue-500">
                  {companyName}
                </h1>
              </div>
              {company?.invoiceLogoUrl || company?.logoUrl ? (
                <AuthenticatedImage
                  src={company.invoiceLogoUrl || company.logoUrl || undefined}
                  alt={companyName}
                  className="h-14 w-auto object-contain"
                />
              ) : null}
            </div>
            <div className="mt-2 mb-5">
              <div className="h-[3px] bg-blue-500" />
              <div className="mt-0.5 h-px bg-emerald-500" />
            </div>
          </header>
          <div className="print:h-[38mm]" />
          <div className="mb-3 grid grid-cols-[1.4fr_1fr] gap-3">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-500">To,</p>
              <p className="mb-1 font-bold">{quote.customerName || "N/A"}</p>
              <p className="whitespace-pre-line text-xs text-slate-500">
                <strong>Address :</strong> {quote.customerAddress || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="mb-2">
                <span className="text-[0.72rem] font-bold uppercase text-slate-500">Date: </span>
                <span className="font-bold">{quote.quotationDate}</span>
              </p>
              <p className="text-[0.8rem] font-bold uppercase text-slate-500">Quotation No:</p>
              <p className="font-mono text-base font-bold text-blue-600">{quote.quotationNumber}</p>
              <p className="mt-1 text-xs text-slate-500">Expiry: {expiry}</p>
            </div>
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-slate-600">
                <th className="w-[4%] py-2 text-center">#</th>
                <th className="w-[26%] py-2 text-left">Product / Part Number</th>
                <th className="w-[40%] py-2 text-left">Description</th>
                <th className="w-[6%] py-2 text-center">Qty</th>
                <th className="w-[12%] py-2 text-right">Unit Rate ({unit})</th>
                <th className="w-[12%] py-2 text-right">Amount ({unit})</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No itemized listings found.
                  </td>
                </tr>
              ) : (
                quote.items.map((item, index) => (
                  <tr key={item.id ?? index} className="border-t border-slate-200">
                    <td className="py-2 text-center text-slate-500">{index + 1}</td>
                    <td className="py-2 font-bold">{item.itemName || "Item"}</td>
                    <td className="py-2 text-xs text-slate-500">{item.description || "-"}</td>
                    <td className="py-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-2 text-right font-mono">{formatPiAmount(item.unitPrice, quote.currency)}</td>
                    <td className="py-2 text-right font-mono font-bold">
                      {formatPiAmount(item.quantity * Number(item.unitPrice), quote.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <table className="mt-2 w-full text-[13px]">
            <tbody>
              <tr>
                <td colSpan={5} className="py-1 text-right font-mono">Total:</td>
                <td className="w-[12%] py-1 text-right font-mono font-bold">{formatPiAmount(quote.subtotalAmount, quote.currency)}</td>
              </tr>
              {vatOn ? (
                <tr>
                  <td colSpan={5} className="py-1 text-right font-mono text-slate-500">VAT (13%):</td>
                  <td className="py-1 text-right font-mono font-bold text-slate-500">{formatPiAmount(quote.vatAmount, quote.currency)}</td>
                </tr>
              ) : null}
              <tr>
                <td colSpan={4} className="py-2 pr-4 text-left">
                  <strong>In Words:</strong> {quote.amountInWords}
                </td>
                <td className="py-2 text-right font-mono font-bold whitespace-nowrap">Grand Total:</td>
                <td className="py-2 text-right font-mono font-bold whitespace-nowrap">
                  {formatPiAmount(quote.totalAmount, quote.currency)}
                </td>
              </tr>
            </tbody>
          </table>
          <section className="mt-6">
            <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide">Terms & Conditions</p>
            <p className="whitespace-pre-line text-[0.8rem] leading-relaxed text-slate-600">
              {quote.termsConditions || `• 100% Advance Payment.\n• Quotation Validity: ${expiry}`}
            </p>
          </section>
          <div className="mt-10 flex justify-end">
            <div className="w-56 text-center">
              {quote.signatureUrl ? (
                <AuthenticatedImage src={quote.signatureUrl} alt="" className="mx-auto h-14 w-auto" />
              ) : null}
              <p className="mt-2 border-t border-slate-400 pt-1 font-bold">{quote.creatorName || "Authorized Representative"}</p>
              <p className="text-xs">Authorized Representative</p>
            </div>
          </div>
          <footer className="absolute bottom-0 left-0 right-0 print:fixed">
            <p className="px-10 py-2 text-center font-mono text-xs text-slate-600 print:px-[10mm]">
              Address: {address} | Tel: {phone}, Email: {email}
              {website ? `, Web: ${website}` : ""}
              {company?.taxNumber ? `, VAT/PAN: ${company.taxNumber}` : ""}
            </p>
            <div className="flex h-3.5">
              <div className="w-[28%] bg-blue-500" />
              <div className="w-[72%] bg-emerald-500" />
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
