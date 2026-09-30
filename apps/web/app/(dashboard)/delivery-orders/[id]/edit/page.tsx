"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, Input, Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import {
  getDeliveryLookups,
  getDeliveryOrder,
  updateDeliveryOrder,
} from "@/lib/delivery-orders";
import type { DeliveryLookups, DeliveryOrderDetails } from "@/types/delivery-orders";

export default function EditDeliveryOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [details, setDetails] = useState<DeliveryOrderDetails | null>(null);
  const [lookups, setLookups] = useState<DeliveryLookups>({ salespeople: [], leads: [] });
  const [rows, setRows] = useState<DeliveryOrderDetails["items"]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [sourceBill, setSourceBill] = useState("");
  const [soldById, setSoldById] = useState("");
  const [leadId, setLeadId] = useState("");
  const [discountValue, setDiscountValue] = useState("0");
  const [discountMode, setDiscountMode] = useState<"percent" | "fixed">("percent");
  const [taxable, setTaxable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getDeliveryOrder(params.id), getDeliveryLookups()])
      .then(([order, options]) => {
        if (!active) return;
        setDetails(order);
        setLookups(options);
        setRows(order.items);
        setDeliveryDate(order.order.deliveryDate);
        setSourceBill(order.order.sourceBillNo ?? "");
        setSoldById(order.order.soldById ?? "");
        setLeadId(order.order.leadId ?? "");
        setDiscountValue(String(order.order.discountValue ?? 0));
        setDiscountMode(order.order.discountType === "fixed" ? "fixed" : "percent");
        setTaxable(order.order.isTaxable !== 0);
        setPrices(Object.fromEntries(order.items.map((item) => [item.id, String(item.unitPrice)])));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Delivery order not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, item) => {
      const price = Number(prices[item.id] ?? item.unitPrice) || 0;
      return sum + price * item.quantity;
    }, 0);
    const raw = Math.max(0, Number(discountValue) || 0);
    const discount = discountMode === "percent" ? (subtotal * raw) / 100 : raw;
    const after = Math.max(0, subtotal - discount);
    const vat = taxable ? after * 0.13 : 0;
    return { subtotal, discount, vat, total: after + vat };
  }, [discountMode, discountValue, prices, rows, taxable]);

  async function save() {
    if (!details) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateDeliveryOrder(params.id, {
        deliveryDate,
        sourceBillNo: sourceBill.trim() || undefined,
        soldById: soldById || undefined,
        leadId: leadId || undefined,
        discountValue: Math.max(0, Number(discountValue) || 0),
        discountType: discountMode,
        taxable,
        items: rows.map((item) => ({
          id: item.id,
          unitPrice: Number(prices[item.id] ?? item.unitPrice) || 0,
        })),
      });
      router.push(`/invoices/${result.invoiceId}`);
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Unable to update this delivery order.");
      setSaving(false);
    }
  }

  if (!details && !error) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!details) return <p className="text-sm text-red-700">{error}</p>;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Generate Invoice: {details.order.deliveryNumber}
          </h1>
          <p className="text-sm text-slate-500">Client: {details.order.customerName || "N/A"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/delivery-orders" className="rounded-full border px-3 py-1.5 text-sm">
            Cancel
          </Link>
          <Button type="submit" size="sm" loading={saving}>
            Confirm & Generate Invoice
          </Button>
        </div>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <section className="rounded-lg bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Input label="Source Bill No." value={sourceBill} placeholder="Enter source bill number" onChange={(event) => setSourceBill(event.target.value)} />
          <Input type="date" label="Delivery Date" required value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
          <Select label="Assigned Salesperson" value={soldById} onChange={(event) => setSoldById(event.target.value)}>
            <option value="">Select Salesperson</option>
            {lookups.salespeople.map((person) => (
              <option key={person.id} value={person.id}>
                {`${person.firstName} ${person.lastName}`.trim() || `Employee`}
              </option>
            ))}
          </Select>
          <Select label="Sales Lead (Optional)" value={leadId} onChange={(event) => setLeadId(event.target.value)}>
            <option value="">Standalone (None)</option>
            {lookups.leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                {lead.jobTitle ? ` (${lead.jobTitle})` : ""}
              </option>
            ))}
          </Select>
        </div>
      </section>
      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2">#</th>
              <th className="px-3 py-2">Item Details</th>
              <th className="w-20 px-3 py-2 text-center">Qty</th>
              <th className="w-40 px-3 py-2 text-right">Unit Price (Rs.)</th>
              <th className="w-12 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                <td className="px-3 py-2">
                  {item.assetId ? (
                    <>
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-[11px] text-slate-400">SN: {item.serialNumber || "N/A"}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold text-blue-700">[SERVICE]</div>
                      <div>{item.serviceName || item.itemName}</div>
                    </>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="rounded border bg-slate-50 px-2 py-0.5">{item.quantity}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={prices[item.id] ?? ""}
                    onChange={(event) =>
                      setPrices((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    className="w-32 rounded border p-1 text-right font-bold text-blue-700"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    aria-label="Remove line"
                    className="text-red-600"
                    onClick={() => setRows((current) => current.filter((row) => row.id !== item.id))}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid gap-4 border-t bg-slate-50 p-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold text-slate-500">DISCOUNT SETTINGS</p>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                className="w-28 rounded border p-1"
              />
              <Select
                aria-label="Discount type"
                value={discountMode}
                onChange={(event) => setDiscountMode(event.target.value as "percent" | "fixed")}
                wrapperClassName="w-20"
                className="h-8 py-1 text-sm"
              >
                <option value="percent">%</option>
                <option value="fixed">Rs.</option>
              </Select>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={taxable} onChange={(event) => setTaxable(event.target.checked)} />
                VAT (13%)
              </label>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500"><span>Sub Total</span><b className="text-slate-900">{formatCurrency(totals.subtotal)}</b></div>
            <div className="flex justify-between text-slate-500"><span>Discount</span><b className="text-red-600">{formatCurrency(totals.discount)}</b></div>
            <div className="flex justify-between text-slate-500"><span>VAT (13%)</span><b className="text-slate-900">{formatCurrency(totals.vat)}</b></div>
            <div className="flex justify-between border-t pt-2"><b>Grand Total</b><b className="text-lg text-blue-700">{formatCurrency(totals.total)}</b></div>
          </div>
        </div>
      </section>
    </form>
  );
}
