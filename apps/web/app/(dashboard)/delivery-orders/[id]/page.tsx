"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCurrentCompany } from "@/lib/company";
import { getDeliveryOrder } from "@/lib/delivery-orders";
import type { Company } from "@/types/company";
import type { DeliveryOrderDetails } from "@/types/delivery-orders";

function formatDoDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ ([A-Za-z]+) /, " $1, ");
}

export default function DeliveryOrderViewPage() {
  const params = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [details, setDetails] = useState<DeliveryOrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentCompany().catch(() => null), getDeliveryOrder(params.id)])
      .then(([current, result]) => {
        if (!active) return;
        setCompany(current);
        setDetails(result);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Delivery order not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (!details && !error) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!details) return <p className="text-sm text-red-700">{error}</p>;

  const order = details.order;
  const totalQty = details.items.reduce((sum, item) => sum + item.quantity, 0);
  const logo = company?.invoiceLogoUrl || company?.logoUrl || null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold">Delivery Order View</h1>
          <Link href="/delivery-orders" className="text-sm font-bold text-slate-500">
            Back
          </Link>
        </div>
        <Button type="button" size="sm" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </Button>
      </div>
      {[0, 1].map((copy) => (
        <article
          key={copy}
          className={`mx-auto mb-5 max-w-3xl rounded-md bg-white px-8 py-5 shadow-sm print:mb-4 print:shadow-none ${copy === 1 ? "hidden print:block" : ""}`}
        >
          <p className="mb-1 text-right text-[7px] text-slate-400">
            {copy === 0 ? "ORIGINAL: OFFICE COPY" : "DUPLICATE: RECEIVER'S COPY"}
          </p>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              {logo ? (
                <AuthenticatedImage src={logo} alt="" className="max-h-14 max-w-[280px] object-contain" />
              ) : (
                <p className="text-lg font-bold">{company?.legalName || company?.name || "Company"}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[9px] font-extrabold text-slate-500">DELIVERY ORDER</p>
              <p className="text-lg font-bold">{order.deliveryNumber}</p>
              <p className="text-[11px] text-slate-500">Date: {formatDoDate(order.deliveryDate)}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 text-sm">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Ship To:</p>
              <p className="font-bold">{order.customerName}</p>
              <p className="whitespace-pre-line text-[11px]">{order.clientAddress || ""}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Source / Reference:</p>
              <p className="text-xs font-bold">{order.sourceBillNo || "N/A"}</p>
            </div>
          </div>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-600">
              <tr>
                <th className="w-[6%] border px-2 py-1">#</th>
                <th className="border px-2 py-1 text-left">Description & Serial Number</th>
                <th className="w-[12%] border px-2 py-1">Qty</th>
              </tr>
            </thead>
            <tbody>
              {details.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border px-2 py-1 text-center text-slate-400">{index + 1}</td>
                  <td className="border px-2 py-1">
                    {item.assetId ? (
                      <span>
                        <strong>{item.itemName}</strong>
                        {item.modelNumber ? ` — ${item.modelNumber}` : ""}
                        {item.serialNumber ? ` [S/N: ${item.serialNumber}]` : ""}
                      </span>
                    ) : (
                      <span>
                        <span className="font-bold text-blue-700">[SERVICE]</span> {item.serviceName || item.itemName}
                      </span>
                    )}
                    {item.returned ? (
                      <p className="mt-1 text-[10px] font-bold text-red-600">Returned to Stock</p>
                    ) : null}
                  </td>
                  <td className="border px-2 py-1 text-center">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="border px-2 py-1 text-right font-bold">Total Quantity:</td>
                <td className="border px-2 py-1 text-center font-bold text-blue-700">{totalQty}</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-10 grid grid-cols-2 text-center text-[11px]">
            <div>
              <div className="mx-auto w-44 border-t border-black pt-1">
                <p className="font-bold">{order.creatorName || "Authorized Signatory"}</p>
                <p className="text-[8px] uppercase text-slate-500">Authorized Signatory</p>
              </div>
            </div>
            <div>
              <div className="mx-auto w-44 border-t border-black pt-1">
                <p className="text-[8px] uppercase text-slate-500">Receiver's Signature / Stamp</p>
              </div>
            </div>
          </div>
          <p className="mt-4 border-t border-dashed pt-2 text-center text-[9px] italic text-slate-400">
            This is a computer-generated document. No physical signature is required.
          </p>
        </article>
      ))}
    </div>
  );
}
