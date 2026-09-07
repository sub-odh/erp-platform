"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button, Select } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCustomers } from "@/lib/customers";
import { createQuotation, getNextQuotationNumber } from "@/lib/quotations";
import type { Customer } from "@/types/customer";

type QuotationLine = {
  id: number;
  item: string;
  scope: string;
  quantity: number;
  rate: number;
};
const initialLine: QuotationLine = {
  id: 1,
  item: "",
  scope: "",
  quantity: 1,
  rate: 0,
};
const initialTerms =
  "Delivery: 4–5 weeks from PO date\n100% advance payment\nQuotation validity: 30 days";
const dateInputValue = (date: Date) => date.toISOString().slice(0, 10);

export default function CreateQuotationPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [issueDate, setIssueDate] = useState(dateInputValue(today));
  const [expiryDate, setExpiryDate] = useState(() => {
    const expiry = new Date(today);
    expiry.setDate(expiry.getDate() + 30);
    return dateInputValue(expiry);
  });
  const [quotationNumber, setQuotationNumber] = useState("Loading…");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [address, setAddress] = useState("");
  const [lines, setLines] = useState<QuotationLine[]>([initialLine]);
  const [terms, setTerms] = useState(initialTerms);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      getCustomers({ isActive: true, limit: 100 }),
      getNextQuotationNumber(issueDate),
    ])
      .then(([customerResult, next]) => {
        setCustomers(customerResult.data);
        setQuotationNumber(next.quotationNumber);
      })
      .catch((cause) =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Unable to prepare the quotation form.",
        ),
      );
  }, [issueDate]);

  const subtotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.rate,
    0,
  );
  const vat = subtotal * 0.13;
  const grandTotal = subtotal + vat;
  const updateLine = <K extends keyof QuotationLine>(
    id: number,
    field: K,
    value: QuotationLine[K],
  ) =>
    setLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    );

  async function save() {
    setError(null);
    if (!customerId) {
      setError("Choose a customer before saving the quotation.");
      return;
    }
    if (
      lines.some(
        (line) => !line.item.trim() || line.quantity < 1 || line.rate < 0,
      )
    ) {
      setError("Complete each item with a name, quantity, and rate.");
      return;
    }
    setSaving(true);
    try {
      await createQuotation({
        customerId,
        issueDate,
        expiryDate,
        destinationAddress: address || undefined,
        terms,
        items: lines.map((line) => ({
          itemName: line.item,
          description: line.scope || undefined,
          quantity: line.quantity,
          unitPrice: line.rate,
        })),
      });
      router.push("/quotations");
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Unable to save quotation.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Generate Customer Quotation
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Construct a commercial product or service quotation with automated
            local VAT math.
          </p>
        </div>
        <Link
          href="/quotations"
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Return to Ledger
        </Link>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.68fr)]">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-900">
            Document Control Parameters
          </h2>
          <div className="space-y-4">
            <Field label="Quotation Tracker ID">
              <input
                value={quotationNumber}
                readOnly
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 font-medium text-emerald-700"
              />
            </Field>
            <Field label="Date of Proposal Issue">
              <input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>
            <Field label="Proposal Expiration Boundary">
              <input
                type="date"
                value={expiryDate}
                min={issueDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="h-10 w-full rounded-md border border-rose-200 px-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </Field>
            <Select
              label="Client / Customer Profile"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="h-10 py-2"
            >
              <option value="">Select a Customer…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customerCode})
                </option>
              ))}
            </Select>
            <Field label="Destination Address">
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={4}
                placeholder="Physical distribution/billing metadata mapping info..."
                className="w-full resize-y rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>
          </div>
        </section>
        <div className="space-y-5">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">
                Itemized Cost Evaluation Breakdown
              </h2>
              <Button
                variant="success"
                size="sm"
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    { ...initialLine, id: Date.now() },
                  ])
                }
              >
                <Plus size={15} />
                Add Item Line
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="border-y border-slate-200 text-left text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-2 py-3">
                      Product / Service Resource Element
                    </th>
                    <th className="px-2 py-3">
                      Scope Specification Description
                    </th>
                    <th className="w-24 px-2 py-3 text-right">Qty</th>
                    <th className="w-32 px-2 py-3 text-right">Rate (Rs.)</th>
                    <th className="w-32 px-2 py-3 text-right">Subtotal</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-b border-slate-100">
                      <td className="p-2">
                        <input
                          value={line.item}
                          onChange={(event) =>
                            updateLine(line.id, "item", event.target.value)
                          }
                          placeholder="Resource tracking item name"
                          className="h-9 w-full rounded border border-slate-200 px-2 outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          value={line.scope}
                          onChange={(event) =>
                            updateLine(line.id, "scope", event.target.value)
                          }
                          placeholder="Optional context specs details"
                          className="h-9 w-full rounded border border-slate-200 px-2 outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(
                              line.id,
                              "quantity",
                              Number(event.target.value) || 0,
                            )
                          }
                          className="h-9 w-full rounded border border-slate-200 px-2 text-right outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.rate}
                          onChange={(event) =>
                            updateLine(
                              line.id,
                              "rate",
                              Number(event.target.value) || 0,
                            )
                          }
                          className="h-9 w-full rounded border border-slate-200 px-2 text-right outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-2 text-right font-semibold text-slate-900">
                        Rs. {(line.quantity * line.rate).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setLines((current) =>
                              current.length === 1
                                ? current
                                : current.filter(
                                    (candidate) => candidate.id !== line.id,
                                  ),
                            )
                          }
                          aria-label="Remove item line"
                          className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto mt-4 grid max-w-sm grid-cols-2 gap-y-2 text-sm">
              <dt className="font-medium text-slate-500">Items Subtotal</dt>
              <dd className="text-right font-semibold">
                Rs. {subtotal.toFixed(2)}
              </dd>
              <dt className="font-medium text-rose-600">
                VAT Assessment (13%)
              </dt>
              <dd className="text-right font-semibold text-rose-600">
                Rs. {vat.toFixed(2)}
              </dd>
              <dt className="border-t border-slate-200 pt-3 font-bold text-slate-700">
                Grand Total (Inc. VAT)
              </dt>
              <dd className="border-t border-slate-200 pt-3 text-right text-xl font-bold text-emerald-600">
                Rs. {grandTotal.toFixed(2)}
              </dd>
            </dl>
          </section>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Commercial Terms &amp; Conditions
            </h2>
            <textarea
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setLines([initialLine]);
                  setTerms(initialTerms);
                  setAddress("");
                  setCustomerId("");
                }}
              >
                Discard Draft
              </Button>
              <Button
                variant="success"
                loading={saving}
                onClick={() => void save()}
              >
                <Save size={16} />
                Commit &amp; Emit Quotation
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
