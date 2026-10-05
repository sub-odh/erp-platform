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
  raisedByDesignation: string | null;
  verifierId: string | null;
  verifierName: string | null;
  verifierDesignation: string | null;
  currentStep: number;
  status: MemoStatus;
  verifierSignedBy: string | null;
  verifierSignedByName: string | null;
  hodSignedBy: string | null;
  hodSignedByName: string | null;
  hodDesignation: string | null;
  ceoSignedBy: string | null;
  ceoSignedByName: string | null;
  ceoDesignation: string | null;
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
