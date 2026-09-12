export type MemoStatus =
  | "PENDING"
  | "VERIFIED"
  | "CONFIRMED"
  | "APPROVED"
  | "REJECTED";

export interface MemoAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  raisedBy: string;
  raisedByName: string;
  verifierId: string | null;
  verifierName: string | null;
  currentStep: number;
  status: MemoStatus;
  verifierSignedBy: string | null;
  verifierSignedByName: string | null;
  hodSignedBy: string | null;
  hodSignedByName: string | null;
  ceoSignedBy: string | null;
  ceoSignedByName: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: MemoAttachment[];
}

export interface MemoInput {
  title: string;
  content: string;
  verifierId: string;
}
