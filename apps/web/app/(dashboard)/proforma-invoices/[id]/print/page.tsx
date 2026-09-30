"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCurrentCompany } from "@/lib/company";
import { formatPiAmount } from "@/lib/pi-format";
import { getProformaInvoice } from "@/lib/proforma-invoices";
import type { Company } from "@/types/company";
import type { ProformaCurrency, ProformaDetails } from "@/types/proforma-invoices";

const FALLBACK_TERMS =
  "This Proforma Invoice is issued for quotation verification. Final tax invoice will be generated upon payment confirmation.";

export default function ProformaPrintPage() {
  const params = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [invoice, setInvoice] = useState<ProformaDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getCurrentCompany().catch(() => null),
      getProformaInvoice(params.id),
    ])
      .then(([currentCompany, details]) => {
        if (!active) return;
        setCompany(currentCompany);
        setInvoice(details);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "The requested proforma invoice resource could not be found.",
        );
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!invoice) return;
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, [invoice]);

  if (error) return <p className="p-6 text-sm text-red-700">{error}</p>;
  if (!invoice) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const currency = invoice.currency as ProformaCurrency;
  const unitLabel = currency === "USD" ? "USD" : "Rs.";
  const hasName = invoice.items.some((item) => item.itemName.trim());
  const hasPart = invoice.items.some((item) => item.partNumber.trim());
  const hasDescription = invoice.items.some((item) => item.description.trim());
  const visibleColumns = 4 + Number(hasName) + Number(hasPart) + Number(hasDescription);
  const wordsSpan = Math.max(1, visibleColumns - 2);
  const companyName = company?.legalName || company?.name || "Main Corporation Ltd.";
  const address = [
    company?.addressLine1,
    company?.addressLine2,
    company?.city,
    company?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const customerLines = invoice.customerDetails.split(/\r?\n/);
  const billLines = (invoice.billTo || invoice.customerDetails).split(/\r?\n/);
  const shipLines = (invoice.shipTo || "Same as billing address.").split(/\r?\n/);
  const logo = company?.invoiceLogoUrl || company?.logoUrl;

  return (
    <div>
      <style>{`
        @media print {
          aside, header, .pi-no-print { display: none !important; }
          .pi-letter { box-shadow: none !important; width: 100% !important; min-height: auto !important; }
        }
      `}</style>
      <div className="pi-no-print mb-4 flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2 text-white">
        <span className="text-sm font-semibold">Proforma Invoice</span>
        <div className="flex gap-2">
          <Link href="/proforma-invoices" className="rounded border border-white/40 px-3 py-1 text-sm">
            Return to List
          </Link>
          <Button type="button" variant="success" size="sm" onClick={() => window.print()}>
            <Printer size={14} /> Print / Save PDF
          </Button>
        </div>
      </div>
      <article className="pi-letter relative mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-8 pb-16 pt-6 text-[13px] text-slate-800 shadow-xl">
        <header className="mb-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#3498db]">
              {companyName}
            </h1>
            {logo ? (
              <AuthenticatedImage src={logo} alt="Company Logo" className="max-h-14 object-contain" />
            ) : null}
          </div>
          <div className="mt-2 h-[3px] bg-[#3498db]" />
          <div className="mt-0.5 h-px bg-[#5cb85c]" />
        </header>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl font-extrabold text-[#013393]">Proforma Invoice</h2>
          <div className="text-right text-sm font-bold">
            <div>Date: {invoice.piDate}</div>
            <div className="text-blue-700">PI No: {invoice.piNumber}</div>
          </div>
        </div>
        <div className="mb-3">
          <div className="font-bold">To,</div>
          <div className="text-base font-bold">{customerLines[0] || "N/A"}</div>
          {customerLines.slice(1).join("\n").trim() ? (
            <div className="whitespace-pre-line text-slate-600">{customerLines.slice(1).join("\n")}</div>
          ) : null}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <AddressBox label="Billed To:" lines={billLines} />
          <AddressBox label="Ship To:" lines={shipLines} />
        </div>
        <table className="mb-3 w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase text-slate-700">
              <th className="border border-slate-300 px-2 py-1">#</th>
              {hasName ? <th className="border border-slate-300 px-2 py-1 text-left">Product / Item Name</th> : null}
              {hasPart ? <th className="border border-slate-300 px-2 py-1 text-left">Part Number</th> : null}
              {hasDescription ? <th className="border border-slate-300 px-2 py-1 text-left">Description</th> : null}
              <th className="border border-slate-300 px-2 py-1">Qty</th>
              <th className="border border-slate-300 px-2 py-1 text-right">Unit Price ({unitLabel})</th>
              <th className="border border-slate-300 px-2 py-1 text-right">Amount ({unitLabel})</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns} className="border border-slate-300 px-2 py-3 text-center text-slate-500">
                  No itemized listings mapped to this proforma invoice entry.
                </td>
              </tr>
            ) : (
              invoice.items.map((item, index) => (
                <tr key={item.id ?? index}>
                  <td className="border border-slate-300 px-2 py-1 text-center text-slate-500">{index + 1}</td>
                  {hasName ? <td className="border border-slate-300 px-2 py-1 font-bold">{item.itemName}</td> : null}
                  {hasPart ? <td className="border border-slate-300 px-2 py-1 text-slate-500">{item.partNumber}</td> : null}
                  {hasDescription ? (
                    <td className="border border-slate-300 px-2 py-1 text-slate-500">
                      {item.description.trim() ? item.description : "-"}
                    </td>
                  ) : null}
                  <td className="border border-slate-300 px-2 py-1 text-center">{item.quantity}</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {formatPiAmount(item.unitPrice, currency)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-bold">
                    {formatPiAmount(item.quantity * Number(item.unitPrice), currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td colSpan={wordsSpan} className="border border-slate-300 px-2 py-2 italic text-slate-600">
                <strong>In Words:</strong> {invoice.totalInWords}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-right font-extrabold text-blue-900">
                Grand Total:
              </td>
              <td className="border border-slate-300 px-2 py-2 text-right font-extrabold text-blue-900">
                {formatPiAmount(invoice.totalAmount, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
        <div className="border-l-[3px] border-[#3498db] bg-slate-50 px-3 py-3 text-sm">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide">Terms & Conditions</div>
          <div className="whitespace-pre-line text-slate-600">
            {invoice.termsConditions.trim() || FALLBACK_TERMS}
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <div className="relative w-56 text-center">
            {invoice.signatureUrl ? (
              <AuthenticatedImage
                src={invoice.signatureUrl}
                alt="Sign Stamp"
                className="absolute bottom-10 right-2 max-h-16"
              />
            ) : null}
            <div className="mt-12 border-t border-dashed border-slate-400 pt-1">
              <div className="font-bold">{invoice.creatorName}</div>
              <div className="text-slate-500">Authorized Representative</div>
            </div>
          </div>
        </div>
        <footer className="absolute inset-x-0 bottom-0">
          <p className="px-4 py-2 text-center text-xs text-slate-600">
            Address: {address || "Corporate Office Complex, Building A"}
            {company?.phone ? ` | Tel: ${company.phone}` : ""}
            {company?.email ? `, Email: ${company.email}` : ""}
            {company?.website ? `, Web: ${company.website}` : ""}
          </p>
          <div className="flex h-3.5">
            <div className="h-full w-[28%] bg-[#3498db]" />
            <div className="h-full w-[72%] bg-[#5cb85c]" />
          </div>
        </footer>
      </article>
    </div>
  );
}

function AddressBox({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded border border-slate-300 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-bold uppercase text-slate-500">{label}</div>
      <div className="font-bold">{lines[0] || "N/A"}</div>
      {lines.slice(1).join("\n").trim() ? (
        <div className="whitespace-pre-line text-xs text-slate-600">{lines.slice(1).join("\n")}</div>
      ) : null}
    </div>
  );
}
