import { apiRequest } from "@/lib/api";
import type {
  HallBooking,
  HallBookingInput,
  HallInput,
  MeetingHall,
} from "@/types/hall";

export function getHalls() {
  return apiRequest<MeetingHall[]>("/hr/halls");
}

export function createHall(payload: HallInput) {
  return apiRequest<MeetingHall>("/hr/halls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHall(hallId: string, payload: Partial<HallInput>) {
  return apiRequest<MeetingHall>(`/hr/halls/${hallId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteHall(hallId: string) {
  return apiRequest<{ success: true }>(`/hr/halls/${hallId}`, {
    method: "DELETE",
  });
}

export function getHallBookings() {
  return apiRequest<HallBooking[]>("/hr/hall-bookings");
}

export function getMyHallBookings() {
  return apiRequest<HallBooking[]>("/hr/hall-bookings/mine");
}

export function createHallBooking(payload: HallBookingInput) {
  return apiRequest<HallBooking>("/hr/hall-bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function confirmHallBooking(bookingId: string) {
  return apiRequest<HallBooking>(`/hr/hall-bookings/${bookingId}/confirm`, {
    method: "POST",
  });
}

export function cancelHallBooking(bookingId: string) {
  return apiRequest<HallBooking>(`/hr/hall-bookings/${bookingId}/cancel`, {
    method: "POST",
  });
}
