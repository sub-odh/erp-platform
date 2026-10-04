"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { Button, CurrencySwitch, CurrencyTag, Input, Textarea } from "@/components/ui";
import { formatPiAmount } from "@/lib/pi-format";
import type { CloudCurrency } from "@/types/cloud-quotations";

export const CLOUD_DOMAINS = [
  { value: "VPS", label: "VPS (Virtual Private Server)" },
  { value: "Private Cloud (VPC)", label: "Private Cloud (VPC)" },
  { value: "Secure Email Service", label: "Secure Email Service" },
  { value: "Firewall as a Service", label: "Firewall as a Service" },
  { value: "Backup and Replications", label: "Backup & Replications" },
  { value: "Security as a Service (SOC)", label: "Security as a Service (SOC)" },
] as const;

const RATES = {
  vcpu: 350,
  ram: 350,
  storage: 15,
  mailbox: 150,
  firewall: 5000,
};

export interface CloudLine {
  serviceType: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vcpu: number;
  ram: number;
  storage: number;
  mailboxes: number;
  includeGateway: boolean;
}

export interface CloudFormValues {
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  customerName: string;
  customerAddress: string;
  currency: CloudCurrency;
  vatApplicable: boolean;
  discountType: "amount" | "percent";
  discountValue: number;
  termsConditions: string;
  items: CloudLine[];
}

export const DEFAULT_TERMS = `1. Delivery: 1-3 Business Days post-PO authorization.
2. Payment Terms: 100% Advance Payment for Recurring Subscriptions.
3. SLA Benchmark: 99.9% Uptime Guarantee on Infrastructure Services.`;

export function blankCloudLine(): CloudLine {
  const line: CloudLine = {
    serviceType: "VPS",
    itemName: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    vcpu: 2,
    ram: 4,
    storage: 50,
    mailboxes: 10,
    includeGateway: true,
  };
  return applyDomain(line, true);
}

export function CloudQuotationForm({
  title,
  submitLabel,
  values,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  submitLabel: string;
  values: CloudFormValues;
  saving: boolean;
  error: string | null;
  onChange: (next: CloudFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const totals = useMemo(() => quoteTotals(values), [values]);
  const usd = values.currency === "USD";

  function patch(partial: Partial<CloudFormValues>) {
    onChange({ ...values, ...partial });
  }

  function setLine(index: number, next: CloudLine) {
    onChange({
      ...values,
      items: values.items.map((line, lineIndex) => (lineIndex === index ? next : line)),
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex justify-center">
        <img
          src="/sajilocloud/sajilcloud-logo-small.png"
          alt="SajiloCloud"
          className="h-10 w-auto"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Return to Ledger
        </Button>
      </div>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Document Parameters</h2>
          <div className="space-y-3">
            <Input label="Quotation Tracker ID" value={values.quotationNumber} readOnly />
            {usd ? null : (
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={values.vatApplicable}
                  onChange={(event) => patch({ vatApplicable: event.target.checked })}
                />
                Apply 13% VAT
              </label>
            )}
            <Input
              label="Issue Date"
              type="date"
              value={values.quotationDate}
              required
              onChange={(event) => patch({ quotationDate: event.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={values.expiryDate}
              required
              onChange={(event) => patch({ expiryDate: event.target.value })}
            />
            <Input
              label="Client / Customer Name"
              value={values.customerName}
              placeholder="Enterprise / Client Name"
              required
              onChange={(event) => patch({ customerName: event.target.value })}
            />
            <Textarea
              label="Client Address"
              value={values.customerAddress}
              placeholder="Address..."
              onChange={(event) => patch({ customerAddress: event.target.value })}
            />
          </div>
        </section>
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
              <h2 className="text-sm font-bold text-slate-900">Cloud Service Components</h2>
              <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => patch({ items: [...values.items, blankCloudLine()] })}
              >
                <Plus className="size-4" />
                Add Service
              </Button>
              <CurrencySwitch
                className="shrink-0"
                value={values.currency}
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
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Service Domain</th>
                    <th className="px-3 py-2">Item / Spec</th>
                    <th className="px-3 py-2">Specifications / Options</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Rate (<CurrencyTag>{usd ? "USD" : "Rs."}</CurrencyTag>)</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {values.items.map((line, index) => {
                    const compute = line.serviceType === "VPS" || line.serviceType === "Private Cloud (VPC)";
                    const email = line.serviceType === "Secure Email Service";
                    return (
                      <tr key={index} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2">
                          <CompactSelect
                            value={line.serviceType}
                            onChange={(serviceType) => setLine(index, applyDomain({ ...line, serviceType }, true))}
                          >
                            {CLOUD_DOMAINS.map((domain) => (
                              <option key={domain.value} value={domain.value}>
                                {domain.label}
                              </option>
                            ))}
                          </CompactSelect>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            placeholder="Plan / Package Name"
                            value={line.itemName}
                            required
                            onChange={(event) => setLine(index, { ...line, itemName: event.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          {compute ? (
                            <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                              <span>vCPU</span>
                              <MiniNumber
                                value={line.vcpu}
                                min={1}
                                onChange={(vcpu) => setLine(index, priceCompute({ ...line, vcpu }))}
                              />
                              <span>RAM</span>
                              <MiniNumber
                                value={line.ram}
                                min={1}
                                onChange={(ram) => setLine(index, priceCompute({ ...line, ram }))}
                              />
                              <span>GB</span>
                              <span>SSD</span>
                              <MiniNumber
                                value={line.storage}
                                min={0}
                                onChange={(storage) => setLine(index, priceCompute({ ...line, storage }))}
                              />
                              <span>GB</span>
                            </div>
                          ) : null}
                          {email ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>Mailboxes</span>
                              <MiniNumber
                                value={line.mailboxes}
                                min={1}
                                onChange={(mailboxes) => setLine(index, priceEmail({ ...line, mailboxes }))}
                              />
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={line.includeGateway}
                                  onChange={(event) =>
                                    setLine(index, priceEmail({ ...line, includeGateway: event.target.checked }))
                                  }
                                />
                                Inc. Gateway
                              </label>
                            </div>
                          ) : null}
                          {compute || email ? null : (
                            <input
                              className="w-full rounded border border-slate-300 px-2 py-1"
                              placeholder="Specifications details"
                              value={line.description}
                              onChange={(event) => setLine(index, { ...line, description: event.target.value })}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            readOnly={email}
                            className="w-16 rounded border border-slate-300 px-2 py-1"
                            value={line.quantity}
                            onChange={(event) =>
                              setLine(index, { ...line, quantity: Number(event.target.value) || 1 })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-24 rounded border border-slate-300 px-2 py-1"
                            value={line.unitPrice}
                            onChange={(event) =>
                              setLine(index, { ...line, unitPrice: Number(event.target.value) || 0 })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="text-rose-600 disabled:opacity-30"
                            disabled={values.items.length === 1}
                            onClick={() =>
                              patch({ items: values.items.filter((_, lineIndex) => lineIndex !== index) })
                            }
                          >
                            <X className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-50 p-4 text-sm">
              <div className="w-64">
                <p className="mb-1 text-sm font-medium text-slate-500">Apply Discount</p>
                <div className="flex gap-2">
                  <CompactSelect
                    value={values.discountType}
                    onChange={(discountType) =>
                      patch({ discountType: discountType as CloudFormValues["discountType"] })
                    }
                  >
                    <option value="amount">Amount</option>
                    <option value="percent">% Off</option>
                  </CompactSelect>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-28 rounded border border-slate-300 px-2 py-1"
                    value={values.discountValue}
                    onChange={(event) => patch({ discountValue: Number(event.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="w-64 space-y-1">
                <Row label="Subtotal:" value={formatPiAmount(totals.subtotal, values.currency)} />
                {totals.discount > 0 ? (
                  <Row
                    label="Discount:"
                    value={`- ${formatPiAmount(totals.discount, values.currency)}`}
                    tone="text-blue-700"
                  />
                ) : null}
                {!usd && values.vatApplicable ? (
                  <Row
                    label="VAT (13%):"
                    value={formatPiAmount(totals.vat, values.currency)}
                    tone="text-rose-700"
                  />
                ) : null}
                <Row
                  label="Grand Total:"
                  value={formatPiAmount(totals.total, values.currency)}
                  tone="text-base font-semibold text-emerald-700"
                />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold">Terms & Conditions</h2>
            <Textarea
              value={values.termsConditions}
              onChange={(event) => patch({ termsConditions: event.target.value })}
              className="font-mono"
            />
            <div className="mt-3 flex justify-end">
              <Button type="submit" variant="success" loading={saving}>
                {submitLabel}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}

export function quoteTotals(values: CloudFormValues) {
  const subtotal = values.items.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
    0,
  );
  let discount =
    values.discountType === "percent" ? subtotal * ((Number(values.discountValue) || 0) / 100) : Number(values.discountValue) || 0;
  if (discount > subtotal) discount = subtotal;
  if (discount < 0) discount = 0;
  const net = subtotal - discount;
  const vat = values.currency === "USD" || !values.vatApplicable ? 0 : Math.round(net * 0.13 * 100) / 100;
  return {
    subtotal,
    discount,
    vat,
    total: Math.round((net + vat) * 100) / 100,
  };
}

function applyDomain(line: CloudLine, resetPrice: boolean): CloudLine {
  if (!resetPrice) return line;
  if (line.serviceType === "VPS" || line.serviceType === "Private Cloud (VPC)") {
    return priceCompute(line);
  }
  if (line.serviceType === "Secure Email Service") return priceEmail(line);
  if (line.serviceType === "Firewall as a Service") {
    return {
      ...line,
      unitPrice: RATES.firewall,
      description: "Dedicated Cloud Firewall Instance (500Mbps Throughput)",
    };
  }
  return line;
}

function priceCompute(line: CloudLine): CloudLine {
  const vcpu = Number(line.vcpu) || 0;
  const ram = Number(line.ram) || 0;
  const storage = Number(line.storage) || 0;
  return {
    ...line,
    unitPrice: vcpu * RATES.vcpu + ram * RATES.ram + storage * RATES.storage,
    description: `${vcpu} vCPU, ${ram}GB RAM, ${storage}GB Storage`,
  };
}

function priceEmail(line: CloudLine): CloudLine {
  const mailboxes = Number(line.mailboxes) || 1;
  return {
    ...line,
    mailboxes,
    quantity: mailboxes,
    unitPrice: RATES.mailbox,
    description: `Cloud Mailbox Storage${line.includeGateway ? " (Includes Secure Email Gateway & Anti-Spam Protection)" : ""}`,
  };
}

function CompactSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative min-w-36">
      <select
        className="w-full appearance-none rounded border border-slate-300 bg-white py-1 pl-2 pr-8 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-700" />
    </div>
  );
}

function MiniNumber({
  value,
  min,
  onChange,
}: {
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      className="w-14 rounded border border-slate-300 px-1 py-1 text-slate-800"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function Row({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`flex justify-between ${tone}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
