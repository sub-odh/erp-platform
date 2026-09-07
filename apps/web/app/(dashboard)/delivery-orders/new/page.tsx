"use client";

import {
  ChevronLeft,
  FileText,
  PackageSearch,
  Save,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select, Spinner, Textarea } from "@/components/ui";
import {
  createDeliveryOrder,
  getDeliverableAssets,
} from "@/lib/delivery-orders";
import type { DeliverableAsset } from "@/types/delivery-orders";

type Line = { asset: DeliverableAsset; quantity: number };
type ServiceLine = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};
const today = () => new Date().toISOString().slice(0, 10);

export default function CreateDeliveryOrderPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<DeliverableAsset[] | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [sourceBill, setSourceBill] = useState("");
  const [notes, setNotes] = useState("");
  const [billable, setBillable] = useState(true);
  const [discountValue, setDiscountValue] = useState("0");
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    "percent",
  );
  const [taxable, setTaxable] = useState(true);
  const [services, setServices] = useState<ServiceLine[]>([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState("1");
  const [servicePrice, setServicePrice] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getDeliverableAssets()
      .then(setAssets)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load inventory."),
      );
  }, []);
  const filtered = useMemo(
    () =>
      (assets ?? []).filter((a) =>
        `${a.itemName} ${a.serialNumber ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [assets, search],
  );
  const itemTotal = lines.reduce(
    (sum, line) => sum + Number(line.asset.mrpPrice) * line.quantity,
    0,
  );
  const serviceTotal = services.reduce(
    (sum, service) => sum + service.price * service.quantity,
    0,
  );
  const subtotal = itemTotal + serviceTotal;
  const discount = Math.min(
    subtotal,
    discountMode === "percent"
      ? (subtotal * Math.max(0, Number(discountValue) || 0)) / 100
      : Math.max(0, Number(discountValue) || 0),
  );
  const vat = taxable ? (subtotal - discount) * 0.13 : 0;
  const total = subtotal - discount + vat;

  function add(asset: DeliverableAsset) {
    setLines((current) =>
      current.some((line) => line.asset.id === asset.id)
        ? current
        : [...current, { asset, quantity: 1 }],
    );
  }
  function quantity(id: string, value: string) {
    setLines((current) =>
      current.map((line) =>
        line.asset.id === id
          ? {
              ...line,
              quantity: Math.max(
                1,
                Math.min(line.asset.stockQuantity, Number(value) || 1),
              ),
            }
          : line,
      ),
    );
  }
  function addService() {
    if (!serviceName.trim()) return;
    setServices((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: serviceName.trim(),
        quantity: Math.max(1, Number(serviceQuantity) || 1),
        price: Math.max(0, Number(servicePrice) || 0),
      },
    ]);
    setServiceName("");
    setServiceQuantity("1");
    setServicePrice("0");
    setServiceOpen(false);
  }
  async function save() {
    if (!customerName.trim() || !lines.length) {
      setError("Add a customer and at least one inventory item.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createDeliveryOrder({
        customerName: customerName.trim(),
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        deliveryAddress: address.trim() || undefined,
        deliveryDate: today(),
        notes: [
          billable ? "Billable delivery" : "Non-billable delivery",
          sourceBill && `Source bill: ${sourceBill}`,
          services.length &&
            `Services: ${services.map((s) => `${s.name} x${s.quantity} Rs.${s.price}`).join(", ")}`,
          `Subtotal Rs.${subtotal.toFixed(2)}; Discount Rs.${discount.toFixed(2)}; VAT Rs.${vat.toFixed(2)}; Total Rs.${total.toFixed(2)}`,
          notes.trim(),
        ]
          .filter(Boolean)
          .join(" | "),
        items: lines.map((line) => ({
          assetId: line.asset.id,
          quantity: line.quantity,
        })),
      });
      router.push("/delivery-orders");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to finalize delivery order.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (!assets)
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Spinner />
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileText size={19} className="text-blue-600" />
            Delivery Order Creation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Reference will be generated when the delivery order is finalized.
          </p>
        </div>
        <Button onClick={() => void save()} loading={saving}>
          <Save size={16} />
          Finalize & Save
        </Button>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setBillable(true)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${billable ? "bg-emerald-600 text-white" : "border text-slate-600"}`}
          >
            Billable
          </button>
          <button
            type="button"
            onClick={() => setBillable(false)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${!billable ? "bg-red-500 text-white" : "border text-slate-600"}`}
          >
            Non-Billable
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Customer / Client"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Type customer name..."
          />
          <Input
            label="Contact Person"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Contact name"
          />
          <Input
            label="Phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Phone number"
          />
          <Input
            label="Source Bill No."
            value={sourceBill}
            onChange={(e) => setSourceBill(e.target.value)}
            placeholder="Reference bill number"
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Customer delivery address"
          />
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.65fr_.9fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold text-blue-700">Items for Delivery</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => setServiceOpen(true)}
              >
                Add Service
              </Button>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                {lines.length + services.length} items
              </span>
            </div>
          </div>
          {lines.length ? (
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Item & Serial No.</th>
                  <th>Qty</th>
                  <th className="text-right">Price (Rs.)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.asset.id} className="border-b">
                    <td className="p-3 font-medium">
                      {line.asset.itemName}
                      <p className="text-xs font-normal text-slate-400">
                        S/N: {line.asset.serialNumber ?? "N/A"}
                      </p>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={line.asset.stockQuantity}
                        value={line.quantity}
                        onChange={(e) =>
                          quantity(line.asset.id, e.target.value)
                        }
                        className="w-16 rounded border p-1 text-center"
                      />
                    </td>
                    <td className="text-right font-medium">
                      Rs.{" "}
                      {(Number(line.asset.mrpPrice) * line.quantity).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          setLines((current) =>
                            current.filter((l) => l.asset.id !== line.asset.id),
                          )
                        }
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {services.map((service) => (
                  <tr key={service.id} className="border-b bg-emerald-50/40">
                    <td className="p-3 font-medium">
                      {service.name}
                      <p className="text-xs font-normal text-emerald-600">
                        Service
                      </p>
                    </td>
                    <td>{service.quantity}</td>
                    <td className="text-right font-medium">
                      Rs. {(service.price * service.quantity).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          setServices((current) =>
                            current.filter((s) => s.id !== service.id),
                          )
                        }
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-68 flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={48} />
              <p className="mt-3">No items selected.</p>
            </div>
          )}
          <div className="border-t bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <span>Discount</span>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-24 rounded border p-1"
                  />
                  <Select
                    aria-label="Discount type"
                    value={discountMode}
                    onChange={(e) =>
                      setDiscountMode(e.target.value as "amount" | "percent")
                    }
                    wrapperClassName="w-20"
                    className="h-8 py-1 text-sm"
                  >
                    <option value="percent">%</option>
                    <option value="amount">Rs.</option>
                  </Select>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={taxable}
                    aria-label="Toggle VAT taxable"
                    onClick={() => setTaxable((value) => !value)}
                    className="relative h-5 w-9 shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <span
                      className={`absolute inset-0 rounded-full transition ${taxable ? "bg-blue-600" : "bg-slate-300"}`}
                    />
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${taxable ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                  <span className="whitespace-nowrap text-sm font-medium text-slate-800">
                    Taxable (VAT 13%)
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <b>Rs. {subtotal.toFixed(2)}</b>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <b>Rs. {discount.toFixed(2)}</b>
                </div>
                <div className="flex justify-between">
                  <span>VAT (13%)</span>
                  <b>Rs. {vat.toFixed(2)}</b>
                </div>
                <div className="flex justify-between border-t pt-2 text-base">
                  <b>Grand Total</b>
                  <b className="text-blue-600">Rs. {total.toFixed(2)}</b>
                </div>
                <Button
                  className="mt-3 w-full"
                  onClick={() => void save()}
                  loading={saving}
                >
                  Finalize Order
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="relative border-b p-3">
            <PackageSearch
              size={17}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item or serial..."
              className="w-full rounded border py-2 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="max-h-130 divide-y overflow-y-auto">
            {filtered.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => add(asset)}
                disabled={lines.some((line) => line.asset.id === asset.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-blue-50 disabled:opacity-50"
              >
                <span>
                  <b className="block text-sm">{asset.itemName}</b>
                  <span className="text-xs text-slate-500">
                    S/N: {asset.serialNumber ?? "N/A"} · {asset.stockQuantity}{" "}
                    available
                  </span>
                </span>
                <ChevronLeft size={18} className="text-blue-600" />
              </button>
            ))}
          </div>
        </section>
      </div>
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Delivery instructions or notes..."
      />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Modal
        open={serviceOpen}
        title="Add New Service"
        description="Add a service charge to this delivery order."
        onClose={() => setServiceOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setServiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addService}>Add to Order</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Service Name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Installation Fee"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={serviceQuantity}
              onChange={(e) => setServiceQuantity(e.target.value)}
            />
            <Input
              label="Price (Rs.)"
              type="number"
              min="0"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
