export type FuelStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FLAGGED"
  | "REIMBURSED";

export interface FuelRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  vehicleNo: string;
  fuelDate: string;
  amount: number;
  liters: number;
  purpose: string | null;
  status: FuelStatus;
  reimbursementStatus: string;
  paymentReference: string | null;
  reimbursedAt: string | null;
  pricePerLiter: number;
  createdAt: string;
  updatedAt: string;
}

export interface FuelListResponse {
  records: FuelRecord[];
  totals: {
    liters: number;
    amount: number;
  };
  threshold: number;
}

export interface FuelSettings {
  threshold: number;
}

export interface FuelInput {
  vehicleNo: string;
  fuelDate: string;
  amount: number;
  liters: number;
  purpose?: string | null;
}

export interface ReimburseFuelInput {
  paymentReference: string;
}
