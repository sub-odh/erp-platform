import { apiRequest } from "@/lib/api";
import type {
  EmergencyLeaveInput,
  LeaveBalanceUpdateInput,
  LeaveDashboard,
  LeaveRequest,
  LeaveRequestInput,
  LeaveReviewInput,
} from "@/types/leave";

const PATH = "/hr/leaves";

export function getLeaveDashboard() {
  return apiRequest<LeaveDashboard>(PATH);
}

export function getMyLeaves() {
  return apiRequest<LeaveRequest[]>(`${PATH}/mine`);
}

export function createLeaveRequest(payload: LeaveRequestInput) {
  return apiRequest<LeaveRequest>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createEmergencyLeave(payload: EmergencyLeaveInput) {
  return apiRequest<LeaveRequest>(`${PATH}/emergency`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveLeaveRequest(
  requestId: string,
  payload: LeaveReviewInput = {},
) {
  return apiRequest<LeaveRequest>(`${PATH}/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rejectLeaveRequest(
  requestId: string,
  payload: LeaveReviewInput = {},
) {
  return apiRequest<LeaveRequest>(`${PATH}/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function revokeLeaveRequest(requestId: string) {
  return apiRequest<{ success: true }>(`${PATH}/${requestId}`, {
    method: "DELETE",
  });
}

export function updateLeaveBalances(payload: LeaveBalanceUpdateInput) {
  return apiRequest<{ success: true }>(`${PATH}/balances`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function leaveEmployeeName(person: {
  firstName: string;
  lastName: string;
}): string {
  return `${person.firstName} ${person.lastName}`.trim();
}
