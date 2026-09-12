import { apiRequest } from "@/lib/api";
import type { Holiday, HolidayInput } from "@/types/holiday";

const PATH = "/hr/holidays";

export function getHolidays() {
  return apiRequest<Holiday[]>(PATH);
}

export function createHoliday(payload: HolidayInput) {
  return apiRequest<Holiday>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHoliday(holidayId: string, payload: Partial<HolidayInput>) {
  return apiRequest<Holiday>(`${PATH}/${holidayId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteHoliday(holidayId: string) {
  return apiRequest<{ success: true }>(`${PATH}/${holidayId}`, {
    method: "DELETE",
  });
}
