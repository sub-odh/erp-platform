"use client";

import { ArrowLeft, Mail, Printer, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { Button, Spinner } from "@/components/ui";
import { AuthenticatedImage } from "@/components/media";
import { getCurrentCompany } from "@/lib/company";
import { formatRupees } from "@/lib/inventory-format";
import {
  getPurchaseOrder,
  sendPurchaseOrderEmail,
} from "@/lib/purchase-orders";
import type { Company } from "@/types/company";
import type { PurchaseOrderDetails } from "@/types/purchase-orders";

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [order, setOrder] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(() => {
    if (searchParams.get("email") === "sent") {
      return "Purchase order was saved and emailed to the vendor.";
    }
    if (searchParams.get("email") === "failed") {
      return "Purchase order was saved, but email delivery failed. Check SMTP and try again from this page.";
    }
    return null;
  });

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const [companyResult, orderResult] = await Promise.all([
        getCurrentCompany(),
        getPurchaseOrder(params.id),
      ]);
      setCompany(companyResult);
      setOrder(orderResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load purchase order.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => void load(), [load]);

  async function sendEmail() {
    if (!order) return;
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendPurchaseOrderEmail(order.id);
      setMessage(result.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send purchase order email.",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading && !order) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-5">
        <Link href="/purchase-orders">
          <Button variant="outline">
            <ArrowLeft size={17} /> Purchase Orders
          </Button>
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ?? "Purchase order not found."}
        </div>
      </div>
    );
  }

  const logoUrl = company?.invoiceLogoUrl ?? company?.logoUrl;
  const address = [company?.addressLine1, company?.city, company?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-5">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          #purchase-order-detail,
          #purchase-order-detail * {
            visibility: visible;
          }
          #purchase-order-detail {
            position: absolute;
            inset: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 17mm 20mm;
            box-sizing: border-box;
            background: #fff;
            color: #0f172a;
            box-shadow: none;
            border: 0;
          }
          #purchase-order-detail thead {
            display: table-header-group;
          }
          #purchase-order-detail tr,
          #purchase-order-detail img,
          #purchase-order-detail .po-signature {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Purchase Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Purchase Order {order.poNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review, print, or email this finalized purchase order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void load()}
            loading={loading}
          >
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save as PDF
          </Button>
          <Button onClick={() => void sendEmail()} loading={sending}>
            <Mail size={16} /> Send via Email
          </Button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <article
        id="purchase-order-detail"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)] sm:p-10"
      >
        <header className="border-b border-slate-300 pb-5">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[56%]">
              {logoUrl ? (
                <AuthenticatedImage
                  src={logoUrl}
                  alt={`${company?.name ?? "Company"} logo`}
                  className="max-h-24 max-w-[70mm] h-auto w-auto object-contain object-left"
                />
              ) : null}
              <h2 className="mt-2 text-xl font-bold">
                {company?.legalName ?? company?.name ?? "Your Company"}
              </h2>
              <div className="mt-1 text-[11px] leading-4 text-slate-600">
                {address}
                {company?.phone ? (
                  <>
                    <br />
                    Contact: {company.phone}
                  </>
                ) : null}
                {company?.email ? (
                  <>
                    <br />
                    Email: {company.email}
                  </>
                ) : null}
                {company?.taxNumber ? (
                  <>
                    <br />
                    <strong>VAT / PAN No.:</strong> {company.taxNumber}
                  </>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold tracking-wide text-blue-600">
                Purchase Order
              </h2>
              <p className="mt-5 text-sm font-bold">PO Date: {order.poDate}</p>
              <p className="mt-3 text-xl font-bold">{order.poNumber}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 py-6 text-xs">
          <div>
            <p className="font-bold">Vendor / Supplier Company</p>
            <p className="mt-1 font-semibold">{order.vendorName}</p>
            {order.vendorAddress ? (
              <p className="mt-1 text-slate-500">{order.vendorAddress}</p>
            ) : null}
          </div>
          <div className="border-l border-slate-300 pl-6">
            <p className="font-bold">
              To (Attention Person / Vendor Representative)
            </p>
            <p className="mt-1 font-semibold">
              {order.attentionContact ?? "—"}
            </p>
            {order.vendorEmail ? (
              <p className="mt-1 text-slate-500">{order.vendorEmail}</p>
            ) : null}
          </div>
        </section>

        <h3 className="mb-3 text-lg font-bold">
          Line Item Cost Specification Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 p-2 text-left">
                  Item / Product Name
                </th>
                <th className="border border-slate-300 p-2 text-left">
                  Description / Specification
                </th>
                <th className="border border-slate-300 p-2 text-right">
                  Units / Quantity
                </th>
                <th className="border border-slate-300 p-2 text-right">
                  Unit Price (Excl. VAT)
                </th>
                <th className="border border-slate-300 p-2 text-right">
                  Sub Total (Rs.)
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 p-2 font-semibold">
                    {item.productName}
                  </td>
                  <td className="border border-slate-300 p-2 text-slate-600">
                    {item.description ?? "—"}
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {item.quantity} {item.unitSymbol}
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {formatRupees(item.unitPrice)}
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-bold">
                    {formatRupees(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right text-sm font-bold">
          Grand Total (Excl. VAT):{" "}
          <span className="ml-7 text-lg text-blue-600">
            {formatRupees(order.totalAmount)}
          </span>
        </div>

        <section className="mt-7 text-xs leading-5">
          <h4 className="font-bold">Terms & Conditions</h4>
          <ol className="mt-1 list-decimal pl-4">
            <li>
              Goods must be delivered within 7 business days from PO
              authorization.
            </li>
            <li>
              Payment terms:{" "}
              {order.paymentTerms ??
                "Net 30 days upon receiving verified item invoice."}
            </li>
            <li>
              Defective entries must be replaced immediately at vendor expense.
            </li>
          </ol>
        </section>
        <footer className="po-signature ml-auto mt-24 w-48 border-t border-slate-700 pt-2 text-center text-xs">
          <strong>Authorized Officer</strong>
          <br />
          <span className="text-[10px] text-slate-600">
            Operations Department
            <br />
            Authorized Signatory
          </span>
        </footer>
      </article>
    </div>
  );
}
