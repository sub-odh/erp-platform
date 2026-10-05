export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  punchDate: string;
  inTime: string | null;
  outTime: string | null;
  duration: string | null;
  attStatus: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceListQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAttendanceResponse {
  data: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AttendancePunchInput {
  employeeId: string;
  punchDate: string;
  inTime?: string;
  outTime?: string;
}

export interface AttendanceFieldDuty {
  agenda: string;
  visitType: string;
  outTime: string;
  inTime: string | null;
}

export interface AttendanceReportRow {
  attendanceId: string | null;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string;
  inTime: string | null;
  outTime: string | null;
  duration: string | null;
  fieldDuty: AttendanceFieldDuty[];
  holidayTitle: string | null;
  holidayLabel: string | null;
  leaveName: string | null;
  status: string;
  punctuality: string | null;
  punctualityTags: string[];
}

export interface AttendanceReportQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  exclude?: string;
}

export interface AttendanceReportResponse {
  data: AttendanceReportRow[];
}

export interface AttendanceMineQuery {
  startDate?: string;
  endDate?: string;
}
