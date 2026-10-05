"use client";

import {
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Pencil,
  PlusCircle,
  Printer,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Select } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { useAuthenticatedMediaUrl } from "@/lib/media";
import {
  approveLeaveRequest,
  createEmergencyLeave,
  getLeaveDashboard,
  leaveEmployeeName,
  rejectLeaveRequest,
  updateLeaveBalances,
} from "@/lib/leaves";
import { PHP_ROLE_1 } from "@/lib/role-access";
import type { UserRole } from "@/types/auth";
import type {
  EmergencyLeaveInput,
  LeaveBalance,
  LeaveDashboard,
  LeaveRequest,
  LeaveStatus,
  LeaveTopTaker,
  LeaveType,
} from "@/types/leave";

const APPROVER_ROLES = new Set<string>([
  ...PHP_ROLE_1,
  "HR",
  "OPERATIONS",
  "MANAGER",
  "MANAGEMENT",
  "HEAD",
]);
const EMERGENCY_ROLES = new Set<string>([...PHP_ROLE_1, "HR"]);

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
};

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const emptyDashboard: LeaveDashboard = {
  pending: [],
  history: [],
  onLeaveToday: [],
  topTakers: [],
  balances: [],
};

type BalanceDraft = {
  employeeId: string;
  name: string;
  annual: string;
  sick: string;
  casual: string;
  annualEnabled: boolean;
};

type SortState = { column: number; direction: "asc" | "desc" } | null;

export default function LeaveManagementPage() {
  const [dashboard, setDashboard] = useState<LeaveDashboard>(emptyDashboard);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState<BalanceDraft[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [detail, setDetail] = useState<LeaveRequest | null>(null);
  const [pendingSort, setPendingSort] = useState<SortState>(null);
  const [historySort, setHistorySort] = useState<SortState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getLeaveDashboard();
      setDashboard(next);
      setBalanceDraft(next.balances.map(toBalanceDraft));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load leave management.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRole(getStoredUser()?.role ?? null);
    void load();
  }, [load]);

  const canApprove = role !== null && APPROVER_ROLES.has(role);
  const canEmergency = role !== null && EMERGENCY_ROLES.has(role);
  const query = search.trim().toLowerCase();

  const pending = useMemo(
    () => sortRows(dashboard.pending, pendingSort, pendingSortValue),
    [dashboard.pending, pendingSort],
  );
  const history = useMemo(
    () => sortRows(dashboard.history, historySort, historySortValue),
    [dashboard.history, historySort],
  );

  async function handleSaveBalances() {
    setSubmitting(true);
    setError(null);

    try {
      await updateLeaveBalances({
        employees: balanceDraft.map((row) => ({
          employeeId: row.employeeId,
          annualLeaveBal: Number(row.annual),
          sickLeaveBal: Number(row.sick),
          casualLeaveBal: Number(row.casual),
          annualLeaveEnabled: row.annualEnabled,
        })),
      });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save leave balances.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmergency(payload: EmergencyLeaveInput) {
    setSubmitting(true);
    setError(null);

    try {
      await createEmergencyLeave(payload);
      setEmergencyOpen(false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to log emergency leave.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(event: FormEvent) {
    event.preventDefault();

    if (!approveTarget || !approveComment.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await approveLeaveRequest(approveTarget.id, {
        adminComment: approveComment.trim(),
      });
      setApproveTarget(null);
      setApproveComment("");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve this leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await rejectLeaveRequest(rejectTarget.id, {});
      setRejectTarget(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reject this leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSort(
    current: SortState,
    column: number,
    setSort: (value: SortState) => void,
  ) {
    if (current?.column === column && current.direction === "asc") {
      setSort({ column, direction: "desc" });
      return;
    }

    setSort({ column, direction: "asc" });
  }

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <div className="mb-4 grid items-center gap-3 lg:grid-cols-3">
        <h1 className="text-[1.75rem] font-bold leading-tight text-slate-900">
          Leave Management
        </h1>
        <div className="flex overflow-hidden rounded border border-slate-300 bg-white shadow-sm">
          <span className="flex items-center border-r-0 bg-white px-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="tableSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees, reasons, or status..."
            className="h-10 w-full border-0 px-2 text-sm outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          {canEmergency ? (
            <button
              type="button"
              className="inline-flex items-center rounded bg-[#dc3545] px-2 py-1 text-sm text-white hover:bg-[#bb2d3b]"
              onClick={() => setEmergencyOpen(true)}
            >
              <PlusCircle size={14} className="mr-1" />
              Add Emergency Leave
            </button>
          ) : null}
          {canApprove ? (
            <button
              type="button"
              className="inline-flex items-center rounded bg-[#0d6efd] px-2 py-1 text-sm text-white hover:bg-[#0b5ed7]"
              onClick={() => setBalancesOpen((open) => !open)}
            >
              <Pencil size={14} className="mr-1" />
              Edit Balances
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-4 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">
            <BarChart3 size={16} className="mr-2 inline text-[#0d6efd]" />
            Highest Leave Takers (Approved Days)
          </h2>
        </div>
        <div className="p-4">
          <div className="h-[250px]">
            {loading && dashboard.topTakers.length === 0 ? null : (
              <LeaveTakersChart rows={dashboard.topTakers} />
            )}
          </div>
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-[#dc3545]">
            <Clock size={16} className="mr-2 inline" />
            Employees On Leave Today
          </h2>
        </div>
        <div className="p-4">
          {dashboard.onLeaveToday.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">
              <Info size={14} className="mr-1 inline" />
              No employees are currently on leave today.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              {dashboard.onLeaveToday.map((row) => (
                <OnLeavePerson key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>

      {canApprove && balancesOpen ? (
        <form
          className="mb-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveBalances();
          }}
        >
          <section className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">Bulk Leave Settings</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded border border-[#198754] px-2 py-0.5 text-xs text-[#198754]"
                  onClick={() =>
                    setBalanceDraft((rows) =>
                      rows.map((row) => ({ ...row, annualEnabled: true })),
                    )
                  }
                >
                  Enable All Annual
                </button>
                <button
                  type="button"
                  className="rounded border border-[#dc3545] px-2 py-0.5 text-xs text-[#dc3545]"
                  onClick={() =>
                    setBalanceDraft((rows) =>
                      rows.map((row) => ({ ...row, annualEnabled: false })),
                    )
                  }
                >
                  Disable All Annual
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-[#198754] px-2 py-1 text-sm text-white disabled:opacity-60"
                >
                  Save Changes
                </button>
              </div>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#f8f9fa]">
                  <tr>
                    <th className="py-2 pl-6 font-semibold">Employee</th>
                    <th className="px-3 py-2 font-semibold">Annual</th>
                    <th className="px-3 py-2 font-semibold">Sick</th>
                    <th className="px-3 py-2 font-semibold">Casual</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceDraft.map((row, index) => (
                    <tr key={row.employeeId} className="border-t border-slate-100">
                      <td className="py-2 pl-6">{row.name}</td>
                      <td className="px-3 py-2">
                        <div className="flex w-[140px] overflow-hidden rounded border border-slate-300">
                          <input
                            type="number"
                            step="0.50"
                            value={row.annual}
                            onChange={(event) =>
                              setBalanceDraft((rows) =>
                                rows.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, annual: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="w-full px-2 py-1 text-sm outline-none"
                          />
                          <label className="flex items-center border-l border-slate-300 bg-white px-2">
                            <input
                              type="checkbox"
                              className="annual-toggle h-4 w-4"
                              checked={row.annualEnabled}
                              onChange={(event) =>
                                setBalanceDraft((rows) =>
                                  rows.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, annualEnabled: event.target.checked }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.50"
                          value={row.sick}
                          onChange={(event) =>
                            setBalanceDraft((rows) =>
                              rows.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, sick: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="w-[75px] rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.50"
                          value={row.casual}
                          onChange={(event) =>
                            setBalanceDraft((rows) =>
                              rows.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, casual: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="w-[75px] rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </form>
      ) : null}

      <section className="mb-4 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-[#0d6efd]">Pending Approvals</h2>
        </div>
        <div className="overflow-x-auto">
          <table id="pendingTable" className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fa] text-xs uppercase">
              <tr>
                <SortHeader
                  label="Req. Date"
                  className="py-2 pl-6"
                  onClick={() => toggleSort(pendingSort, 0, setPendingSort)}
                />
                <SortHeader
                  label="Employee"
                  onClick={() => toggleSort(pendingSort, 1, setPendingSort)}
                />
                <th className="px-3 py-2 font-semibold">Type</th>
                <SortHeader
                  label="Days"
                  onClick={() => toggleSort(pendingSort, 3, setPendingSort)}
                />
                <th className="px-3 py-2 font-semibold">Peer Vouching</th>
                <th className="px-3 py-2 font-semibold">Reason</th>
                <th className="py-2 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-slate-500">
                    No pending requests
                  </td>
                </tr>
              ) : (
                pending.map((row) => {
                  const visible = rowMatches(row, query);
                  const peer = peerState(row);
                  const vouched = peer === "vouched" || peer === "auto";

                  return (
                    <tr
                      key={row.id}
                      className={`cursor-pointer border-t border-slate-100 hover:bg-black/[0.03] ${visible ? "" : "hidden"}`}
                      onClick={() => setDetail(row)}
                    >
                      <td className="py-2 pl-6">
                        <div className="text-xs text-slate-500">
                          {formatStamp(row.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-bold">
                        {leaveEmployeeName(row.employee)}
                      </td>
                      <td className="px-3 py-2">{LEAVE_TYPE_LABEL[row.leaveType]}</td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-[#0d6efd] px-2 py-0.5 text-xs font-semibold text-white">
                          {row.days.toFixed(2)} Days
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <PeerBadge state={peer} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-block max-w-[150px] truncate text-xs text-slate-500">
                          {row.reason}
                        </span>
                      </td>
                      <td
                        className="py-2 pr-6 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {canApprove ? (
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              className={`rounded px-2 py-1 text-white ${vouched ? "bg-[#198754]" : "bg-[#ffc107] text-[#212529]"}`}
                              onClick={() => {
                                setApproveTarget(row);
                                setApproveComment("");
                              }}
                            >
                              {vouched ? <Check size={14} /> : <AlertTriangle size={14} />}
                            </button>
                            <button
                              type="button"
                              className="rounded border border-[#dc3545] px-2 py-1 text-[#dc3545]"
                              onClick={() => setRejectTarget(row)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-slate-500">Leave History</h2>
          <button
            type="button"
            className="rounded border border-[#198754] px-2 py-1 text-sm text-[#198754]"
            onClick={() => void exportHistory(history)}
          >
            Export Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table id="historyTable" className="mb-0 w-full text-left text-sm">
            <thead className="bg-[#f8f9fa] text-xs">
              <tr>
                <SortHeader
                  label="Employee"
                  className="py-2 pl-6"
                  onClick={() => toggleSort(historySort, 0, setHistorySort)}
                />
                <th className="px-3 py-2 font-semibold">Type</th>
                <SortHeader
                  label="Status"
                  onClick={() => toggleSort(historySort, 2, setHistorySort)}
                />
                <th className="px-3 py-2 font-semibold">Reason</th>
                <th className="px-3 py-2 font-semibold">Approver</th>
                <SortHeader
                  label="Date"
                  className="py-2 pr-6 text-right"
                  onClick={() => toggleSort(historySort, 5, setHistorySort)}
                />
              </tr>
            </thead>
            <tbody className="text-xs">
              {history.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-black/[0.03] ${rowMatches(row, query) ? "" : "hidden"}`}
                  onClick={() => setDetail(row)}
                >
                  <td className="py-2 pl-6">{leaveEmployeeName(row.employee)}</td>
                  <td className="px-3 py-2">{LEAVE_TYPE_LABEL[row.leaveType]}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${row.status === "APPROVED" ? "bg-[#198754]" : "bg-[#dc3545]"}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-block max-w-[150px] truncate text-slate-500">
                      {row.reason ?? "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-900">
                    {row.approvedByName ?? "System"}
                  </td>
                  <td
                    className="py-2 pr-6 text-right text-slate-500"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {formatHistoryDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {emergencyOpen ? (
        <EmergencyModal
          employees={dashboard.balances}
          submitting={submitting}
          onClose={() => setEmergencyOpen(false)}
          onSubmit={handleEmergency}
        />
      ) : null}

      {approveTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-lg rounded-[20px] border border-white/30 bg-white/95 text-[#222] shadow-lg backdrop-blur"
            onSubmit={(event) => void handleApprove(event)}
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-lg font-bold text-[#0d6efd]">Approve Request</h2>
              <button type="button" onClick={() => setApproveTarget(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-3">
              {peerState(approveTarget) === "awaiting" ? (
                <div className="mb-3 rounded bg-[#fff3cd] px-3 py-2 text-sm text-[#664d03]">
                  <AlertTriangle size={14} className="mr-1 inline" />
                  <strong>Note:</strong> Peer hasn&apos;t vouched yet.
                </div>
              ) : null}
              <p className="mb-3">
                Confirm approval for <strong>{leaveEmployeeName(approveTarget.employee)}</strong>?
              </p>
              <label className="mb-1 block text-xs font-bold">
                Manager&apos;s Comment (Required)
              </label>
              <textarea
                required
                rows={3}
                value={approveComment}
                onChange={(event) => setApproveComment(event.target.value)}
                placeholder="e.g., Task verified..."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4">
              <button
                type="button"
                className="rounded bg-[#f8f9fa] px-2 py-1 text-sm"
                onClick={() => setApproveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-[#0d6efd] px-4 py-1 text-sm text-white disabled:opacity-60"
              >
                Confirm & Approve
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[20px] border border-white/30 bg-white/95 p-5 text-[#222] shadow-lg">
            <h2 className="text-lg font-bold">Reject this request?</h2>
            <p className="mt-2 text-sm text-slate-600">
              {leaveEmployeeName(rejectTarget.employee)} · {LEAVE_TYPE_LABEL[rejectTarget.leaveType]}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded bg-[#f8f9fa] px-3 py-1 text-sm"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="rounded bg-[#dc3545] px-3 py-1 text-sm text-white disabled:opacity-60"
                onClick={() => void handleReject()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detail ? <LeaveDetail row={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function OnLeavePerson({ row }: { row: LeaveRequest }) {
  const photo = useAuthenticatedMediaUrl(row.employee.photoUrl);
  const name = leaveEmployeeName(row.employee);

  return (
    <div className="w-[90px] text-center">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={name}
          className="mx-auto mb-1 h-[60px] w-[60px] rounded-full border-2 border-[#0d6efd] object-cover shadow-sm"
        />
      ) : (
        <div className="mx-auto mb-1 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[#0d6efd] bg-[#0d6efd] text-2xl font-bold text-white shadow-sm">
          {(row.employee.firstName || "E").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="truncate text-sm font-bold text-slate-900" title={name}>
        {name}
      </div>
      <span className="mt-1 inline-flex rounded border border-slate-200 bg-[#f8f9fa] px-1 text-[0.65rem] text-slate-500">
        {LEAVE_TYPE_LABEL[row.leaveType]}
      </span>
    </div>
  );
}

function PeerBadge({ state }: { state: "vouched" | "auto" | "awaiting" }) {
  if (state === "vouched") {
    return (
      <span className="inline-flex items-center rounded bg-[#198754] px-2 py-0.5 text-xs font-semibold text-white">
        <CheckCircle2 size={12} className="mr-1" /> Vouched
      </span>
    );
  }

  if (state === "auto") {
    return (
      <span className="inline-flex items-center rounded bg-[#6c757d] px-2 py-0.5 text-xs font-semibold text-white">
        <Bot size={12} className="mr-1" /> Auto-Accepted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded bg-[#ffc107] px-2 py-0.5 text-xs font-semibold text-[#212529]">
      <Clock size={12} className="mr-1" /> Awaiting Peer
    </span>
  );
}

function LeaveDetail({ row, onClose }: { row: LeaveRequest; onClose: () => void }) {
  const peer =
    row.peerVouched
      ? { label: "Vouched", className: "font-bold text-[#198754]" }
      : { label: "Pending Confirmation", className: "font-bold text-[#ffc107]" };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div
        id="leave-detail-modal"
        className="w-full max-w-lg rounded-[20px] border border-white/30 bg-white/95 text-[#222] shadow-lg"
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-lg font-bold">Leave Information</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="mb-4 text-center">
            <h3 className="mb-0 text-2xl font-bold">{leaveEmployeeName(row.employee)}</h3>
            <span className="mt-1 inline-flex rounded bg-[#212529] px-2 py-0.5 text-xs font-semibold text-white">
              {LEAVE_TYPE_LABEL[row.leaveType]}
            </span>
            <div className="mt-2 text-xs text-slate-500">
              Requested on: <strong>{formatRequested(row.createdAt)}</strong>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 text-center">
            <div className="border-r border-slate-200">
              <small className="block text-xs uppercase text-slate-500">From</small>
              <strong>{row.startDate}</strong>
            </div>
            <div>
              <small className="block text-xs uppercase text-slate-500">To</small>
              <strong>{row.endDate}</strong>
            </div>
          </div>
          <div className="mb-3 rounded bg-[#f8f9fa] p-3">
            <small className="mb-1 block text-xs uppercase text-slate-500">
              Duty Substitution
            </small>
            <p className="mb-0">
              <strong>Sub:</strong>{" "}
              {row.substitute ? leaveEmployeeName(row.substitute) : "No substitute assigned"}
            </p>
            <p className="mb-0">
              <strong>Status:</strong> <span className={peer.className}>{peer.label}</span>
            </p>
          </div>
          <div className="mb-3 rounded bg-[#f8f9fa] p-3">
            <small className="mb-1 block text-xs uppercase text-slate-500">Reason</small>
            <p className="mb-0">&quot;{row.reason || "No reason provided"}&quot;</p>
          </div>
          {row.adminComment ? (
            <div className="mb-3 rounded border-l-4 border-[#0d6efd] bg-[#e7f3ff] p-3">
              <small className="mb-1 block text-xs font-bold uppercase text-[#0d6efd]">
                Manager&apos;s Comment / Remarks
              </small>
              <p className="mb-0 text-sm text-slate-900">{row.adminComment}</p>
            </div>
          ) : null}
          <div className="px-2 text-xs text-slate-500">
            <div>
              <strong>Total Days:</strong> {row.days.toFixed(2)}
            </div>
            {row.approvedByName ? (
              <div>
                <strong>Actioned By:</strong> {row.approvedByName}
              </div>
            ) : null}
            <div>
              <strong>Final Status:</strong> {STATUS_LABEL[row.status]}
            </div>
          </div>
        </div>
        <div className="print-btn-container flex justify-end px-4 pb-4">
          <button
            type="button"
            className="inline-flex items-center rounded border border-slate-400 px-2 py-1 text-sm"
            onClick={() => window.print()}
          >
            <Printer size={14} className="mr-1" /> Print Details
          </button>
        </div>
      </div>
    </div>
  );
}

function EmergencyModal({
  employees,
  submitting,
  onClose,
  onSubmit,
}: {
  employees: LeaveBalance[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: EmergencyLeaveInput) => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("SICK");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      employeeId,
      leaveType,
      startDate,
      endDate,
      days: Number(days),
      reason: reason.trim() || null,
      adminComment: remarks.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-lg rounded-[20px] border border-white/30 bg-white/95 text-[#222] shadow-lg"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-lg font-bold text-[#dc3545]">
            <AlertTriangle size={18} className="mr-2 inline" />
            Log Emergency Leave
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-3">
          <Select
            label="Target Employee"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          >
            <option value="" disabled>
              -- Select Employee --
            </option>
            {employees.map((employee) => (
              <option key={employee.employeeId} value={employee.employeeId}>
                {leaveEmployeeName(employee)}
              </option>
            ))}
          </Select>
          <Select
            label="Leave Categorization"
            required
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value as LeaveType)}
          >
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="ANNUAL">Annual Leave</option>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-bold">
              Start Date
              <input
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-bold">
              End Date
              <input
                type="date"
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-normal"
              />
            </label>
          </div>
          <label className="block text-xs font-bold">
            Total Computed Days
            <input
              type="number"
              step="0.50"
              required
              value={days}
              onChange={(event) => setDays(event.target.value)}
              placeholder="e.g. 1.00 or 0.50"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold">
            Employee&apos;s Given Reason
            <textarea
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Admitted via ER, sudden family emergency..."
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold">
            Leave Remarks / Admin Comments
            <textarea
              rows={2}
              required
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Approved via Email/Paper Form documentation..."
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-normal"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button type="button" className="rounded bg-[#f8f9fa] px-2 py-1 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-[#dc3545] px-4 py-1 text-sm text-white disabled:opacity-60"
          >
            Insert & Deduct Balance
          </button>
        </div>
      </form>
    </div>
  );
}

function SortHeader({
  label,
  onClick,
  className = "px-3 py-2",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`${className} cursor-pointer font-semibold`} onClick={onClick}>
      {label}
      <span className="ml-1 text-[0.7rem] opacity-30">↕</span>
    </th>
  );
}

function LeaveTakersChart({ rows }: { rows: LeaveTopTaker[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    if (!canvas || !parent) {
      return;
    }

    const draw = () => {
      const width = parent.clientWidth;
      const height = 250;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(width, 1) * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const max = Math.max(...rows.map((row) => row.totalDays), 1);
      const yMax = niceMax(max);
      const padLeft = 40;
      const padRight = 12;
      const padTop = 12;
      const padBottom = 56;
      const plotWidth = Math.max(width - padLeft - padRight, 1);
      const plotHeight = height - padTop - padBottom;
      const count = Math.max(rows.length, 1);
      const slot = plotWidth / count;

      context.font = "11px sans-serif";
      context.fillStyle = "#666";
      context.textAlign = "right";
      context.textBaseline = "middle";

      for (let tick = 0; tick <= 4; tick += 1) {
        const value = (yMax / 4) * tick;
        const y = padTop + plotHeight - (value / yMax) * plotHeight;
        context.fillText(formatTick(value), padLeft - 6, y);
      }

      rows.forEach((row, index) => {
        const barWidth = Math.min(36, slot * 0.55);
        const x = padLeft + slot * index + (slot - barWidth) / 2;
        const barHeight = (row.totalDays / yMax) * plotHeight;
        const y = padTop + plotHeight - barHeight;
        context.fillStyle = "rgba(13, 110, 253, 0.7)";
        context.beginPath();
        context.roundRect(x, y, barWidth, Math.max(barHeight, 0), [5, 5, 0, 0]);
        context.fill();
        context.strokeStyle = "rgba(13, 110, 253, 1)";
        context.stroke();
        context.save();
        context.translate(x + barWidth / 2, height - 6);
        context.rotate(-0.55);
        context.fillStyle = "#666";
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(leaveEmployeeName(row), 0, 0);
        context.restore();
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [rows]);

  return <canvas ref={canvasRef} className="h-[250px] w-full" />;
}

function toBalanceDraft(row: LeaveBalance): BalanceDraft {
  return {
    employeeId: row.employeeId,
    name: leaveEmployeeName(row),
    annual: row.annualLeaveBal.toFixed(2),
    sick: row.sickLeaveBal.toFixed(2),
    casual: row.casualLeaveBal.toFixed(2),
    annualEnabled: row.annualLeaveEnabled,
  };
}

function peerState(row: LeaveRequest): "vouched" | "auto" | "awaiting" {
  if (row.peerVouched) {
    return "vouched";
  }

  const hours = (Date.now() - new Date(row.createdAt).getTime()) / 3_600_000;
  return hours >= 24 ? "auto" : "awaiting";
}

function rowMatches(row: LeaveRequest, query: string): boolean {
  if (!query) {
    return true;
  }

  return [
    leaveEmployeeName(row.employee),
    LEAVE_TYPE_LABEL[row.leaveType],
    STATUS_LABEL[row.status],
    row.reason ?? "",
    row.approvedByName ?? "",
    formatStamp(row.createdAt),
    formatHistoryDate(row.createdAt),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function pendingSortValue(row: LeaveRequest, column: number): string {
  if (column === 0) {
    return formatStamp(row.createdAt);
  }

  if (column === 1) {
    return leaveEmployeeName(row.employee);
  }

  return row.days.toFixed(2);
}

function historySortValue(row: LeaveRequest, column: number): string {
  if (column === 0) {
    return leaveEmployeeName(row.employee);
  }

  if (column === 2) {
    return STATUS_LABEL[row.status];
  }

  return formatHistoryDate(row.createdAt);
}

function sortRows(
  rows: LeaveRequest[],
  sort: SortState,
  valueAt: (row: LeaveRequest, column: number) => string,
): LeaveRequest[] {
  if (!sort) {
    return rows;
  }

  const direction = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const a = valueAt(left, sort.column).toLowerCase();
    const b = valueAt(right, sort.column).toLowerCase();
    return a < b ? -direction : a > b ? direction : 0;
  });
}

function formatStamp(value: string): string {
  const date = new Date(value);
  return `${formatHistoryDate(value)} | ${formatClock(date)}`;
}

function formatHistoryDate(value: string): string {
  const date = new Date(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
}

function formatClock(date: Date): string {
  let hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`;
}

function formatRequested(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function niceMax(value: number): number {
  if (value <= 1) {
    return 1;
  }

  const padded = value * 1.1;
  const power = 10 ** Math.floor(Math.log10(padded));
  return Math.ceil(padded / power) * power;
}

function formatTick(value: number): string {
  return String(Number(value.toFixed(2)));
}

async function exportHistory(rows: LeaveRequest[]) {
  const table = [
    ["Employee", "Type", "Status", "Reason", "Approver", "Date"],
    ...rows.map((row) => [
      leaveEmployeeName(row.employee),
      LEAVE_TYPE_LABEL[row.leaveType],
      STATUS_LABEL[row.status],
      row.reason ?? "-",
      row.approvedByName ?? "System",
      formatHistoryDate(row.createdAt),
    ]),
  ];

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
  const xlsx = (window as unknown as { XLSX: XlsxApi }).XLSX;
  const sheet = xlsx.utils.aoa_to_sheet(table);
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(book, sheet, "History");
  xlsx.writeFile(book, "Leave_Report.xlsx");
}

type XlsxApi = {
  utils: {
    aoa_to_sheet: (rows: string[][]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (book: unknown, sheet: unknown, name: string) => void;
  };
  writeFile: (book: unknown, name: string) => void;
};

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`);

  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to export the leave report."));
    document.body.appendChild(script);
  });
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #leave-detail-modal, #leave-detail-modal * { visibility: visible; }
  #leave-detail-modal { position: absolute; left: 0; top: 0; width: 100%; }
  .print-btn-container, .btn-close { display: none !important; }
}
`;
