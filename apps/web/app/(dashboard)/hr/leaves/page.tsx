"use client";

import { CalendarDays, Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { Avatar } from "@/components/users/avatar";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import {
  approveLeaveRequest,
  createEmergencyLeave,
  getLeaveDashboard,
  leaveEmployeeName,
  rejectLeaveRequest,
  updateLeaveBalances,
} from "@/lib/leaves";
import type { EmployeeDirectoryItem } from "@/types/employee";
import type {
  EmergencyLeaveInput,
  LeaveBalance,
  LeaveDashboard,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@/types/leave";

const emptyDashboard: LeaveDashboard = {
  pending: [],
  history: [],
  onLeaveToday: [],
  topTakers: [],
  balances: [],
};

const leaveTypeLabels: Record<LeaveType, string> = {
  ANNUAL: "Annual",
  SICK: "Sick",
  CASUAL: "Casual",
};

const statusVariant: Record<LeaveStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const statusLabels: Record<LeaveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function LeaveManagementPage() {
  const [dashboard, setDashboard] = useState<LeaveDashboard>(emptyDashboard);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState<LeaveBalance[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [review, setReview] = useState<{
    request: LeaveRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextDashboard, nextDirectory] = await Promise.all([
        getLeaveDashboard(),
        getEmployeeDirectory(),
      ]);
      setDashboard(nextDashboard);
      setDirectory(nextDirectory);
      setBalanceDraft(nextDashboard.balances);
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
    void load();
  }, [load]);

  const query = search.trim().toLowerCase();

  const pending = useMemo(
    () => dashboard.pending.filter((row) => matchesRequest(row, query)),
    [dashboard.pending, query],
  );
  const history = useMemo(
    () => dashboard.history.filter((row) => matchesRequest(row, query)),
    [dashboard.history, query],
  );
  const onLeaveToday = useMemo(
    () => dashboard.onLeaveToday.filter((row) => matchesRequest(row, query)),
    [dashboard.onLeaveToday, query],
  );
  const topTakers = useMemo(
    () =>
      dashboard.topTakers.filter((row) =>
        leaveEmployeeName(row).toLowerCase().includes(query),
      ),
    [dashboard.topTakers, query],
  );

  async function handleSaveBalances() {
    setSubmitting(true);
    setError(null);

    try {
      await updateLeaveBalances({
        employees: balanceDraft.map((row) => ({
          employeeId: row.employeeId,
          annualLeaveBal: Number(row.annualLeaveBal),
          sickLeaveBal: Number(row.sickLeaveBal),
          casualLeaveBal: Number(row.casualLeaveBal),
          annualLeaveEnabled: row.annualLeaveEnabled,
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

  async function handleReview() {
    if (!review) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        adminComment: reviewComment.trim() || null,
      };

      if (review.action === "approve") {
        await approveLeaveRequest(review.request.id, payload);
      } else {
        await rejectLeaveRequest(review.request.id, payload);
      }

      setReview(null);
      setReviewComment("");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateDraft(index: number, patch: Partial<LeaveBalance>) {
    setBalanceDraft((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Leave Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Review requests, track who is away, and keep leave balances current.
            </p>
          </div>
        </div>
        <Button onClick={() => setEmergencyOpen(true)}>
          <Plus size={17} />
          Add Emergency Leave
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by employee, type, or reason"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && dashboard.pending.length === 0 && dashboard.balances.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Highest Leave Takers"
                description="Approved leave days across the company."
              />
              <CardContent className="space-y-3">
                {topTakers.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No approved leave has been recorded yet.
                  </p>
                ) : (
                  <TopTakersList rows={topTakers} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Employees On Leave Today"
                description="Approved leave that covers today."
              />
              <CardContent>
                {onLeaveToday.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nobody is on approved leave today.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {onLeaveToday.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <Avatar
                          firstName={row.employee.firstName}
                          lastName={row.employee.lastName}
                          src={row.employee.photoUrl}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {leaveEmployeeName(row.employee)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {leaveTypeLabels[row.leaveType]} · {formatDate(row.startDate)}
                            {row.startDate !== row.endDate
                              ? ` – ${formatDate(row.endDate)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Edit Balances"
              description="Update annual, sick, and casual balances for active employees."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBalancesOpen((open) => !open)}
                >
                  <Pencil size={14} />
                  {balancesOpen ? "Hide Balances" : "Edit Balances"}
                </Button>
              }
            />
            {balancesOpen ? (
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Employee</th>
                        <th className="px-3 py-3">Annual</th>
                        <th className="px-3 py-3">Sick</th>
                        <th className="px-3 py-3">Casual</th>
                        <th className="px-3 py-3">Annual Enabled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {balanceDraft.map((row, index) => (
                        <tr key={row.employeeId}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900">
                              {leaveEmployeeName(row)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {row.employeeCode}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step="0.5"
                              value={row.annualLeaveBal}
                              onChange={(event) =>
                                updateDraft(index, {
                                  annualLeaveBal: Number(event.target.value),
                                })
                              }
                              className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step="0.5"
                              value={row.sickLeaveBal}
                              onChange={(event) =>
                                updateDraft(index, {
                                  sickLeaveBal: Number(event.target.value),
                                })
                              }
                              className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step="0.5"
                              value={row.casualLeaveBal}
                              onChange={(event) =>
                                updateDraft(index, {
                                  casualLeaveBal: Number(event.target.value),
                                })
                              }
                              className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={row.annualLeaveEnabled}
                                onChange={(event) =>
                                  updateDraft(index, {
                                    annualLeaveEnabled: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              Enabled
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => void handleSaveBalances()}
                    loading={submitting}
                    disabled={balanceDraft.length === 0}
                  >
                    Save Balances
                  </Button>
                </div>
              </CardContent>
            ) : null}
          </Card>

          <LeaveTable
            title="Pending"
            empty="No pending leave requests match the current search."
            rows={pending}
            showActions
            onApprove={(request) => {
              setReview({ request, action: "approve" });
              setReviewComment("");
            }}
            onReject={(request) => {
              setReview({ request, action: "reject" });
              setReviewComment("");
            }}
          />

          <LeaveTable
            title="History"
            empty="No reviewed leave requests match the current search."
            rows={history}
          />
        </>
      )}

      <EmergencyLeaveModal
        open={emergencyOpen}
        employees={directory}
        submitting={submitting}
        onClose={() => setEmergencyOpen(false)}
        onSubmit={handleEmergency}
      />

      <Modal
        open={Boolean(review)}
        title={review?.action === "approve" ? "Approve Leave" : "Reject Leave"}
        description={
          review
            ? `${leaveEmployeeName(review.request.employee)} requested ${leaveTypeLabels[review.request.leaveType].toLowerCase()} leave.`
            : undefined
        }
        onClose={() => setReview(null)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setReview(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant={review?.action === "reject" ? "danger" : "success"}
              loading={submitting}
              onClick={() => void handleReview()}
            >
              {review?.action === "approve" ? "Approve Request" : "Reject Request"}
            </Button>
          </>
        }
      >
        <Textarea
          label="Admin Comment"
          hint="Optional note stored with this decision."
          value={reviewComment}
          onChange={(event) => setReviewComment(event.target.value)}
        />
      </Modal>
    </div>
  );
}

function LeaveTable({
  title,
  empty,
  rows,
  showActions = false,
  onApprove,
  onReject,
}: {
  title: string;
  empty: string;
  rows: LeaveRequest[];
  showActions?: boolean;
  onApprove?: (request: LeaveRequest) => void;
  onReject?: (request: LeaveRequest) => void;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      {rows.length === 0 ? (
        <CardContent>
          <p className="text-sm text-slate-500">{empty}</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Substitute</th>
                <th className="px-4 py-3">Balances</th>
                <th className="px-4 py-3">Status</th>
                {showActions ? (
                  <th className="px-4 py-3 text-right">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="bg-white">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={row.employee.firstName}
                        lastName={row.employee.lastName}
                        src={row.employee.photoUrl}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {leaveEmployeeName(row.employee)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.reason || "No reason given"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {leaveTypeLabels[row.leaveType]}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(row.startDate)}
                    {row.startDate !== row.endDate
                      ? ` – ${formatDate(row.endDate)}`
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.days}
                    {row.isHalfDay ? " (half day)" : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.substitute ? leaveEmployeeName(row.substitute) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    A {row.annualLeaveBal} · S {row.sickLeaveBal} · C{" "}
                    {row.casualLeaveBal}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[row.status]}>
                      {statusLabels[row.status]}
                    </Badge>
                  </td>
                  {showActions ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => onApprove?.(row)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onReject?.(row)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TopTakersList({
  rows,
}: {
  rows: LeaveDashboard["topTakers"];
}) {
  const maxDays = Math.max(...rows.map((row) => row.totalDays), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.employeeId} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar
                firstName={row.firstName}
                lastName={row.lastName}
                src={row.photoUrl}
                size="sm"
              />
              <span className="text-sm font-medium text-slate-800">
                {leaveEmployeeName(row)}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {row.totalDays} days
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.max((row.totalDays / maxDays) * 100, 6)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmergencyLeaveModal({
  open,
  employees,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  employees: EmployeeDirectoryItem[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: EmergencyLeaveInput) => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("SICK");
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState(todayIsoDate());
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [adminComment, setAdminComment] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmployeeId("");
    setLeaveType("SICK");
    setStartDate(todayIsoDate());
    setEndDate(todayIsoDate());
    setDays("1");
    setReason("");
    setAdminComment("");
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      employeeId,
      leaveType,
      startDate,
      endDate,
      days: Number(days),
      reason: reason.trim() || null,
      adminComment: adminComment.trim() || null,
    });
  }

  return (
    <Modal
      open={open}
      title="Add Emergency Leave"
      description="Log approved leave immediately and deduct the matching balance."
      onClose={onClose}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="emergency-leave-form" loading={submitting}>
            Save Emergency Leave
          </Button>
        </>
      }
    >
      <form id="emergency-leave-form" className="space-y-4" onSubmit={handleSubmit}>
        <Select
          label="Employee"
          required
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employeeFullName(employee)} ({employee.employeeCode})
            </option>
          ))}
        </Select>
        <Select
          label="Leave Type"
          required
          value={leaveType}
          onChange={(event) => setLeaveType(event.target.value as LeaveType)}
        >
          <option value="ANNUAL">Annual</option>
          <option value="SICK">Sick</option>
          <option value="CASUAL">Casual</option>
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            required
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setDays(String(inclusiveDays(event.target.value, endDate)));
            }}
          />
          <Input
            label="End Date"
            type="date"
            required
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setDays(String(inclusiveDays(startDate, event.target.value)));
            }}
          />
        </div>
        <Input
          label="Days"
          type="number"
          min={0.5}
          step="0.5"
          required
          value={days}
          onChange={(event) => setDays(event.target.value)}
        />
        <Textarea
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <Textarea
          label="Admin Comment"
          value={adminComment}
          onChange={(event) => setAdminComment(event.target.value)}
        />
      </form>
    </Modal>
  );
}

function matchesRequest(row: LeaveRequest, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    leaveEmployeeName(row.employee),
    row.employee.employeeCode,
    leaveTypeLabels[row.leaveType],
    row.reason ?? "",
    row.substitute ? leaveEmployeeName(row.substitute) : "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function inclusiveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || endDate < startDate) {
    return 1;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
