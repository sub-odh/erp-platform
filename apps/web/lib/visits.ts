import { apiRequest } from "@/lib/api";
import type {
  FieldVisit,
  FieldVisitInput,
  SupportVisit,
  SupportVisitInput,
} from "@/types/visit";

export function getSupportVisits() {
  return apiRequest<SupportVisit[]>("/hr/support-visits");
}

export function getMySupportVisits() {
  return apiRequest<SupportVisit[]>("/hr/support-visits/mine");
}

export function getSupportVisit(visitId: string) {
  return apiRequest<SupportVisit>(`/hr/support-visits/${visitId}`);
}

export function createSupportVisit(payload: SupportVisitInput) {
  return apiRequest<SupportVisit>("/hr/support-visits", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSupportVisit(
  visitId: string,
  payload: Partial<SupportVisitInput>,
) {
  return apiRequest<SupportVisit>(`/hr/support-visits/${visitId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getFieldVisits() {
  return apiRequest<FieldVisit[]>("/hr/field-visits");
}

export function getMyFieldVisits() {
  return apiRequest<FieldVisit[]>("/hr/field-visits/mine");
}

export function createFieldVisit(payload: FieldVisitInput) {
  return apiRequest<FieldVisit>("/hr/field-visits", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkInFieldVisit(visitId: string, inTime: string) {
  return apiRequest<FieldVisit>(`/hr/field-visits/${visitId}`, {
    method: "PATCH",
    body: JSON.stringify({ inTime }),
  });
}
