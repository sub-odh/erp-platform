export type TenderUrgency = "OVERDUE" | "DUE_SOON" | "UPCOMING";

export interface Tender {
  id: string;
  title: string;
  submissionDate: string;
  closingDate: string | null;
  details: string | null;
  urgency: TenderUrgency;
  /* Closing date has passed, mirroring the legacy "[ENDED]" marker. */
  ended: boolean;
  createdAt: string;
}

export interface CreateTenderPayload {
  title: string;
  submissionDate: string;
  closingDate?: string | null;
  details?: string | null;
}

export type UpdateTenderPayload = Partial<CreateTenderPayload>;

export type GuaranteeType = "BG" | "PG";
export type GuaranteeStatus = "ACTIVE" | "RELEASED";

export interface Guarantee {
  id: string;
  guaranteeType: GuaranteeType;
  clientName: string;
  tenderDetails: string;
  bankNameBranch: string;
  amount: string;
  submissionDate: string;
  expiryDate: string;
  assignedPerson: string | null;
  documentUrl: string | null;
  status: GuaranteeStatus;
  releaseDate: string | null;
  releaseRemarks: string | null;
  expiringSoon: boolean;
  expired: boolean;
}

export interface GuaranteeListResponse {
  items: Guarantee[];
  summary: {
    activeCount: number;
    activeAmount: string;
    expiringSoonCount: number;
    releasedCount: number;
  };
}

export interface CreateGuaranteePayload {
  guaranteeType: GuaranteeType;
  clientName: string;
  tenderDetails: string;
  bankNameBranch: string;
  amount: number;
  submissionDate: string;
  expiryDate: string;
  assignedPerson?: string | null;
  documentUrl?: string | null;
}

export interface ReleaseGuaranteePayload {
  releaseDate: string;
  releaseRemarks?: string | null;
}

export interface UploadedDocument {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}
