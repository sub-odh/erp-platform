"use client";

import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { getRecoveries, getTargetReport, type RecoveryRow, type TargetEmployee, type TargetReport } from "@/lib/sales-reports";

export default function TargetAchievementPage() {
  const [report, setReport] = useState<TargetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"card" | "list">("card");
  const [selected, setSelected] = useState<{ employee: TargetEmployee; range: "monthly" | "yearly" } | null>(null);

  useEffect(() => {
    let active = true;
    getTargetReport()
      .then((result) => {
        if (active) setReport(result);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Unable to load target achievement.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function open(employee: TargetEmployee, range: "monthly" | "yearly") {
    if (!employee.canViewBreakdown) return;
    setSelected({ employee, range });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Sales Target Achievement</h1>
          <p className="text-sm text-slate-500">Track real-time monthly and yearly target performance.</p>
        </div>
        <div className="flex overflow-hidden rounded-md border border-blue-200 shadow-sm">
          <button type="button" className={`px-3 py-1.5 text-sm ${view === "card" ? "bg-blue-600 text-white" : "bg-white text-blue-700"}`} onClick={() => setView("card")}>Card View</button>
          <button type="button" className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-blue-600 text-white" : "bg-white text-blue-700"}`} onClick={() => setView("list")}>List View</button>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <div className="flex justify-center py-16"><Spinner /></div> : null}
      {!loading && report && report.employees.length === 0 ? (
        <p className="py-16 text-center text-lg text-slate-500">No employees currently have target tracking enabled.</p>
      ) : null}
      {report && view === "card" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.employees.map((employee) => (
            <article key={employee.id} className="rounded-xl bg-white p-4 text-center shadow-sm">
              <Avatar employee={employee} large />
              <h2 className="mt-3 font-semibold">{employee.firstName} {employee.lastName}</h2>
              <span className="mb-3 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{employee.designation}</span>
              <Progress employee={employee} range="monthly" onOpen={open} />
              <Progress employee={employee} range="yearly" onOpen={open} />
            </article>
          ))}
        </div>
      ) : null}
      {report && view === "list" ? (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="py-3">Department</th>
                <th className="py-3">Monthly Performance</th>
                <th className="py-3">Yearly Performance</th>
              </tr>
            </thead>
            <tbody>
              {report.employees.map((employee) => (
                <tr key={employee.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar employee={employee} />
                      <div>
                        <div className="font-semibold">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-slate-500">{employee.employeeCode}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.department}</td>
                  <td className="min-w-56"><Compact employee={employee} range="monthly" onOpen={open} /></td>
                  <td className="min-w-56"><Compact employee={employee} range="yearly" onOpen={open} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <RecoveryView
        open={Boolean(selected)}
        employee={selected?.employee ?? null}
        range={selected?.range ?? "monthly"}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function Avatar({ employee, large = false }: { employee: TargetEmployee; large?: boolean }) {
  const size = large ? "mx-auto size-24" : "size-10";
  if (employee.photoUrl) {
    return <AuthenticatedImage src={employee.photoUrl} alt="" className={`${size} rounded-full border-[3px] border-slate-200 object-cover`} />;
  }
  return (
    <div className={`${size} grid place-items-center rounded-full border-[3px] border-slate-200 bg-slate-100 font-semibold text-slate-600`}>
      {(employee.firstName || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function Progress({
  employee,
  range,
  onOpen,
}: {
  employee: TargetEmployee;
  range: "monthly" | "yearly";
  onOpen: (employee: TargetEmployee, range: "monthly" | "yearly") => void;
}) {
  const yearly = range === "yearly";
  const percent = yearly ? employee.yearlyPct : employee.monthlyPct;
  const achieved = yearly ? employee.yearlyAchieved : employee.monthlyAchieved;
  const target = yearly ? employee.yearlySalesTarget : employee.salesTarget;
  return (
    <button
      type="button"
      disabled={!employee.canViewBreakdown}
      className={`mb-3 w-full rounded border border-slate-200 bg-slate-50 p-2 text-left ${employee.canViewBreakdown ? "cursor-pointer hover:shadow" : "cursor-default"}`}
      onClick={() => onOpen(employee, range)}
    >
      <div className="mb-1 flex justify-between text-xs font-semibold uppercase text-slate-500">
        <span>{yearly ? "Yearly Target" : "Monthly Target"}</span>
        <span className={yearly ? "text-emerald-600" : "text-blue-700"}>{percent}%</span>
      </div>
      <div className="mb-2 h-2.5 overflow-hidden rounded bg-slate-200">
        <div className={`h-full ${yearly ? "bg-emerald-600" : "bg-blue-600"}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Achieved: <strong>{formatCurrency(achieved)}</strong></span>
        <span>Target: <strong>{formatCurrency(target)}</strong></span>
      </div>
    </button>
  );
}

function Compact({
  employee,
  range,
  onOpen,
}: {
  employee: TargetEmployee;
  range: "monthly" | "yearly";
  onOpen: (employee: TargetEmployee, range: "monthly" | "yearly") => void;
}) {
  const yearly = range === "yearly";
  const percent = yearly ? employee.yearlyPct : employee.monthlyPct;
  const achieved = yearly ? employee.yearlyAchieved : employee.monthlyAchieved;
  const target = yearly ? employee.yearlySalesTarget : employee.salesTarget;
  return (
    <button type="button" disabled={!employee.canViewBreakdown} className="w-full p-1 text-left" onClick={() => onOpen(employee, range)}>
      <div className="mb-1 flex justify-between text-xs font-semibold">
        <span>{formatCurrency(achieved)} / {formatCurrency(target)}</span>
        <span className={yearly ? "text-emerald-600" : "text-blue-700"}>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-slate-200">
        <div className={`h-full ${yearly ? "bg-emerald-600" : "bg-blue-600"}`} style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
}

function RecoveryView({
  open,
  employee,
  range,
  onClose,
}: {
  open: boolean;
  employee: TargetEmployee | null;
  range: "monthly" | "yearly";
  onClose: () => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [applied, setApplied] = useState({ start: "", end: "" });
  const [rows, setRows] = useState<RecoveryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !employee) return;
    setStart("");
    setEnd("");
    setApplied({ start: "", end: "" });
  }, [open, employee, range]);

  useEffect(() => {
    if (!open || !employee) return;
    let active = true;
    setLoading(true);
    setError(null);
    getRecoveries(employee.id, range, applied.start, applied.end)
      .then((result) => {
        if (active) setRows(result);
      })
      .catch(() => {
        if (active) setError("Failed to load recovery details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, employee, range, applied]);

  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return (
    <Modal
      open={open}
      title={`${employee?.firstName ?? ""} ${employee?.lastName ?? ""} - ${range.toUpperCase()} Recovery Breakdown`}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="mb-3 grid items-end gap-2 rounded border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto]">
        <Input label="Start Date" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        <Input label="End Date" type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        <div className="flex gap-2">
          <Button type="button" onClick={() => setApplied({ start, end })}>Apply</Button>
          <Button type="button" variant="outline" onClick={() => { setStart(""); setEnd(""); setApplied({ start: "", end: "" }); }}>Reset</Button>
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <Spinner />
          <p className="mt-2">Loading payment recovery details...</p>
        </div>
      ) : (
        <table className="w-full border border-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">DO #</th>
              <th className="px-2 py-2 text-left">Invoice Date</th>
              <th className="px-2 py-2 text-left">Recovery Date</th>
              <th className="px-2 py-2 text-left">Method</th>
              <th className="px-2 py-2 text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-rose-700">{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-500">No recovered payments found.</td></tr>
            ) : rows.map((row, index) => (
              <tr key={`${row.deliveryNumber}-${row.recoveryDate}-${index}`} className="border-t border-slate-200">
                <td className="px-2 py-2 font-semibold">{row.deliveryNumber}</td>
                <td className="px-2 py-2">{row.invoiceDate || "N/A"}</td>
                <td className="px-2 py-2">{row.recoveryDate}</td>
                <td className="px-2 py-2"><span className="rounded bg-slate-500 px-2 py-0.5 text-xs text-white">{row.method}</span></td>
                <td className="px-2 py-2 text-right font-semibold">{formatCurrency(Number(row.amount))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
              <td colSpan={4} className="px-2 py-2 text-right">Total Recovered:</td>
              <td className="px-2 py-2 text-right text-blue-700">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </Modal>
  );
}
