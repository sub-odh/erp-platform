"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, Spinner } from "@/components/ui";
import { AuthenticatedImage } from "@/components/media";
import { ApiError } from "@/lib/api";
import { getCurrentCompany } from "@/lib/company";
import { getInvoice } from "@/lib/invoices";
import type { Company } from "@/types/company";
import type { InvoiceDetails } from "@/types/invoices";

const money = (value: string | number) =>
  Number(value).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function InvoiceViewPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceResult, companyResult] = await Promise.all([
        getInvoice(params.id),
        getCurrentCompany().catch(() => null),
      ]);
      setInvoice(invoiceResult);
      setCompany(companyResult);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Unable to load invoice.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className="text-sm font-semibold text-slate-500">
          Back to invoices
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error ?? "Invoice not found."}
        </div>
      </div>
    );
  }

  const logo = company?.invoiceLogoUrl ?? company?.logoUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Invoice View</h1>
        </div>
        <Button onClick={() => window.print()}>
          <Printer size={16} /> Print Invoice
        </Button>
      </div>

      <article className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm print:shadow-none">
        <p className="mb-2 text-right text-[10px] uppercase tracking-wide text-slate-400">
          Original: Customer copy
        </p>
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            {logo ? (
              <AuthenticatedImage
                src={logo}
                alt={company?.name ?? "Company"}
                className="mb-2 h-12 object-contain"
              />
            ) : (
              <p className="text-lg font-bold">{company?.name ?? "Company"}</p>
            )}
            <p className="whitespace-pre-line text-xs text-slate-600">
              {[company?.addressLine1, company?.addressLine2, company?.city]
                .filter(Boolean)
                .join("\n")}
            </p>
            {company?.taxNumber ? (
              <p className="text-xs font-semibold">VAT/PAN: {company.taxNumber}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">
              Tax Invoice
            </p>
            <p className="text-lg font-bold">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">
              Date: {formatDate(invoice.invoiceDate)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
              Bill To
            </p>
            <p className="font-bold">{invoice.customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
              DO Ref
            </p>
            <p className="font-semibold">{invoice.deliveryNumber}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <th className="border border-slate-200 px-2 py-2">#</th>
              <th className="border border-slate-200 px-2 py-2 text-left">
                Description
              </th>
              <th className="border border-slate-200 px-2 py-2">Qty</th>
              <th className="border border-slate-200 px-2 py-2 text-right">
                Total (Rs.)
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-slate-200 px-2 py-2 text-center text-slate-500">
                  {index + 1}
                </td>
                <td className="border border-slate-200 px-2 py-2">
                  <strong>{item.itemName}</strong>
                  {item.serialNumber ? ` [S/N: ${item.serialNumber}]` : ""}
                </td>
                <td className="border border-slate-200 px-2 py-2 text-center">
                  {item.quantity}
                </td>
                <td className="border border-slate-200 px-2 py-2 text-right">
                  {money(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-64 text-sm">
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <span>{money(invoice.subtotalAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>VAT (13%)</span>
            <span>{money(invoice.vatAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 py-2 font-bold">
            <span>Grand Total</span>
            <span>Rs. {money(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-500">
            <span>Paid</span>
            <span>{money(invoice.paidAmount)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
