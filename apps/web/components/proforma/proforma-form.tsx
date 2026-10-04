"use client";

import { Plus, Printer, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button, CurrencySwitch, CurrencyTag } from "@/components/ui";
import { formatPiAmount } from "@/lib/pi-format";
import type { Company } from "@/types/company";
import {
  DEFAULT_PROFORMA_TERMS,
  type ProformaCurrency,
  type SaveProformaInput,
} from "@/types/proforma-invoices";

interface LineDraft {
  key: string;
  itemName: string;
  partNumber: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface ProformaFormValues {
  piNumber: string;
  piDate: string;
  customerDetails: string;
  billTo: string;
  shipTo: string;
  termsConditions: string;
  currency: ProformaCurrency;
  items: LineDraft[];
  creatorName: string;
  creatorPosition: string;
}

interface ProformaFormProps {
  title?: string;
  company: Company | null;
  values: ProformaFormValues;
  saving?: boolean;
  error?: string | null;
  onSave: (payload: SaveProformaInput) => void;
  onDispatch: () => void;
}

function Field({
  label,
  required = false,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        required={required}
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm font-semibold outline-none focus:border-blue-500"
      />
    </label>
  );
}

function blankLine(): LineDraft {

  return {
    key: crypto.randomUUID(),
    itemName: "",
    partNumber: "",
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

export function emptyProformaLines(): LineDraft[] {
  return [blankLine()];
}

export function ProformaForm({
  title = "Create Proforma Invoice",
  company,
  values,
  saving = false,
  error = null,
  onSave,
  onDispatch,
}: ProformaFormProps) {
  const [piDate, setPiDate] = useState(values.piDate);
  const [customerDetails, setCustomerDetails] = useState(values.customerDetails);
  const [billTo, setBillTo] = useState(values.billTo);
  const [shipTo, setShipTo] = useState(values.shipTo);
  const [terms, setTerms] = useState(values.termsConditions || DEFAULT_PROFORMA_TERMS);
  const [currency, setCurrency] = useState<ProformaCurrency>(values.currency);
  const [lines, setLines] = useState<LineDraft[]>(
    values.items.length ? values.items : emptyProformaLines(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const qty = Number.parseInt(line.quantity, 10) || 0;
      const price = Number.parseFloat(line.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const vat = currency === "NPR" ? subtotal * 0.13 : 0;
    return { subtotal, vat, total: subtotal + vat };
  }, [currency, lines]);

  const logo = company?.invoiceLogoUrl || company?.logoUrl || null;
  const companyName = company?.legalName || company?.name || "Main Corporation Ltd.";
  const address = [
    company?.addressLine1,
    company?.addressLine2,
    company?.city,
    company?.state,
    company?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const unitLabel = currency === "USD" ? "USD" : "Rs.";

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!customerDetails.trim() || !billTo.trim() || !shipTo.trim()) {
      setFormError("Customer details, bill to, and ship to are required.");
      return;
    }
    const items = lines.map((line) => ({
      itemName: line.itemName,
      partNumber: line.partNumber,
      description: line.description,
      quantity: Number.parseInt(line.quantity, 10),
      unitPrice: Number.parseFloat(line.unitPrice),
    }));
    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setFormError("Each row needs a quantity of at least 1.");
      return;
    }
    if (items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      setFormError("Each row needs a unit price.");
      return;
    }
    setFormError(null);
    onSave({
      piNumber: values.piNumber,
      piDate,
      customerDetails,
      billTo,
      shipTo,
      termsConditions: terms,
      currency,
      items,
    });
  }

  return (
    <form onSubmit={submit} className="pi-create-sheet min-w-0 max-w-full">
      <style>{`
        @media print {
          aside, header, .pi-no-print { display: none !important; }
          .pi-create-sheet { position: absolute; left: 0; top: 0; width: 100%; background: white; }
        }
      `}</style>
      <div className="pi-no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={14} /> Print / Save as PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDispatch}>
            <Send size={14} /> Send via Email
          </Button>
          <Link
            href="/proforma-invoices"
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-700"
          >
            View All PIs
          </Link>
        </div>
      </div>
      {error || formError ? (
        <p className="pi-no-print mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError ?? error}
        </p>
      ) : null}
      <div className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex w-full min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="max-w-md">
            {logo ? (
              <AuthenticatedImage src={logo} alt={`${companyName} logo`} className="mb-2 max-h-16 object-contain" />
            ) : null}
            <h2 className="text-lg font-bold text-slate-900">{companyName}</h2>
            <p className="text-xs leading-relaxed text-slate-500">
              {address || "Corporate Office Complex, Building A"}
              <br />
              Contact: {company?.phone || "+977-1-0000000"} | Email:{" "}
              {company?.email || "info@company.com"}
              {company?.taxNumber ? (
                <>
                  <br />
                  <strong>VAT / PAN No:</strong> {company.taxNumber}
                </>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <h2 className="mb-2 text-3xl font-extrabold text-blue-700">Proforma Invoice</h2>
            <div className="inline-block min-w-64 rounded border border-slate-200 bg-slate-50 p-2 text-left">
              <label className="mb-1 flex items-center justify-between gap-3 border-b border-slate-200 pb-1 text-xs font-bold uppercase text-slate-500">
                Date:
                <input
                  type="date"
                  required
                  value={piDate}
                  onChange={(event) => setPiDate(event.target.value)}
                  className="border-0 bg-transparent text-right text-sm font-bold text-slate-900 outline-none"
                />
              </label>
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase text-slate-500">
                PI No:
                <input
                  readOnly
                  value={values.piNumber}
                  className="w-40 border-0 bg-transparent text-right text-base font-bold text-blue-700 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3">
          <Field label="To: Customer Details" required value={customerDetails} onChange={setCustomerDetails} placeholder="Enter customer name, address & contact details..." />
          <Field label="Bill To" required value={billTo} onChange={setBillTo} placeholder="Enter billing address and contact details..." />
          <Field label="Ship To" required value={shipTo} onChange={setShipTo} placeholder="Enter shipping address and delivery contact details..." />
        </div>
        <div className="mb-2 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <h3 className="text-sm font-bold text-slate-900">Line Item Cost Specification Ledger</h3>
          <CurrencySwitch
            className="pi-no-print ml-auto shrink-0"
            value={currency}
            onChange={setCurrency}
          />
        </div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left">Item / Product Name</th>
                <th className="border border-slate-200 px-2 py-2 text-left">Part Number</th>
                <th className="border border-slate-200 px-2 py-2 text-left">Description / Specification</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Quantity</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Unit Price (<CurrencyTag>{unitLabel}</CurrencyTag>)</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Sub Total (<CurrencyTag>{unitLabel}</CurrencyTag>)</th>
                <th className="pi-no-print border border-slate-200 px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const rowTotal =
                  (Number.parseInt(line.quantity, 10) || 0) *
                  (Number.parseFloat(line.unitPrice) || 0);
                return (
                  <tr key={line.key}>
                    <td className="border border-slate-200 p-1">
                      <input value={line.itemName} placeholder="Product identifier (Optional)" onChange={(event) => updateLine(line.key, { itemName: event.target.value })} className="w-full rounded px-2 py-1 font-semibold outline-none" />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input value={line.partNumber} placeholder="P/N or SKU (Optional)" onChange={(event) => updateLine(line.key, { partNumber: event.target.value })} className="w-full rounded px-2 py-1 font-semibold outline-none" />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input value={line.description} placeholder="Size, model variations, specs... (Optional)" onChange={(event) => updateLine(line.key, { description: event.target.value })} className="w-full rounded px-2 py-1 text-slate-600 outline-none" />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input required type="number" min={1} value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: event.target.value })} className="w-full rounded px-2 py-1 text-right outline-none" />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input required type="number" min={0} step="0.01" placeholder="0.00" value={line.unitPrice} onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })} className="w-full rounded px-2 py-1 text-right font-semibold outline-none" />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input readOnly value={rowTotal.toFixed(2)} className="w-full bg-transparent px-2 py-1 text-right font-semibold outline-none" />
                    </td>
                    <td className="pi-no-print border border-slate-200 p-1 text-center">
                      <button
                        type="button"
                        aria-label="Remove row"
                        disabled={lines.length === 1}
                        className="text-red-600 disabled:text-slate-300"
                        onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pi-no-print mt-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setLines((current) => [...current, blankLine()])}>
            <Plus size={14} /> Add Item Row
          </Button>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1 border-t border-slate-200 pt-2 text-sm">
            <div className="flex justify-between font-bold text-slate-600">
              <span>Subtotal:</span>
              <span>{formatPiAmount(totals.subtotal, currency)}</span>
            </div>
            {currency === "NPR" ? (
              <div className="flex justify-between font-bold text-slate-600">
                <span>VAT (13%):</span>
                <span>{formatPiAmount(totals.vat, currency)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded bg-amber-50 px-2 py-1 font-bold">
              <span>Grand Total:</span>
              <span className="text-lg">{formatPiAmount(totals.total, currency)}</span>
            </div>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Terms & Conditions
          </span>
          <textarea
            rows={3}
            value={terms}
            onChange={(event) => setTerms(event.target.value)}
            className="w-full resize-y border-0 bg-transparent p-0 text-sm text-slate-600 outline-none"
          />
        </label>
        <div className="mt-8 flex justify-end text-center">
          <div className="w-56">
            <div className="mx-auto mb-2 h-10 w-4/5 border-b border-slate-800" />
            <p className="text-sm font-bold text-slate-900">{values.creatorName}</p>
            <p className="text-xs uppercase text-slate-500">{values.creatorPosition}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Authorized Signatory
            </p>
          </div>
        </div>
        <div className="pi-no-print mt-4 border-t border-slate-200 pt-3 text-right">
          <Button type="submit" loading={saving}>
            Save & Finalize Document
          </Button>
        </div>
      </div>
    </form>
  );
}
