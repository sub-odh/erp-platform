export type SupportVisitType = "REMOTE" | "ONCALL" | "ONPREMISE";
export type SupportVisitStatus = "PENDING" | "ONGOING" | "RESOLVED" | "ESCALATED";
export type FieldVisitType =
  | "CLIENT_MEETING"
  | "TECHNICAL_SUPPORT"
  | "BANK"
  | "CUSTOMS"
  | "OTHER";

export interface SupportVisit {
  id: string;
  visitNumber: string;
  customerId: string | null;
  clientName: string;
  deptName: string | null;
  technicianId: string | null;
  technicianName: string | null;
  teamMembers: string | null;
  visitDate: string;
  clientCallTime: string | null;
  timeStarted: string | null;
  timeEnded: string | null;
  totalHours: string | null;
  visitType: SupportVisitType;
  category: string | null;
  priority: string | null;
  issueDescription: string | null;
  actionTaken: string | null;
  partsUsed: string | null;
  status: SupportVisitStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportVisitInput {
  clientName: string;
  customerId?: string | null;
  deptName?: string | null;
  visitDate: string;
  clientCallTime?: string | null;
  timeStarted?: string | null;
  timeEnded?: string | null;
  totalHours?: string | null;
  visitType?: SupportVisitType;
  category?: string | null;
  priority?: string | null;
  issueDescription?: string | null;
  actionTaken?: string | null;
  partsUsed?: string | null;
  status?: SupportVisitStatus;
  teamMembers?: string | null;
  technicianId?: string | null;
}

export interface FieldVisit {
  id: string;
  employeeId: string;
  employeeName: string;
  agenda: string;
  visitType: FieldVisitType;
  outTime: string;
  inTime: string | null;
  remarks: string | null;
  visitDate: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FieldVisitInput {
  agenda: string;
  visitType: FieldVisitType;
  outTime: string;
  inTime?: string | null;
  remarks?: string | null;
  visitDate: string;
}
