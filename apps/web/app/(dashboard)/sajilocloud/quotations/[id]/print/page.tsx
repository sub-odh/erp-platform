"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCloudQuotation } from "@/lib/cloud-quotations";
import { formatPiAmount } from "@/lib/pi-format";
import type { CloudQuotationDetails } from "@/types/cloud-quotations";

export default function CloudQuotationPrintPage() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<CloudQuotationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCloudQuotation(params.id)
      .then((details) => {
        if (active) setQuote(details);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Quotation record not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (error) return <p className="p-6 text-sm text-rose-700">{error}</p>;
  if (!quote) return <p className="p-6 text-sm text-slate-500">Loading quotation...</p>;

  const itemsSum = quote.items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0,
  );
  const discount = Number(quote.discountAmount);
  const vatOn = quote.currency === "NPR" && quote.vatApplicable === 1;

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <div className="bg-slate-950 py-2 text-center print:hidden">
        <Button variant="success" size="sm" onClick={() => window.print()}>
          Print Quotation Document
        </Button>
      </div>
      <div className="flex justify-center py-5 print:block print:py-0">
        <article className="relative h-[297mm] w-[210mm] overflow-hidden bg-white px-[45px] pb-[120px] pt-[130px] shadow-lg print:shadow-none">
          <div className="absolute right-0 top-0 z-[1] h-[120px] w-[320px] rounded-bl-full bg-gradient-to-br from-cyan-400 to-blue-600" />
          <img
            src="/sajilocloud/sajilcloud-logo-small.png"
            alt="SajiloCloud"
            className="absolute left-[45px] top-[35px] z-[3] h-[45px] w-auto"
          />
          <img
            src="/sajilocloud/sajilocloud-white.png"
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 z-[1] w-[500px] max-w-[80%] -translate-x-1/2 -translate-y-1/2 opacity-15"
          />
          <div className="relative z-[3]">
            <div className="mb-4 grid grid-cols-[1.4fr_1fr] gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Customer Profile:</p>
                <h2 className="text-lg font-bold">{quote.customerName}</h2>
                <p className="whitespace-pre-line text-sm text-slate-500">{quote.customerAddress}</p>
              </div>
              <div className="text-right text-sm">
                <p><strong>Quotation Ref:</strong> {quote.quotationNumber}</p>
                <p><strong>Date:</strong> {quote.quotationDate}</p>
                <p><strong>Valid Until:</strong> {quote.expiryDate || "N/A"}</p>
              </div>
            </div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 uppercase">
                  <th className="border border-slate-300 px-2 py-2 text-left">#</th>
                  <th className="border border-slate-300 px-2 py-2 text-left">Service Domain</th>
                  <th className="border border-slate-300 px-2 py-2 text-left">Description & Specifications</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Qty</th>
                  <th className="border border-slate-300 px-2 py-2 text-right">Rate</th>
                  <th className="border border-slate-300 px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td className="border border-slate-300 px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-slate-300 px-2 py-2">
                      <strong>{item.serviceType}</strong>
                      <br />
                      <span>{item.itemName}</span>
                    </td>
                    <td className="border border-slate-300 px-2 py-2 whitespace-pre-line">{item.description}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{item.quantity}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">
                      {formatPiAmount(item.unitPrice, quote.currency)}
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-right font-bold">
                      {formatPiAmount(item.quantity * Number(item.unitPrice), quote.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right font-bold">Subtotal:</td>
                  <td className="border border-slate-300 px-2 py-2 text-right font-bold">
                    {formatPiAmount(itemsSum, quote.currency)}
                  </td>
                </tr>
                {discount > 0.001 ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right font-bold text-blue-700">Discount:</td>
                    <td className="border border-slate-300 px-2 py-2 text-right font-bold text-blue-700">
                      - {formatPiAmount(discount, quote.currency)}
                    </td>
                  </tr>
                ) : null}
                {vatOn ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right text-slate-500">VAT (13%):</td>
                    <td className="border border-slate-300 px-2 py-2 text-right text-slate-500">
                      {formatPiAmount(quote.vatAmount, quote.currency)}
                    </td>
                  </tr>
                ) : null}
                <tr className="bg-slate-50">
                  <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right text-sm font-bold">
                    Grand Total:
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-right text-sm font-bold text-blue-700">
                    {formatPiAmount(quote.totalAmount, quote.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3">
              <h3 className="mb-1 text-xs font-bold uppercase">Service SLA & Commercial Terms</h3>
              <p className="whitespace-pre-line font-mono text-xs text-slate-500">{quote.termsConditions}</p>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 z-[1] h-[110px] w-full bg-gradient-to-br from-blue-600 to-cyan-400"
            style={{ clipPath: "ellipse(85% 100% at 30% 100%)" }}
          />
          <div className="absolute bottom-5 left-[45px] z-[3] text-[11px] leading-relaxed text-white">
            <strong>Address:</strong> Shantinagar, Kathmandu, Nepal
            <br />
            <strong>Email:</strong> info@sajilocloud.com.np | <strong>Website:</strong> sajilocloud.com.np
          </div>
        </article>
      </div>
    </div>
  );
}
