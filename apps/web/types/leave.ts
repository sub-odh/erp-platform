export type LeaveType = "ANNUAL" | "SICK" | "CASUAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveEmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
}

export interface LeaveSubstituteSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: LeaveEmployeeSummary;
  leaveType: LeaveType;
  substituteId: string | null;
  substitute: LeaveSubstituteSummary | null;
  referredBy: string | null;
  peerVouched: boolean;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay: boolean;
  reason: string | null;
  status: LeaveStatus;
  approvedBy: string | null;
  adminComment: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  annualLeaveBal: number;
  sickLeaveBal: number;
  casualLeaveBal: number;
  annualLeaveEnabled: boolean;
}

export interface LeaveBalance {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  annualLeaveBal: number;
  sickLeaveBal: number;
  casualLeaveBal: number;
  annualLeaveEnabled: boolean;
}

export interface LeaveTopTaker {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  totalDays: number;
}

export interface LeaveDashboard {
  pending: LeaveRequest[];
  history: LeaveRequest[];
  onLeaveToday: LeaveRequest[];
  topTakers: LeaveTopTaker[];
  balances: LeaveBalance[];
}

export interface LeaveRequestInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay?: boolean;
  reason?: string | null;
  substituteId?: string | null;
}

export interface EmergencyLeaveInput {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay?: boolean;
  reason?: string | null;
  adminComment?: string | null;
}

export interface LeaveReviewInput {
  adminComment?: string | null;
}

export interface LeaveBalanceUpdateItem {
  employeeId: string;
  annualLeaveBal: number;
  sickLeaveBal: number;
  casualLeaveBal: number;
  annualLeaveEnabled: boolean;
}

export interface LeaveBalanceUpdateInput {
  employees: LeaveBalanceUpdateItem[];
}
