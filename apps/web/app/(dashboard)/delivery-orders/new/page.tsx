"use client";

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  HandHeart,
  PlusCircle,
  Save,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, Input, Modal, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { getCustomers } from "@/lib/customers";
import {
  createDeliveryOrder,
  getDeliverableAssets,
  getDeliveryDraft,
  getDeliveryLookups,
} from "@/lib/delivery-orders";
import { searchEmployees } from "@/lib/employees";
import type { DeliverableAsset, DeliveryLeadOption } from "@/types/delivery-orders";

type SelectedLine = {
  key: string;
  assetId?: string;
  name: string;
  serial: string;
  quantity: string;
  price: string;
  maxStock?: number;
  service?: boolean;
  remove: boolean;
};

function serialLabel(value: string | null | undefined): string {
  if (!value || value === "NULL") return "BULK";
  return value;
}

export default function CreateDeliveryOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<DeliverableAsset[]>([]);
  const [leads, setLeads] = useState<DeliveryLeadOption[]>([]);
  const [doNumber, setDoNumber] = useState("");
  const [ready, setReady] = useState(false);
  const [billable, setBillable] = useState(true);
  const [clientQuery, setClientQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [clientHits, setClientHits] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [sellerQuery, setSellerQuery] = useState("");
  const [soldById, setSoldById] = useState("");
  const [sellerHits, setSellerHits] = useState<Array<{ id: string; name: string }>>([]);
  const [sellerOpen, setSellerOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [returnDays, setReturnDays] = useState<15 | 90 | 180 | 365>(365);
  const [sourceBill, setSourceBill] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<SelectedLine[]>([]);
  const [discountValue, setDiscountValue] = useState("0");
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [taxable, setTaxable] = useState(true);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceQty, setServiceQty] = useState("1");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const name = searchParams.get("clientName");
    if (name) setClientQuery(name);
    if (searchParams.get("billable") === "0") setBillable(false);
  }, [searchParams]);

  useEffect(() => {
    void Promise.all([
      getDeliverableAssets(),
      getDeliveryLookups(),
      getDeliveryDraft(new Date().toISOString().slice(0, 10)),
    ])
      .then(([stock, options, draft]) => {
        setAssets(stock);
        setLeads(options.leads);
        setDoNumber(draft.deliveryNumber);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to load inventory.");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const query = clientQuery.trim();
    if (query.length < 2 || customerId) {
      setClientHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void getCustomers({ search: query, limit: 5 })
        .then((result) => {
          setClientHits(
            result.data.map((customer) => ({
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
            })),
          );
          setClientOpen(true);
        })
        .catch(() => setClientHits([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [clientQuery, customerId]);

  useEffect(() => {
    const query = sellerQuery.trim();
    if (query.length < 2 || soldById) {
      setSellerHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchEmployees(query)
        .then((rows) => {
          setSellerHits(
            rows.slice(0, 5).map((row) => ({
              id: row.id,
              name: `${row.first_name} ${row.last_name}`.trim(),
            })),
          );
          setSellerOpen(true);
        })
        .catch(() => setSellerHits([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [sellerQuery, soldById]);

  const taken = new Set(lines.map((line) => line.assetId).filter(Boolean));
  const visibleAssets = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (!needle) return true;
      return `${asset.itemName} ${asset.serialNumber ?? ""}`.toLowerCase().includes(needle);
    });
  }, [assets, search]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      return sum + (Number(line.quantity) || 0) * (Number(line.price) || 0);
    }, 0);
    const raw = Math.max(0, Number(discountValue) || 0);
    const discount = discountMode === "percent" ? (subtotal * raw) / 100 : raw;
    const taxableBase = subtotal - discount;
    const vat = taxable ? taxableBase * 0.13 : 0;
    return { subtotal, discount, vat, total: taxableBase + vat };
  }, [discountMode, discountValue, lines, taxable]);

  function moveLeft() {
    const chosen = assets.filter((asset) => selectedIds.includes(asset.id) && !taken.has(asset.id));
    setLines((current) => [
      ...current,
      ...chosen.map((asset) => ({
        key: asset.id,
        assetId: asset.id,
        name: asset.itemName,
        serial: serialLabel(asset.serialNumber),
        quantity: "1",
        price: String(asset.mrpPrice),
        maxStock: asset.stockQuantity,
        remove: false,
      })),
    ]);
    setSelectedIds([]);
    setSelectAll(false);
  }

  function moveRight() {
    setLines((current) => current.filter((line) => !line.remove));
  }

  function addService() {
    if (!serviceName.trim() || servicePrice.trim() === "") {
      setServiceError("Please fill Service Name and Price");
      return;
    }
    setLines((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        name: serviceName.trim(),
        serial: "",
        quantity: String(Math.max(1, Number(serviceQty) || 1)),
        price: servicePrice,
        service: true,
        remove: false,
      },
    ]);
    setServiceName("");
    setServiceQty("1");
    setServicePrice("");
    setServiceError(null);
    setServiceOpen(false);
  }

  async function save() {
    if (!clientQuery.trim()) {
      setError("Customer / Client is required.");
      return;
    }
    if (!soldById) {
      setError("Assigned Salesperson is required.");
      return;
    }
    if (!lines.length) {
      setError("Please select at least one item or service.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createDeliveryOrder({
        customerName: clientQuery.trim(),
        customerId: customerId || undefined,
        deliveryDate: new Date().toISOString().slice(0, 10),
        billable,
        returnValidityDays: returnDays,
        sourceBillNo: sourceBill.trim() || undefined,
        soldById,
        leadId: leadId || undefined,
        discountValue: Math.max(0, Number(discountValue) || 0),
        discountType: discountMode,
        taxable,
        items: lines.map((line) => ({
          assetId: line.assetId,
          serviceName: line.service ? line.name : undefined,
          quantity: Math.max(1, Number(line.quantity) || 1),
          unitPrice: Number(line.price) || 0,
        })),
      });
      router.push("/delivery-orders?success=1");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to finalize delivery order.");
      setSaving(false);
    }
  }

  if (!ready) {
    return <p className="py-16 text-center text-sm text-slate-500">Loading delivery order...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileText size={16} className="text-blue-600" />
            Delivery Order Creation
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Ref: {doNumber || "DO"}
            </span>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setBillable(true)}
                className={`inline-flex items-center gap-1 px-3 py-1 text-sm ${billable ? "bg-emerald-600 text-white" : "bg-white text-emerald-700"}`}
              >
                <BadgeCheck size={14} /> Billable
              </button>
              <button
                type="button"
                onClick={() => setBillable(false)}
                className={`inline-flex items-center gap-1 px-3 py-1 text-sm ${!billable ? "bg-red-600 text-white" : "bg-white text-red-600"}`}
              >
                <HandHeart size={14} /> Non-Billable
              </button>
            </div>
          </div>
        </div>
        <Button onClick={() => void save()} loading={saving}>
          <Save size={16} /> Finalize & Save
        </Button>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative">
            <Input
              label="Customer / Client"
              required
              value={clientQuery}
              placeholder="Type to search..."
              onChange={(event) => {
                setClientQuery(event.target.value);
                setCustomerId("");
                setClientOpen(true);
              }}
            />
            {clientOpen && clientQuery.trim().length >= 2 && !customerId ? (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {clientHits.length ? (
                  clientHits.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setCustomerId(hit.id);
                        setClientQuery(hit.name);
                        setClientOpen(false);
                      }}
                    >
                      <span className="font-medium">{hit.name}</span>
                      <span className="text-xs text-slate-400">{hit.phone || ""}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No clients found.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <Input
              label="Assigned Salesperson"
              required
              value={sellerQuery}
              placeholder="Type to search..."
              onChange={(event) => {
                setSellerQuery(event.target.value);
                setSoldById("");
                setSellerOpen(true);
              }}
            />
            {sellerOpen && sellerQuery.trim().length >= 2 && !soldById ? (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {sellerHits.length ? (
                  sellerHits.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setSoldById(hit.id);
                        setSellerQuery(hit.name);
                        setSellerOpen(false);
                      }}
                    >
                      <User size={14} className="text-emerald-600" />
                      {hit.name}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No employees found.</p>
                )}
              </div>
            ) : null}
          </div>
          <Select label="Sales Lead (Optional)" value={leadId} onChange={(event) => setLeadId(event.target.value)}>
            <option value="">Standalone (None)</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                {lead.jobTitle ? ` (${lead.jobTitle})` : ""}
              </option>
            ))}
          </Select>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Return Validity</p>
            <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-slate-300">
              {(
                [
                  [15, "15D"],
                  [90, "90D"],
                  [180, "6M"],
                  [365, "1Y"],
                ] as const
              ).map(([days, label]) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setReturnDays(days)}
                  className={`py-2 text-xs font-medium ${returnDays === days ? "bg-slate-800 text-white" : "bg-white text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Source Bill No."
            value={sourceBill}
            placeholder="Enter Reference Bill #"
            onChange={(event) => setSourceBill(event.target.value)}
          />
        </div>
      </section>
      <div className="grid items-stretch gap-2 lg:grid-cols-[1.6fr_auto_1fr]">
        <section className="flex h-[580px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2">
            <span className="text-xs font-bold uppercase text-blue-700">Items for Delivery</span>
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{lines.length} Items</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {lines.length ? (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-8">#</th>
                    <th>Item & Serial No.</th>
                    <th className="w-20">Qty</th>
                    <th className="w-28">Price (Rs.)</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={line.key} className="border-t">
                      <td className="py-2 text-xs text-slate-400">{index + 1}</td>
                      <td>
                        <div className="font-medium">{line.service ? line.name : line.name}</div>
                        {line.service ? (
                          <p className="text-[10px] font-bold uppercase text-blue-600">Service</p>
                        ) : (
                          <p className="text-[10px] uppercase text-slate-400">SN: {line.serial}</p>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max={line.maxStock}
                          value={line.quantity}
                          onChange={(event) => {
                            const next = event.target.value;
                            const capped =
                              line.maxStock && Number(next) > line.maxStock ? String(line.maxStock) : next;
                            setLines((current) =>
                              current.map((entry) =>
                                entry.key === line.key ? { ...entry, quantity: capped } : entry,
                              ),
                            );
                          }}
                          className="w-16 rounded border p-1 text-center"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={line.price}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((entry) =>
                                entry.key === line.key ? { ...entry, price: event.target.value } : entry,
                              ),
                            )
                          }
                          className="w-24 rounded border p-1 text-right"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={line.remove}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((entry) =>
                                entry.key === line.key ? { ...entry, remove: event.target.checked } : entry,
                              ),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-300">
                <ShoppingCart size={42} />
                <p className="mt-3 text-sm">No items selected.</p>
              </div>
            )}
          </div>
          <div className="grid gap-3 border-t bg-slate-50 p-3 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Discount</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    value={discountValue}
                    onChange={(event) => setDiscountValue(event.target.value)}
                    className="w-20 rounded border p-1"
                  />
                  <Select
                    aria-label="Discount type"
                    value={discountMode}
                    onChange={(event) => setDiscountMode(event.target.value as "percent" | "amount")}
                    wrapperClassName="w-16"
                    className="h-8 py-1 text-sm"
                  >
                    <option value="percent">%</option>
                    <option value="amount">Rs.</option>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" checked={taxable} onChange={(event) => setTaxable(event.target.checked)} />
                Taxable (VAT 13%)
              </label>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Sub Total</span><b>{formatCurrency(totals.subtotal)}</b></div>
              <div className="flex justify-between text-red-600"><span>Discount</span><b>{formatCurrency(totals.discount)}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">VAT (13%)</span><b>{formatCurrency(totals.vat)}</b></div>
              <div className="flex justify-between border-t pt-2"><b>Grand Total</b><b className="text-lg text-blue-700">{formatCurrency(totals.total)}</b></div>
              <Button className="mt-2 w-full" onClick={() => void save()} loading={saving}>
                Finalize Order
              </Button>
            </div>
          </div>
        </section>
        <div className="flex flex-row items-center justify-center gap-3 lg:flex-col">
          <button type="button" aria-label="Add selected items" onClick={moveLeft} className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow">
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Remove checked items" onClick={moveRight} className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white shadow">
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={() => setServiceOpen(true)} className="rounded-lg bg-emerald-600 px-2 py-2 text-center text-xs font-bold text-white">
            <PlusCircle size={14} className="mx-auto mb-1" />
            Add Service
          </button>
        </div>
        <section className="flex h-[580px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={selectAll}
              onChange={(event) => {
                const checked = event.target.checked;
                setSelectAll(checked);
                setSelectedIds(
                  checked
                    ? visibleAssets.filter((asset) => !taken.has(asset.id)).map((asset) => asset.id)
                    : [],
                );
              }}
            />
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectAll(false);
                }}
                placeholder="Search item or serial..."
                className="w-full rounded border py-1.5 pl-7 pr-2 text-sm"
              />
            </div>
            <span className="rounded-full bg-slate-500 px-2 py-0.5 text-xs text-white">{visibleAssets.length} Items</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {visibleAssets.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No items found</p>
            ) : (
              visibleAssets.map((asset) => {
                const used = taken.has(asset.id);
                return (
                  <label
                    key={asset.id}
                    className={`mb-2 flex items-center gap-2 rounded-lg border p-2 text-sm ${used ? "pointer-events-none border-transparent bg-slate-100 opacity-40" : "border-slate-100 bg-white"}`}
                  >
                    <input
                      type="checkbox"
                      disabled={used}
                      checked={selectedIds.includes(asset.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, asset.id]
                            : current.filter((id) => id !== asset.id),
                        )
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{asset.itemName}</span>
                      <span className="flex justify-between text-[10px] uppercase">
                        <span className="text-slate-400">SN: {serialLabel(asset.serialNumber)}</span>
                        <span className="font-bold text-blue-700">Stock: {asset.stockQuantity}</span>
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </section>
      </div>
      <Modal
        open={serviceOpen}
        title="Add New Service"
        onClose={() => setServiceOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setServiceOpen(false)}>Cancel</Button>
            <Button onClick={addService}>Add to Order</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Service Name" value={serviceName} placeholder="e.g. Installation Fee" onChange={(event) => setServiceName(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" min="1" value={serviceQty} onChange={(event) => setServiceQty(event.target.value)} />
            <Input label="Price (Rs.)" type="number" step="any" value={servicePrice} placeholder="0.00" onChange={(event) => setServicePrice(event.target.value)} />
          </div>
          {serviceError ? <p className="text-sm text-red-700">{serviceError}</p> : null}
        </div>
      </Modal>
    </div>
  );
}
