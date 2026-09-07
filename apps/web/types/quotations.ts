import type { PaginationMeta } from "@/types/customer";

export type QuotationStatus =
  "ACTIVE" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export interface QuotationItem {
  id: string;
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
export interface QuotationListItem {
  id: string;
  quotationNumber: string;
  issueDate: string;
  expiryDate: string;
  status: QuotationStatus;
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
  customerId: string;
  customerName: string;
  customerCode: string;
  createdAt: string;
}
export interface QuotationDetails extends QuotationListItem {
  destinationAddress: string | null;
  terms: string | null;
  customerEmail: string | null;
  items: QuotationItem[];
}
export interface QuotationListResponse {
  data: QuotationListItem[];
  pagination: PaginationMeta;
}
export interface CreateQuotationInput {
  customerId: string;
  issueDate: string;
  expiryDate: string;
  destinationAddress?: string | null;
  terms?: string | null;
  items: Array<{
    itemName: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}
