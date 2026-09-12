import { apiRequest } from "@/lib/api";
import type {
  FuelInput,
  FuelListResponse,
  FuelRecord,
  FuelSettings,
  ReimburseFuelInput,
} from "@/types/fuel";

const PATH = "/hr/fuel";

export function getFuelRecords() {
  return apiRequest<FuelListResponse>(PATH);
}

export function getMyFuelRecords() {
  return apiRequest<FuelRecord[]>(`${PATH}/mine`);
}

export function getFuelSettings() {
  return apiRequest<FuelSettings>(`${PATH}/settings`);
}

export function updateFuelSettings(payload: FuelSettings) {
  return apiRequest<FuelSettings>(`${PATH}/settings`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createFuelRecord(payload: FuelInput) {
  return apiRequest<FuelRecord>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveFuelRecord(recordId: string) {
  return apiRequest<FuelRecord>(`${PATH}/${recordId}/approve`, {
    method: "POST",
  });
}

export function rejectFuelRecord(recordId: string) {
  return apiRequest<FuelRecord>(`${PATH}/${recordId}/reject`, {
    method: "POST",
  });
}

export function reimburseFuelRecord(
  recordId: string,
  payload: ReimburseFuelInput,
) {
  return apiRequest<FuelRecord>(`${PATH}/${recordId}/reimburse`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
