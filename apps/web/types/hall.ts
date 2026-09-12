export type HallStatus = "ACTIVE" | "MAINTENANCE";
export type HallArrangement = "THEATER" | "U_SHAPE" | "BOARDROOM" | "CLASSROOM";
export type HallBookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface MeetingHall {
  id: string;
  hallName: string;
  location: string | null;
  capacity: number | null;
  arrangementType: HallArrangement;
  status: HallStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HallInput {
  hallName: string;
  location?: string | null;
  capacity?: number | null;
  arrangementType?: HallArrangement;
  status?: HallStatus;
}

export interface HallBooking {
  id: string;
  hallId: string;
  hallName: string;
  employeeId: string;
  employeeName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  status: HallBookingStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HallBookingInput {
  hallId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}
