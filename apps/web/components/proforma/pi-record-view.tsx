import { formatPiAmount } from "@/lib/pi-format";
import type { ProformaCurrency, ProformaDetails } from "@/types/proforma-invoices";

function longDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function stamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleString("sv-SE", { timeZone: "Asia/Kathmandu", hour12: false })
    .slice(0, 16);
}

export function PiRecordView({ invoice }: { invoice: ProformaDetails }) {
  const currency = invoice.currency as ProformaCurrency;
  return (
    <div className="text-slate-900">
      <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-xl font-bold text-blue-700">{invoice.piNumber}</h3>
          <span className="mt-1 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
            Date: {longDate(invoice.piDate)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">Valuation Total</p>
          <p className="text-xl font-bold text-emerald-700">
            {formatPiAmount(invoice.totalAmount, currency)}
          </p>
        </div>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <AddressBlock title="Customer Details" text={invoice.customerDetails} strong />
        <AddressBlock title="Billing Address (Bill To)" text={invoice.billTo} />
        <AddressBlock title="Shipping Address (Ship To)" text={invoice.shipTo} />
      </div>
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-12 border border-slate-200 px-2 py-2">#</th>
              <th className="border border-slate-200 px-2 py-2 text-left">Item Description / Part No.</th>
              <th className="border border-slate-200 px-2 py-2">Quantity</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Unit Price</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-slate-200 px-2 py-3 text-center text-slate-500">
                  No line items mapped to this invoice.
                </td>
              </tr>
            ) : (
              invoice.items.map((item, index) => {
                const line = item.quantity * Number(item.unitPrice);
                return (
                  <tr key={item.id ?? index}>
                    <td className="border border-slate-200 px-2 py-2 text-center text-slate-500">
                      {index + 1}
                    </td>
                    <td className="border border-slate-200 px-2 py-2">
                      <div className="font-bold">{item.itemName || "N/A"}</div>
                      {item.partNumber ? (
                        <div className="text-xs text-slate-500">P/N: {item.partNumber}</div>
                      ) : null}
                      {item.description ? (
                        <div className="mt-1 whitespace-pre-line text-xs text-slate-600">
                          {item.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center font-semibold">
                      {item.quantity.toLocaleString("en-US")}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right">
                      {formatPiAmount(item.unitPrice, currency)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-bold">
                      {formatPiAmount(line, currency)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td colSpan={4} className="border border-slate-200 px-2 py-2 text-right text-xs font-bold uppercase text-slate-500">
                Total Amount:
              </td>
              <td className="border border-slate-200 px-2 py-2 text-right text-base font-bold text-blue-700">
                {formatPiAmount(invoice.totalAmount, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
          {invoice.termsConditions ? (
            <>
              <p className="text-[11px] font-bold uppercase text-slate-500">Terms & Conditions</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                {invoice.termsConditions}
              </p>
            </>
          ) : null}
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-right">
          <p className="text-[11px] text-slate-500">Generated By</p>
          <p className="text-sm font-bold">{invoice.creatorName}</p>
          <p className="mt-1 text-[11px] text-slate-500">{stamp(invoice.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function AddressBlock({
  title,
  text,
  strong = false,
}: {
  title: string;
  text: string;
  strong?: boolean;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">{title}</p>
      <p className={["whitespace-pre-line text-sm", strong ? "font-semibold" : ""].join(" ")}>
        {text?.trim() || "N/A"}
      </p>
    </div>
  );
}
