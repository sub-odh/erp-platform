"use client";

import { Clock3, LogIn, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Input, Spinner } from "@/components/ui";
import {
  attendanceStatusVariant,
  checkInAttendance,
  checkOutAttendance,
  currentMonthRange,
  formatAttendanceDate,
  formatAttendanceTime,
  getMyAttendance,
  todayIsoDate,
} from "@/lib/attendance";
import type { AttendanceRecord } from "@/types/attendance";

const monthRange = currentMonthRange();

export default function MyAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [startDate, setStartDate] = useState(monthRange.startDate);
  const [endDate, setEndDate] = useState(monthRange.endDate);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayIsoDate();

  const loadRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [rangeRows, todayRows] = await Promise.all([
        getMyAttendance({ startDate, endDate }),
        today < startDate || today > endDate
          ? getMyAttendance({ startDate: today, endDate: today })
          : Promise.resolve(null),
      ]);
      setRecords(rangeRows);
      setTodayRecord(
        (todayRows ?? rangeRows).find((record) => record.punchDate === today) ??
          null,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your attendance.",
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, today]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const canCheckIn = !todayRecord?.inTime;
  const canCheckOut = Boolean(todayRecord?.inTime) && !todayRecord?.outTime;

  async function handleCheckIn(): Promise<void> {
    setActionLoading(true);
    setError(null);

    try {
      await checkInAttendance();
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to check in.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut(): Promise<void> {
    setActionLoading(true);
    setError(null);

    try {
      await checkOutAttendance();
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to check out.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Clock3 size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Self Service</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              My Attendance
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Attendance data is recorded when you check in. Contact HR if a
              punch is missing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void handleCheckIn()}
            disabled={!canCheckIn}
            loading={actionLoading && canCheckIn}
          >
            <LogIn size={16} />
            Check In
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleCheckOut()}
            disabled={!canCheckOut}
            loading={actionLoading && canCheckOut}
          >
            <LogOut size={16} />
            Check Out
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && records.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">
            No attendance in this range
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Check in for today or ask HR to record a missing punch.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">In</th>
                  <th className="px-4 py-3">Out</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="bg-white">
                    <td className="px-4 py-3 text-slate-700">
                      {formatAttendanceDate(record.punchDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAttendanceTime(record.inTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAttendanceTime(record.outTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.duration ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={attendanceStatusVariant(record.attStatus)}>
                        {record.attStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
