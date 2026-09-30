"use client";

import { useEffect, useState } from "react";

import { Modal, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { getInvoiceBreakdown, getWonBreakdown, type InvoiceBreakdownRow, type WonBreakdownRow } from "@/lib/sales-reports";

export function StaffBreakdownView({
  open,
  employeeId,
  name,
  kind,
  target,
  achieved,
  start,
  end,
  onClose,
}: {
  open: boolean;
  employeeId: string;
  name: string;
  kind: "invoiced" | "crm";
  target: number;
  achieved: number;
  start: string;
  end: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceBreakdownRow[]>([]);
  const [deals, setDeals] = useState<WonBreakdownRow[]>([]);

  useEffect(() => {
    if (!open || !employeeId) return;
    let active = true;
    setLoading(true);
    setError(null);
    const request = kind === "crm"
      ? getWonBreakdown(employeeId, start, end).then((rows) => {
          if (active) setDeals(rows);
        })
      : getInvoiceBreakdown(employeeId, start, end).then((rows) => {
          if (active) setInvoices(rows);
        });
    request
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Unable to load this breakdown.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, employeeId, kind, start, end]);

  const title = `${name}'s ${kind === "crm" ? "Pipeline Breakdown" : "Achievement Breakdown"}`;
  const over = achieved > target;
  const performance = target > 0 ? Math.round((achieved / target) * 100) : 100;

  return (
    <Modal open={open} title={title} onClose={onClose} className="max-w-6xl">
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="min-h-72 overflow-x-auto rounded border border-slate-200">
          {loading ? (
            <div className="flex flex-col items-center py-16 text-sm text-slate-500">
              <Spinner />
              <p className="mt-2">Loading data...</p>
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-rose-700">{error}</p>
          ) : kind === "crm" ? (
            <WonTable rows={deals} />
          ) : (
            <InvoiceTable rows={invoices} />
          )}
        </div>
        <div className="rounded border border-slate-200 p-3 text-center">
          <h3 className="mb-3 text-sm font-semibold">Target Performance</h3>
          <Doughnut achieved={achieved} target={target} over={over} />
          <p className="mt-3 text-xs text-slate-600">
            Target: <b>{formatCurrency(target)}</b><br />
            Achieved: <b>{formatCurrency(achieved)}</b><br />
            Performance: <b>{performance}%</b>
          </p>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceTable({ rows }: { rows: InvoiceBreakdownRow[] }) {
  const total = rows.reduce((sum, row) => sum + (Number(row.grandTotal) || 0), 0);
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
        <tr>
          <th className="px-3 py-3 text-left">Date</th>
          <th className="py-3 text-left">Client</th>
          <th className="py-3 text-center">DO Number</th>
          <th className="py-3 text-left">Items (Qty)</th>
          <th className="px-3 py-3 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="py-10 text-center text-slate-500">No records found for this period.</td>
          </tr>
        ) : rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-3 py-2 whitespace-nowrap">{formatDay(row.deliveryDate)}</td>
            <td className="py-2 font-semibold">{row.customerName}</td>
            <td className="py-2 text-center"><span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5">#{row.deliveryNumber}</span></td>
            <td className="py-2 text-xs whitespace-pre-line">{row.items.length ? row.items.join("\n") : <span className="italic text-slate-400">No items listed</span>}</td>
            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(Number(row.grandTotal))}</td>
          </tr>
        ))}
        {rows.length > 0 ? (
          <tr className="border-t border-slate-300 bg-slate-50">
            <td colSpan={4} className="px-3 py-3 text-right text-[11px] font-bold uppercase">Total Achievement:</td>
            <td className="px-3 py-3 text-right font-bold text-emerald-700">{formatCurrency(total)}</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function WonTable({ rows }: { rows: WonBreakdownRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-3 py-2 text-left">Date</th>
          <th className="py-2 text-left">Company</th>
          <th className="py-2 text-left">Contact Person</th>
          <th className="py-2 text-right">Won Value</th>
          <th className="px-3 py-2 text-left">Remarks</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={5} className="py-10 text-center text-slate-500">No won deals found for this period.</td></tr>
        ) : rows.map((row, index) => (
          <tr key={`${row.updatedAt}-${index}`} className="border-t border-slate-100">
            <td className="px-3 py-2 text-xs">{formatMonth(row.updatedAt)}</td>
            <td className="py-2 text-xs font-semibold">{row.companyName}</td>
            <td className="py-2 text-xs">{row.contactPerson}</td>
            <td className="py-2 text-right font-semibold text-blue-700">{formatCurrency(Number(row.dealValue))}</td>
            <td className="px-3 py-2 text-xs italic text-slate-500">{row.dealRemarks}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Doughnut({ achieved, target, over }: { achieved: number; target: number; over: boolean }) {
  const total = over ? Math.max(achieved, 1) : Math.max(target, 1);
  const first = over ? target : achieved;
  const percent = Math.max(0, Math.min(100, (first / total) * 100));
  const colors = over ? ["#1cc88a", "#15875e"] : ["#4e73df", "#eaecf4"];
  return (
    <div className="mx-auto grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(${colors[0]} ${percent}%, ${colors[1]} 0)` }}>
      <div className="size-28 rounded-full bg-white" />
    </div>
  );
}

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatMonth(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}
