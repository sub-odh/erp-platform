"use client";

import { Building2, ChevronDown, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CaptureLeadView } from "@/components/leads/capture-lead-view";
import { LeadDeleteView } from "@/components/leads/lead-delete-view";
import { Button, Input, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import {
  createPipelineLead,
  getPipeline,
  purgePipelineLead,
  stageMeta,
  updatePipelineStage,
  PIPELINE_STAGES,
  type PipelineLead,
  type PipelineMetrics,
  type PipelineStage,
} from "@/lib/pipeline";

const SORTS = [
  ["date", "Date"],
  ["project", "Project / Company"],
  ["stage", "Stage / Progress"],
  ["deal_val", "Deal Value"],
  ["weighted", "Weighted Value"],
  ["assigned", "Assigned To"],
] as const;

export default function LeadsPage() {
  const router = useRouter();
  const [view, setView] = useState<"all" | "my">("all");
  const [sort, setSort] = useState("id");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [rows, setRows] = useState<PipelineLead[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPipeline({ view, sort, direction });
      setRows(result.items);
      setMetrics(result.metrics);
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }, [direction, sort, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const date = formatLeadDate(row.createdAt).toLowerCase();
      return [row.companyName, row.projectTitle, row.contactPerson, row.phone, row.assignedName, date]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, search]);

  function toggleSort(column: string) {
    if (sort === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(column);
    setDirection("asc");
  }

  async function changeStage(id: string, stage: PipelineStage) {
    await updatePipelineStage(id, stage);
    await load();
  }

  async function saveLead(payload: Record<string, unknown>) {
    setSaving(true);
    setSaveError(null);
    try {
      await createPipelineLead(payload);
      setCaptureOpen(false);
      await load();
    } catch (reason: unknown) {
      setSaveError(reason instanceof ApiError ? reason.message : "The lead could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await purgePipelineLead(deleteId);
      setDeleteId(null);
      await load();
    } catch (reason: unknown) {
      setDeleteError(reason instanceof ApiError ? reason.message : "The lead could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Sales Flow & Analytics Engine</h1>
          <p className="text-xs text-slate-500">Clari-inspired Revenue Intelligence Pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-200">
            <button type="button" className={`px-3 py-1 text-sm ${view === "all" ? "bg-blue-600 font-semibold text-white" : "bg-white text-slate-600"}`} onClick={() => setView("all")}>All Leads</button>
            <button type="button" className={`px-3 py-1 text-sm ${view === "my" ? "bg-blue-600 font-semibold text-white" : "bg-white text-slate-600"}`} onClick={() => setView("my")}>My Leads</button>
          </div>
          <Button onClick={() => { setSaveError(null); setCaptureOpen(true); }}>Capture New Lead</Button>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Pipeline Value" value={formatCurrency(Number(metrics?.totalPipelineValue ?? 0))} note={`${metrics?.totalOpportunities ?? 0} Total Opportunities`} accent="border-blue-600" />
        <Metric label="Weighted Pipeline Forecast" value={formatCurrency(Number(metrics?.weightedPipelineValue ?? 0))} note="Probability Adjusted" accent="border-cyan-500" />
        <Metric label="Historical Win Rate" value={`${metrics?.winRate ?? 0}%`} note={`${metrics?.wonDeals ?? 0} Closed Won Deals`} accent="border-emerald-600" />
        <Metric label="Active Flow Conversion" value={`${metrics?.stageCount ?? 7} Stage Funnel`} note="Clari Methodology" accent="border-amber-500" />
      </div>
      <div className="flex justify-end">
        <div className="w-64">
          <Input placeholder="Search leads..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {SORTS.map(([key, label]) => (
                  <th key={key} className="px-3 py-2">
                    <button type="button" onClick={() => toggleSort(key)}>
                      {label}{sort === key ? (direction === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    No sales leads recorded in the system flow yet.
                  </td>
                </tr>
              ) : visible.map((row) => {
                const meta = stageMeta(row.stage);
                const title = row.projectTitle || row.companyName || "Lead";
                return (
                  <tr key={row.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => router.push(`/leads/${row.id}`)}>
                    <td className="px-3 py-2 text-slate-500">{formatLeadDate(row.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{title}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500"><Building2 className="size-3" />{row.companyName}</div>
                      <div className="text-[11px] text-slate-500">
                        {row.contactPerson}{row.phone ? ` | ${row.phone}` : ""}
                      </div>
                    </td>
                    <td className="min-w-44 px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      <div className="relative">
                        <select
                          className={`w-full appearance-none rounded-full border border-black/10 py-0.5 pl-2 pr-7 text-xs font-bold ${meta.tone}`}
                          value={row.stage}
                          onChange={(event) => void changeStage(row.id, event.target.value as PipelineStage)}
                        >
                          {PIPELINE_STAGES.map((item) => (
                            <option key={item.name} value={item.name}>{item.name} ({item.percent}%)</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-700" />
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full ${meta.bar}`} style={{ width: `${meta.percent}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold">{formatCurrency(Number(row.dealValue))}</td>
                    <td className="px-3 py-2 font-semibold text-slate-500">{formatCurrency(Number(row.weightedValue))}</td>
                    <td className="px-3 py-2">
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">{row.assignedName}</span>
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                      {row.quotationId ? (
                        <a href={`/quotations/${row.quotationId}/print`} target="_blank" rel="noreferrer" className="mr-1 inline-flex items-center rounded border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                          <FileText className="mr-1 size-3" /> Quote
                        </a>
                      ) : (
                        <button type="button" disabled className="mr-1 inline-flex items-center rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-400" title="No quotation available">
                          <FileText className="mr-1 size-3" /> Quote
                        </button>
                      )}
                      <button type="button" className="rounded border border-slate-200 p-1 text-rose-600" title="Delete Lead" onClick={() => { setDeleteError(null); setDeleteId(row.id); }}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <CaptureLeadView open={captureOpen} saving={saving} error={saveError ?? undefined} onClose={() => setCaptureOpen(false)} onSave={(payload) => void saveLead(payload)} />
      <LeadDeleteView open={Boolean(deleteId)} loading={deleting} error={deleteError ?? undefined} onClose={() => setDeleteId(null)} onConfirm={() => void confirmDelete()} />
    </div>
  );
}

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 bg-white p-3 shadow-sm ${accent}`}>
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

function formatLeadDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}
