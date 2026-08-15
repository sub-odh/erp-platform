"use client";

import {
  FilePlus2,
  FileText,
  List,
  Mail,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { Button, Select, Spinner } from "@/components/ui";
import { getCurrentCompany, resolveMediaUrl } from "@/lib/company";
import { formatRupees } from "@/lib/inventory-format";
import { getProducts, getVendors } from "@/lib/master-data";
import {
  createPurchaseOrder,
  getNextPurchaseOrderNumber,
  sendPurchaseOrderEmail,
} from "@/lib/purchase-orders";
import type { Company } from "@/types/company";
import type { Product, Vendor } from "@/types/master-data";

type Line = {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
};
const emptyLine: Line = {
  productId: "",
  description: "",
  quantity: "1",
  unitPrice: "0",
};

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [poDate, setPoDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [poNumber, setPoNumber] = useState("Loading…");
  const [attentionContact, setAttentionContact] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendAfterSaveRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [companyResult, vendorResult, productResult] = await Promise.all([
        getCurrentCompany(),
        getVendors({ isActive: true, limit: 100 }),
        getProducts({ isActive: true, limit: 100 }),
      ]);
      setCompany(companyResult);
      setVendors(vendorResult.data);
      setProducts(productResult.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load purchase-order data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);
  useEffect(() => {
    void getNextPurchaseOrderNumber(poDate)
      .then((result) => setPoNumber(result.poNumber))
      .catch(() => setPoNumber("Pending"));
  }, [poDate]);
  const companyLogoUrl = resolveMediaUrl(
    company?.invoiceLogoUrl ?? company?.logoUrl,
  );
  const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);
  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
        0,
      ),
    [lines],
  );
  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }
  function chooseProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateLine(index, {
      productId,
      description: product?.description ?? "",
      unitPrice: String(product?.purchasePrice ?? 0),
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const sendAfterSave = sendAfterSaveRef.current;
    sendAfterSaveRef.current = false;
    if (!vendorId) {
      setError("Select a vendor before saving.");
      return;
    }
    if (
      lines.some(
        (line) =>
          !line.productId ||
          !Number.isInteger(Number(line.quantity)) ||
          Number(line.quantity) < 1 ||
          Number(line.unitPrice) < 0,
      )
    ) {
      setError(
        "Every line needs a product, quantity of at least 1, and valid unit price.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createPurchaseOrder({
        vendorId,
        poDate,
        attentionContact: attentionContact.trim() || null,
        deliveryAddress: null,
        paymentTerms: null,
        notes: null,
        items: lines.map((line) => ({
          productId: line.productId,
          description: line.description.trim() || null,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
        })),
      });
      if (sendAfterSave) {
        try {
          await sendPurchaseOrderEmail(created.id);
          router.push(`/purchase-orders/${created.id}?email=sent`);
        } catch {
          // The purchase order is already safely stored. Route to it so a
          // retry cannot create a duplicate order when SMTP is unavailable.
          router.push(`/purchase-orders/${created.id}?email=failed`);
        }
        return;
      }
      router.push(`/purchase-orders/${created.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create purchase order.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (loading)
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner />
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Purchase Order
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save as PDF
          </Button>
          <Button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600"
            onClick={() => {
              sendAfterSaveRef.current = true;
            }}
          >
            <Mail size={16} /> Send via Email
          </Button>
          <Link href="/purchase-orders">
            <Button variant="outline">
              <List size={16} /> View All POs
            </Button>
          </Link>
        </div>
      </div>
      <form
        onSubmit={submit}
        className="rounded-xl bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] lg:p-7"
      >
        <div className="flex flex-col justify-between gap-8 border-b border-slate-300 pb-7 md:flex-row">
          <div className="flex items-start gap-4">
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt={`${company?.name ?? "Company"} logo`}
                className="max-h-24 max-w-[22rem] h-auto w-auto object-contain object-left"
              />
            ) : (
              <div className="flex h-20 w-44 items-center text-xl font-bold text-blue-600">
                {company?.name ?? "Company"}
              </div>
            )}
            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className="text-xl font-bold text-slate-900">
                {company?.legalName ?? company?.name ?? "Your Company"}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {[company?.addressLine1, company?.city, company?.country]
                  .filter(Boolean)
                  .join(", ") || "Company address"}
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
                    VAT / PAN NO: {company.taxNumber}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="min-w-72 text-left md:text-right">
            <p className="text-4xl font-bold tracking-wide text-blue-600">
              PURCHASE ORDER
            </p>
            <label className="mt-5 block text-sm font-bold uppercase text-slate-600">
              PO Date:
              <input
                type="date"
                value={poDate}
                onChange={(event) => setPoDate(event.target.value)}
                className="mt-1 w-full border-b border-slate-300 bg-transparent py-2 text-right text-base font-bold outline-none focus:border-blue-500"
              />
            </label>
            <p className="mt-4 text-sm font-bold uppercase text-slate-600">
              PO Number:{" "}
              <span className="ml-3 text-2xl text-slate-900">{poNumber}</span>
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Select
            label="Vendor / Supplier Company"
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
            required
          >
            <option value="">Select vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.code} · {vendor.name}
              </option>
            ))}
          </Select>
          <label className="block border-l border-slate-200 pl-6">
            <span className="mb-2 block text-sm font-bold uppercase text-slate-600">
              To (attention person / vendor representative)
            </span>
            <textarea
              rows={2}
              value={attentionContact}
              onChange={(event) => setAttentionContact(event.target.value)}
              placeholder="Enter contact person's name or authorized sales agent matching the supplier..."
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={19} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-[#16266b]">
              Line Item Cost Specification Ledger
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border border-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-600">
                  <th className="p-3">Item / Product Name</th>
                  <th className="p-3">Description / Specification</th>
                  <th className="p-3">Units / Quantity</th>
                  <th className="p-3">Unit Price (Excl. VAT)</th>
                  <th className="p-3 text-right">Sub Total (Rs.)</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="p-2">
                      <Select
                        value={line.productId}
                        onChange={(event) =>
                          chooseProduct(index, event.target.value)
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.sku} · {product.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-2">
                      <input
                        value={line.description}
                        onChange={(event) =>
                          updateLine(index, { description: event.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                        placeholder="Size, model variations, specs..."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(index, { quantity: event.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-right outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(event) =>
                          updateLine(index, { unitPrice: event.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-right outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {formatRupees(
                        Number(line.quantity || 0) *
                          Number(line.unitPrice || 0),
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 bg-slate-500 hover:bg-slate-600"
            onClick={() => setLines((current) => [...current, emptyLine])}
          >
            <Plus size={16} /> Add Item Row
          </Button>
          <div className="ml-auto mt-6 max-w-md border-t border-slate-300 pt-4 text-right">
            <span className="text-sm font-semibold text-slate-500">
              GRAND TOTAL (EXCL. VAT):
            </span>
            <span className="ml-5 text-2xl font-bold text-blue-600">
              {formatRupees(total)}
            </span>
          </div>
        </section>
        <div className="mt-9 grid gap-8 border-t border-slate-200 pt-7 lg:grid-cols-[1fr_310px]">
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <FileText size={16} className="text-slate-500" /> Terms &
              Conditions
            </h3>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-5 text-slate-600">
              <li>
                Goods must be delivered within 7 business days from PO
                authorization.
              </li>
              <li>
                Payment terms: Net 30 days upon receiving verified item invoice.
              </li>
              <li>
                Defective entries must be replaced immediately at vendor
                expense.
              </li>
            </ol>
          </section>
          <section className="self-end border-t border-slate-400 pt-3 text-sm text-slate-600">
            <p className="font-bold text-slate-900">Authorized Officer</p>
            <p className="mt-1 text-xs uppercase leading-5">
              Operations Department
              <br />
              Authorized Signatory
            </p>
          </section>
        </div>
        {error ? (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="mt-8 flex justify-end border-t border-slate-200 pt-5">
          <Button type="submit" loading={saving} className="min-w-64">
            <FilePlus2 size={17} /> Save & Finalize Document
          </Button>
        </div>
      </form>
      <PurchaseOrderPrintDocument
        company={company}
        logoUrl={companyLogoUrl}
        poDate={poDate}
        poNumber={poNumber}
        vendor={selectedVendor}
        attentionContact={attentionContact}
        lines={lines}
        products={products}
        total={total}
      />
    </div>
  );
}

function PurchaseOrderPrintDocument({
  company,
  logoUrl,
  poDate,
  poNumber,
  vendor,
  attentionContact,
  lines,
  products,
  total,
}: {
  company: Company | null;
  logoUrl: string | null;
  poDate: string;
  poNumber: string;
  vendor: Vendor | undefined;
  attentionContact: string;
  lines: Line[];
  products: Product[];
  total: number;
}) {
  return (
    <>
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
          #purchase-order-print,
          #purchase-order-print * {
            visibility: visible;
          }
          #purchase-order-print {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 17mm 20mm;
            box-sizing: border-box;
            background: white;
            color: #0f172a;
          }
          #purchase-order-print thead {
            display: table-header-group;
          }
          #purchase-order-print tr,
          #purchase-order-print img {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          #purchase-order-print .po-signature {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <article id="purchase-order-print" className="hidden">
        <header className="border-b border-slate-300 pb-5">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[56%]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${company?.name ?? "Company"} logo`}
                  className="max-h-24 max-w-[70mm] h-auto w-auto object-contain object-left"
                />
              ) : null}
              <h1 className="mt-2 text-xl font-bold">
                {company?.legalName ?? company?.name ?? "Your Company"}
              </h1>
              <div className="mt-1 text-[11px] leading-4 text-slate-600">
                {[company?.addressLine1, company?.city, company?.country]
                  .filter(Boolean)
                  .join(", ")}
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
                    <strong>VAT / PAN NO:</strong> {company.taxNumber}
                  </>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold tracking-wide text-blue-600">
                PURCHASE ORDER
              </h2>
              <p className="mt-5 text-sm font-bold">PO DATE: {poDate}</p>
              <p className="mt-3 text-xl font-bold">{poNumber}</p>
            </div>
          </div>
        </header>
        <section className="grid grid-cols-2 py-6 text-xs">
          <div>
            <p className="font-bold">VENDOR / SUPPLIER COMPANY</p>
            <p className="mt-1 font-semibold">
              {vendor?.name ?? "e.g. TechNova Solutions"}
            </p>
          </div>
          <div className="border-l border-slate-300 pl-6">
            <p className="font-bold">
              TO (ATTENTION PERSON / VENDOR REPRESENTATIVE)
            </p>
            <p className="mt-1 font-semibold">
              {attentionContact ||
                "Enter contact person's name or authorized sales agent matching the supplier..."}
            </p>
          </div>
        </section>
        <h3 className="mb-3 text-lg font-bold">
          Line Item Cost Specification Ledger
        </h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-300 p-2 text-left">
                ITEM / PRODUCT NAME
              </th>
              <th className="border border-slate-300 p-2 text-left">
                DESCRIPTION / SPECIFICATION
              </th>
              <th className="border border-slate-300 p-2 text-right">
                UNITS / QUANTITY
              </th>
              <th className="border border-slate-300 p-2 text-right">
                UNIT PRICE (EXCL. VAT)
              </th>
              <th className="border border-slate-300 p-2 text-right">
                SUB TOTAL (Rs.)
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const product = products.find(
                (item) => item.id === line.productId,
              );
              const lineTotal =
                Number(line.quantity || 0) * Number(line.unitPrice || 0);
              return (
                <tr key={index}>
                  <td className="border border-slate-300 p-2 font-semibold">
                    {product?.name ?? "Product identifier"}
                  </td>
                  <td className="border border-slate-300 p-2 text-slate-600">
                    {line.description || "Size, model variations, specs..."}
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {line.quantity}
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {formatRupees(Number(line.unitPrice || 0))}
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-bold">
                    {formatRupees(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 text-right text-sm font-bold">
          GRAND TOTAL (EXCL. VAT):{" "}
          <span className="ml-7 text-lg text-blue-600">
            {formatRupees(total)}
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
              Payment terms: Net 30 days upon receiving verified item invoice.
            </li>
            <li>
              Defective entries must be replaced immediately at vendor expense.
            </li>
          </ol>
        </section>
        <footer className="po-signature ml-auto mt-24 w-48 border-t border-slate-700 pt-2 text-center text-xs">
          <p className="font-bold">Authorized Officer</p>
          <p className="mt-1 text-[9px] leading-3 text-slate-600">
            OPERATIONS DEPARTMENT
            <br />
            AUTHORIZED SIGNATORY
          </p>
        </footer>
      </article>
    </>
  );
}
