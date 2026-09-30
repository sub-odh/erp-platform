"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollectPaymentView } from "@/components/payments/collect-payment-view";
import { ReminderConfirmView } from "@/components/payments/reminder-confirm-view";
import { VoidBalanceView } from "@/components/payments/void-balance-view";
import { Button, Input, Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import {
  collectRecovery,
  exportRecoveries,
  getRecoveries,
  remindRecovery,
  voidRecovery,
  type RecoveryList,
  type RecoveryRow,
} from "@/lib/recoveries";

export default function PaymentsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "";
  const sort = params.get("sort") ?? "created_at";
  const order = params.get("order") === "ASC" ? "ASC" : "DESC";
  const page = Number(params.get("page") ?? "1") || 1;
  const limit = Number(params.get("limit") ?? "30") || 30;
  const [draft, setDraft] = useState(search);
  const [report, setReport] = useState<RecoveryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "danger">("success");
  const [collect, setCollect] = useState<RecoveryRow | null>(null);
  const [voiding, setVoiding] = useState<RecoveryRow | null>(null);
  const [reminding, setReminding] = useState<RecoveryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await getRecoveries({ search, status, sort, order, page, limit }));
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Unable to load recoveries.");
    } finally {
      setLoading(false);
    }
  }, [limit, order, page, search, sort, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function push(next: Record<string, string | number | undefined>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") query.delete(key);
      else query.set(key, String(value));
    }
    router.push(`/payments?${query.toString()}`);
  }

  function toggleSort(column: string) {
    const next = sort === column && order === "ASC" ? "DESC" : "ASC";
    push({ sort: column, order: column === sort ? next : "ASC", page: 1 });
  }

  async function download() {
    const file = await exportRecoveries({ search, status, sort, order });
    const blob = new Blob([file.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  const start = ((report?.page ?? 1) - 1) * (report?.limit ?? limit);

  return (
    <div className="space-y-4">
      {notice ? (
        <div className={`rounded-xl px-4 py-3 text-sm ${noticeTone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
          {notice}
          <button type="button" className="float-right" onClick={() => setNotice(null)}>×</button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-800">Recovery Dashboard</h1>
          <p className="text-xs text-slate-400">
            Outstanding: <span className="text-lg font-bold text-rose-600">{formatCurrency(report?.outstanding ?? 0)}</span>
          </p>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            push({ search: draft, page: 1 });
          }}
        >
          <Input placeholder="Search..." value={draft} onChange={(event) => setDraft(event.target.value)} />
          <Select value={status} onChange={(event) => push({ status: event.target.value, page: 1 })}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </Select>
          <Button type="submit" size="sm">Filter</Button>
          <Button type="button" size="sm" variant="success" onClick={() => void download()}>Export CSV</Button>
        </form>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Chip label="Pending Recovery" value={report?.counts.Pending ?? 0} active={status === "Pending"} tone="bg-rose-50 text-rose-600" onClick={() => push({ status: "Pending", page: 1 })} />
        <Chip label="Partial Recovery" value={report?.counts.Partial ?? 0} active={status === "Partial"} tone="bg-amber-50 text-amber-700" onClick={() => push({ status: "Partial", page: 1 })} />
        <Chip label="Full Recovery" value={report?.counts.Paid ?? 0} active={status === "Paid"} tone="bg-emerald-50 text-emerald-700" onClick={() => push({ status: "Paid", page: 1 })} />
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading || !report ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {(report.totalPages > 1 || report.totalRows > 10) ? (
            <Pager page={report.page} totalPages={report.totalPages} limit={report.limit} onLimit={(value) => push({ limit: value, page: 1 })} onPage={(value) => push({ page: value })} />
          ) : null}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm font-semibold">
              <span>{report.totalRows} Records (Page {report.page} of {report.totalPages})</span>
              {search || status ? (
                <button type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => { setDraft(""); push({ search: "", status: "", page: 1 }); }}>Clear Filter</button>
              ) : null}
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-2">S.No.</th>
                    <th className="px-3 py-2"><button type="button" onClick={() => toggleSort("created_at")}>Date{sort === "created_at" ? (order === "ASC" ? " ↑" : " ↓") : ""}</button></th>
                    <th className="px-3 py-2"><button type="button" onClick={() => toggleSort("do_number")}>DO Number{sort === "do_number" ? (order === "ASC" ? " ↑" : " ↓") : ""}</button></th>
                    <th className="px-3 py-2"><button type="button" onClick={() => toggleSort("client")}>Customer{sort === "client" ? (order === "ASC" ? " ↑" : " ↓") : ""}</button></th>
                    <th className="px-3 py-2 text-center">Aging</th>
                    <th className="px-3 py-2 text-right"><button type="button" onClick={() => toggleSort("balance")}>Balance Due{sort === "balance" ? (order === "ASC" ? " ↑" : " ↓") : ""}</button></th>
                    <th className="px-3 py-2 text-center"><button type="button" onClick={() => toggleSort("status")}>State{sort === "status" ? (order === "ASC" ? " ↑" : " ↓") : ""}</button></th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">No recovery records found.</td></tr>
                  ) : report.items.map((row, index) => {
                    const overdue = row.agingDays >= 14 && row.status !== "Paid" && !row.voided;
                    return (
                      <tr key={row.id} className={`border-t border-slate-100 ${row.voided ? "bg-slate-100 opacity-60" : row.status === "Paid" ? "bg-emerald-50" : overdue ? "bg-rose-50" : ""}`}>
                        <td className="px-4 py-2 text-xs text-slate-400">{start + index + 1}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
                        <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">#{row.deliveryNumber}</td>
                        <td className="px-3 py-2 font-semibold">{row.customerName}</td>
                        <td className="px-3 py-2 text-center">
                          {overdue ? <span className="animate-pulse text-rose-600" title={`Overdue by ${row.agingDays} days`}>{row.agingDays}d</span> : <span className="text-xs text-slate-400">{row.agingDays}d</span>}
                        </td>
                        <td className={`px-3 py-2 text-right font-semibold ${row.voided ? "text-slate-400 line-through" : row.status === "Paid" ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(row.balance)}</td>
                        <td className="px-3 py-2 text-center">
                          {row.voided ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-600">VOIDED</span> : (
                            <span className={`rounded-full px-3 py-1 text-[10px] ${row.status === "Paid" ? "bg-emerald-50 text-emerald-700" : row.status === "Partial" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{row.status}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap justify-center gap-1">
                            {report.canCollect && row.status !== "Paid" && !row.voided ? (
                              <>
                                <button type="button" className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white" onClick={() => { setActionError(null); setCollect(row); }}>Collect</button>
                                <button type="button" className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700" title="Transmit Recovery Notice via Email" onClick={() => setReminding(row)}>Email</button>
                                <button type="button" className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700" onClick={() => { setActionError(null); setVoiding(row); }}>Void</button>
                              </>
                            ) : null}
                            <Link href={`/payments/${row.id}/statement`} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">Statement</Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <CollectPaymentView
        key={collect?.id ?? "collect"}
        open={Boolean(collect)}
        deliveryNumber={collect?.deliveryNumber ?? ""}
        balance={collect?.balance ?? 0}
        saving={saving}
        error={actionError ?? undefined}
        onClose={() => setCollect(null)}
        onSave={(payload) => {
          if (!collect) return;
          setSaving(true);
          setActionError(null);
          void collectRecovery(collect.id, payload)
            .then(() => { setCollect(null); void load(); })
            .catch((reason: unknown) => setActionError(reason instanceof ApiError ? reason.message : "The payment could not be posted."))
            .finally(() => setSaving(false));
        }}
      />
      <VoidBalanceView
        key={voiding?.id ?? "void"}
        open={Boolean(voiding)}
        deliveryNumber={voiding?.deliveryNumber ?? ""}
        loading={saving}
        error={actionError ?? undefined}
        onClose={() => setVoiding(null)}
        onConfirm={(password) => {
          if (!voiding) return;
          setSaving(true);
          setActionError(null);
          void voidRecovery(voiding.id, password)
            .then((result) => {
              setVoiding(null);
              setNoticeTone("success");
              setNotice(result.message);
              void load();
            })
            .catch((reason: unknown) => setActionError(reason instanceof ApiError ? reason.message : "Invalid password. Action denied."))
            .finally(() => setSaving(false));
        }}
      />
      <ReminderConfirmView
        open={Boolean(reminding)}
        deliveryNumber={reminding?.deliveryNumber ?? ""}
        loading={saving}
        onClose={() => setReminding(null)}
        onConfirm={() => {
          if (!reminding) return;
          setSaving(true);
          void remindRecovery(reminding.id)
            .then(() => {
              setNoticeTone("success");
              setNotice(`Manual recovery notice for Delivery Order #${reminding.deliveryNumber} triggered and successfully logged.`);
              setReminding(null);
            })
            .catch((reason: unknown) => {
              setNoticeTone("danger");
              setNotice(`Notification Pipeline Alert: ${reason instanceof ApiError ? reason.message : "The notice could not be sent."}`);
              setReminding(null);
            })
            .finally(() => setSaving(false));
        }}
      />
    </div>
  );
}

function Chip({ label, value, active, tone, onClick }: { label: string; value: number; active: boolean; tone: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm ${active ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
      <span className={`grid size-11 place-items-center rounded-xl text-sm font-bold ${tone}`}>{value}</span>
      <span>
        <span className="block text-xl font-extrabold leading-none">{value}</span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      </span>
    </button>
  );
}

function Pager({ page, totalPages, limit, onLimit, onPage }: { page: number; totalPages: number; limit: number; onLimit: (value: number) => void; onPage: (value: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-400">
        Show:
        <span className="relative">
          <select className="appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs text-slate-800" value={limit} onChange={(event) => onLimit(Number(event.target.value))}>
            {[10, 20, 30, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-700" />
        </span>
      </label>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1 text-xs">
          <button type="button" disabled={page <= 1} className="rounded-full bg-slate-100 px-3 py-1 disabled:opacity-40" onClick={() => onPage(page - 1)}>Previous</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
            <button key={value} type="button" className={`grid size-7 place-items-center rounded-full ${value === page ? "bg-slate-900 font-bold text-white" : "bg-slate-100"}`} onClick={() => onPage(value)}>{value}</button>
          ))}
          <button type="button" disabled={page >= totalPages} className="rounded-full bg-slate-100 px-3 py-1 disabled:opacity-40" onClick={() => onPage(page + 1)}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
