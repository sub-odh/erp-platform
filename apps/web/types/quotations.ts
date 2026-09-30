export type QuotationCurrency = "NPR" | "USD";

export interface QuotationDraft {
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  termsConditions: string;
}

export interface QuotationListItem {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string | null;
  customerName: string;
  totalAmount: string;
  currency: QuotationCurrency;
  leadId: string | null;
  leadName: string | null;
  creatorName: string;
}

export interface QuotationMetrics {
  totalCount: number;
  pipelineGrossValue: string;
  expiredCount: number;
}

export interface QuotationListResponse {
  items: QuotationListItem[];
  metrics: QuotationMetrics;
}

export interface QuotationItem {
  id?: string;
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: string | number;
}

export interface QuotationDetails {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string | null;
  customerId: string | null;
  customerName: string;
  customerAddress: string;
  termsConditions: string;
  totalAmount: string;
  subtotalAmount: string;
  vatAmount: string;
  currency: QuotationCurrency;
  vatApplicable: number;
  leadId: string | null;
  leadName: string | null;
  creatorName: string;
  signatureUrl: string | null;
  amountInWords: string;
  items: QuotationItem[];
}

export interface QuotationLineInput {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface SaveQuotationInput {
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  leadId?: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  currency: QuotationCurrency;
  vatApplicable?: boolean;
  termsConditions?: string;
  items: QuotationLineInput[];
}
