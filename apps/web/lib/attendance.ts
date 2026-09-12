import { apiRequest } from "@/lib/api";
import { toIsoDate } from "@/lib/nepali-date";
import type {
  AttendanceListQuery,
  AttendanceMineQuery,
  AttendancePunchInput,
  AttendanceRecord,
  AttendanceReportQuery,
  AttendanceReportResponse,
  PaginatedAttendanceResponse,
} from "@/types/attendance";

const PATH = "/hr/attendance";

function queryString(
  query: AttendanceListQuery | AttendanceReportQuery | AttendanceMineQuery,
): string {
  const params = new URLSearchParams();

  if ("search" in query && query.search) params.set("search", query.search);
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  if ("page" in query && query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if ("limit" in query && query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if ("exclude" in query && query.exclude) params.set("exclude", query.exclude);

  const value = params.toString();
  return value ? `?${value}` : "";
}

export function getAttendance(query: AttendanceListQuery = {}) {
  return apiRequest<PaginatedAttendanceResponse>(`${PATH}${queryString(query)}`);
}

export function createAttendance(payload: AttendancePunchInput) {
  return apiRequest<AttendanceRecord>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAttendance(
  attendanceId: string,
  payload: Pick<AttendancePunchInput, "inTime" | "outTime">,
) {
  return apiRequest<AttendanceRecord>(`${PATH}/${attendanceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAttendance(attendanceId: string) {
  return apiRequest<{ success: true }>(`${PATH}/${attendanceId}`, {
    method: "DELETE",
  });
}

export function checkInAttendance() {
  return apiRequest<AttendanceRecord>(`${PATH}/check-in`, {
    method: "POST",
  });
}

export function checkOutAttendance() {
  return apiRequest<AttendanceRecord>(`${PATH}/check-out`, {
    method: "POST",
  });
}

export function getMyAttendance(query: AttendanceMineQuery = {}) {
  return apiRequest<AttendanceRecord[]>(`${PATH}/mine${queryString(query)}`);
}

export function getAttendanceReport(query: AttendanceReportQuery = {}) {
  return apiRequest<AttendanceReportResponse>(
    `${PATH}/report${queryString(query)}`,
  );
}

export function attendanceEmployeeName(record: {
  firstName: string;
  lastName: string;
}): string {
  return `${record.firstName} ${record.lastName}`.trim();
}

export function formatAttendanceTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value.slice(0, 5);
}

export function formatAttendanceDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function currentMonthRange(anchor = new Date()): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

export function todayIsoDate(anchor = new Date()): string {
  return toIsoDate(anchor);
}

export function attendanceStatusVariant(
  status: string,
): "success" | "danger" | "warning" | "purple" | "default" {
  if (status === "Present") return "success";
  if (status === "Absent") return "danger";
  if (status === "Holiday + Present") return "purple";
  if (status === "Holiday") return "warning";
  return "default";
}

export function punctualityVariant(
  value: string | null,
): "success" | "danger" | "primary" | "default" {
  if (value === "On Time") return "success";
  if (value === "Late") return "danger";
  if (value === "Early") return "primary";
  return "default";
}
