export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ReimbursementStatus = "PENDING" | "PAID";

export interface TadaExpense {
  id: string;
  employeeId: string;
  employeeName: string;
  travelDate: string;
  origin: string | null;
  destination: string | null;
  amount: number;
  purpose: string | null;
  status: ExpenseStatus;
  remarks: string | null;
  reimbursementStatus: ReimbursementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TadaInput {
  travelDate: string;
  origin: string;
  destination: string;
  amount: number;
  purpose?: string | null;
}

export interface ReviewTadaInput {
  remarks?: string | null;
}
