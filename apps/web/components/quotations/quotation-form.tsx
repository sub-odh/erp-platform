"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, CurrencySwitch, CurrencyTag, Input, Select, Textarea } from "@/components/ui";
import { formatPiAmount } from "@/lib/pi-format";
import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";
import type { QuotationCurrency, QuotationLineInput } from "@/types/quotations";

export interface QuotationFormValues {
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  leadId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  currency: QuotationCurrency;
  vatApplicable: boolean;
  termsConditions: string;
  items: QuotationLineInput[];
}

const CUSTOM = "CUSTOM";

export function QuotationForm({
  title,
  values,
  customers,
  leads,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
  termsAlreadyEdited = false,
}: {
  title: string;
  values: QuotationFormValues;
  customers: Customer[];
  leads: Lead[];
  saving: boolean;
  error: string | null;
  onChange: (next: QuotationFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  termsAlreadyEdited?: boolean;
}) {
  const [termsTouched, setTermsTouched] = useState(termsAlreadyEdited);
  const walkIn = values.customerId === CUSTOM;
  const currency = values.currency;
  const vatOn = currency === "NPR" && values.vatApplicable;
  const subtotal = values.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const vat = vatOn ? Math.round(subtotal * 0.13 * 100) / 100 : 0;
  const total = subtotal + vat;
  const unitLabel = currency === "USD" ? "USD" : "Rs.";

  const customerOptions = useMemo(
    () => [
      { value: "", label: "Select Client" },
      { value: CUSTOM, label: "+ Add Unlisted Walk-In Client" },
      ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
    ],
    [customers],
  );

  function patch(partial: Partial<QuotationFormValues>) {
    const next = { ...values, ...partial };
    if (!termsTouched && partial.expiryDate) {
      next.termsConditions = defaultTerms(partial.expiryDate);
    }
    onChange(next);
  }

  function setItem(index: number, partial: Partial<QuotationLineInput>) {
    const items = values.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...partial } : item,
    );
    onChange({ ...values, items });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Return to Ledger
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Discard Draft
          </Button>
          <Button type="submit" loading={saving}>
            Commit & Emit Quotation
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <Input label="Tracking ID" value={values.quotationNumber} readOnly />
          <Select
            label="Mapped Lead"
            value={values.leadId}
            onChange={(event) => patch({ leadId: event.target.value })}
          >
            <option value="">-- None (Standalone Quotation) --</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {(lead.companyName || "Lead")}
                {lead.jobTitle ? ` (${lead.jobTitle})` : ""}
              </option>
            ))}
          </Select>
          <Select
            label="Client"
            value={walkIn ? CUSTOM : values.customerId}
            onChange={(event) => {
              const value = event.target.value;
              if (value === CUSTOM) {
                patch({ customerId: CUSTOM, customerName: "", customerAddress: "" });
                return;
              }
              const customer = customers.find((row) => row.id === value);
              patch({
                customerId: value,
                customerName: customer?.name ?? "",
                customerAddress: customer?.address ?? "",
              });
            }}
          >
            {customerOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {walkIn ? (
            <Input
              label="Walk-In Client Name"
              value={values.customerName}
              onChange={(event) => patch({ customerName: event.target.value })}
              required
            />
          ) : null}
          <Textarea
            label="Client Address"
            value={values.customerAddress}
            onChange={(event) => patch({ customerAddress: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Issue Date"
              type="date"
              value={values.quotationDate}
              onChange={(event) => patch({ quotationDate: event.target.value })}
              required
            />
            <Input
              label="Expiry Date"
              type="date"
              value={values.expiryDate}
              onChange={(event) => patch({ expiryDate: event.target.value })}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={vatOn}
              disabled={currency === "USD"}
              onChange={(event) => patch({ vatApplicable: event.target.checked })}
            />
            Apply 13% VAT Assessment
          </label>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <h2 className="text-sm font-bold text-slate-900">Line Items</h2>
            <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                onChange({
                  ...values,
                  items: [
                    ...values.items,
                    { itemName: "", description: "", quantity: 1, unitPrice: 0 },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              Add Item Line
            </Button>
            <CurrencySwitch
              className="shrink-0"
              value={currency}
              onChange={(code) =>
                patch({
                  currency: code,
                  vatApplicable: code === "USD" ? false : values.vatApplicable,
                })
              }
            />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Rate (<CurrencyTag>{unitLabel}</CurrencyTag>)</th>
                  <th className="pb-2">Subtotal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {values.items.map((item, index) => {
                  const line = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  return (
                    <tr key={index} className="align-top">
                      <td className="py-1 pr-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          value={item.itemName}
                          onChange={(event) => setItem(index, { itemName: event.target.value })}
                          required
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          value={item.description ?? ""}
                          onChange={(event) => setItem(index, { description: event.target.value })}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="number"
                          min={1}
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                          value={item.quantity}
                          onChange={(event) =>
                            setItem(index, { quantity: Number(event.target.value) })
                          }
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-28 rounded border border-slate-300 px-2 py-1"
                          value={item.unitPrice}
                          onChange={(event) =>
                            setItem(index, { unitPrice: Number(event.target.value) })
                          }
                        />
                      </td>
                      <td className="py-1 pr-2 whitespace-nowrap">
                        {formatPiAmount(line, currency)}
                      </td>
                      <td className="py-1">
                        <button
                          type="button"
                          className="text-slate-500 disabled:opacity-30"
                          disabled={values.items.length === 1}
                          onClick={() =>
                            onChange({
                              ...values,
                              items: values.items.filter((_, itemIndex) => itemIndex !== index),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-right text-sm">
            <p>Subtotal: {formatPiAmount(subtotal, currency)}</p>
            <p>VAT: {formatPiAmount(vat, currency)}</p>
            <p className="font-semibold">
              Gross Amount {vatOn ? "(Inc. 13% VAT)" : ""}: {formatPiAmount(total, currency)}
            </p>
          </div>
        </section>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <Textarea
          label="Terms & Conditions"
          value={values.termsConditions}
          onChange={(event) => {
            setTermsTouched(true);
            onChange({ ...values, termsConditions: event.target.value });
          }}
        />
      </section>
    </form>
  );
}

function defaultTerms(expiry: string): string {
  return `• Delivery: 4-5 weeks from PO date\n• 100% Advance Payment.\n• Quotation Validity: ${expiry}`;
}
