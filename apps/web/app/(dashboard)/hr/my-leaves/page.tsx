"use client";

import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { employeeFullName, getEmployeeDirectory, getMyEmployee } from "@/lib/employees";
import {
  createLeaveRequest,
  getMyLeaves,
  leaveEmployeeName,
  revokeLeaveRequest,
} from "@/lib/leaves";
import type { Employee, EmployeeDirectoryItem } from "@/types/employee";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/types/leave";

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

export default function MyLeavesPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>("SICK");
  const [startDate, setStartDate] = useState(tomorrowIsoDate());
  const [endDate, setEndDate] = useState(tomorrowIsoDate());
  const [days, setDays] = useState("1");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [substituteId, setSubstituteId] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [me, mine, people] = await Promise.all([
        getMyEmployee(),
        getMyLeaves(),
        getEmployeeDirectory(),
      ]);
      setEmployee(me);
      setRequests(mine);
      setDirectory(people);
      setLeaveType(me.annualLeaveEnabled ? "ANNUAL" : "SICK");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your leave requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const substitutes = useMemo(
    () => directory.filter((person) => person.id !== employee?.id),
    [directory, employee?.id],
  );

  function applyDateRange(nextStart: string, nextEnd: string, halfDay: boolean) {
    setStartDate(nextStart);
    setEndDate(halfDay ? nextStart : nextEnd);
    setDays(halfDay ? "0.5" : String(inclusiveDays(nextStart, nextEnd)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createLeaveRequest({
        leaveType,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        days: Number(days),
        isHalfDay,
        reason: reason.trim() || null,
        substituteId: substituteId || null,
      });
      setReason("");
      setSubstituteId("");
      setIsHalfDay(false);
      applyDateRange(tomorrowIsoDate(), tomorrowIsoDate(), false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit this leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke() {
    if (!revokeId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await revokeLeaveRequest(revokeId);
      setRevokeId(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to revoke this leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CalendarDays size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">HR & Operations</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            My Leaves
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Check your balances and request time off.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !employee ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <BalanceCard
              title="Annual"
              value={employee?.annualLeaveBal ?? 0}
              hint={
                employee?.annualLeaveEnabled
                  ? "Available annual leave days."
                  : "Annual leave is not enabled for your profile."
              }
              muted={!employee?.annualLeaveEnabled}
            />
            <BalanceCard
              title="Sick"
              value={employee?.sickLeaveBal ?? 0}
              hint="Available sick leave days."
            />
            <BalanceCard
              title="Casual"
              value={employee?.casualLeaveBal ?? 0}
              hint="Casual leave needs at least one day's notice."
            />
          </div>

          <Card>
            <CardHeader
              title="New Leave Request"
              description="Submit a request for your manager or HR to review."
            />
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <Select
                  label="Leave Type"
                  required
                  value={leaveType}
                  onChange={(event) =>
                    setLeaveType(event.target.value as LeaveType)
                  }
                >
                  {employee?.annualLeaveEnabled ? (
                    <option value="ANNUAL">Annual</option>
                  ) : null}
                  <option value="SICK">Sick</option>
                  <option value="CASUAL">Casual</option>
                </Select>
                <Select
                  label="Substitute"
                  value={substituteId}
                  onChange={(event) => setSubstituteId(event.target.value)}
                  hint="Optional cover from another active employee."
                >
                  <option value="">Select Substitute</option>
                  {substitutes.map((person) => (
                    <option key={person.id} value={person.id}>
                      {employeeFullName(person)} ({person.employeeCode})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Start Date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) =>
                    applyDateRange(event.target.value, endDate, isHalfDay)
                  }
                />
                <Input
                  label="End Date"
                  type="date"
                  required
                  disabled={isHalfDay}
                  value={isHalfDay ? startDate : endDate}
                  onChange={(event) =>
                    applyDateRange(startDate, event.target.value, false)
                  }
                />
                <Input
                  label="Days"
                  type="number"
                  min={0.5}
                  step="0.5"
                  required
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                />
                <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setIsHalfDay(next);
                      applyDateRange(startDate, endDate, next);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Half Day
                </label>
                <div className="md:col-span-2">
                  <Textarea
                    label="Reason"
                    hint={
                      leaveType === "CASUAL"
                        ? "Casual leave must start at least one day after today."
                        : "Share a short note for the reviewer."
                    }
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" loading={submitting}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="My Requests" />
            {requests.length === 0 ? (
              <CardContent>
                <p className="text-sm text-slate-500">
                  You have not submitted any leave requests yet.
                </p>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Days</th>
                      <th className="px-4 py-3">Substitute</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-slate-800">
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
                          {row.substitute
                            ? leaveEmployeeName(row.substitute)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.reason || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[row.status]}>
                            {statusLabels[row.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.status === "PENDING" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRevokeId(row.id)}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <ConfirmDialog
        open={Boolean(revokeId)}
        title="Revoke Leave Request"
        description="This pending request will be removed. Approved or rejected leave cannot be revoked here."
        confirmLabel="Revoke Request"
        destructive
        loading={submitting}
        onConfirm={() => void handleRevoke()}
        onClose={() => setRevokeId(null)}
      />
    </div>
  );
}

function BalanceCard({
  title,
  value,
  hint,
  muted = false,
}: {
  title: string;
  value: number;
  hint: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white px-5 py-4 shadow-sm ${
        muted ? "border-slate-200 opacity-70" : "border-slate-200"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function tomorrowIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function inclusiveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || endDate < startDate) {
    return 1;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
