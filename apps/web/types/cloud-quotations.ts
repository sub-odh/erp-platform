export type CloudCurrency = "NPR" | "USD";

export interface CloudQuotationDraft {
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  termsConditions: string;
}

export interface CloudQuotationListItem {
  id: string;
  quotationNumber: string;
  customerName: string;
  quotationDate: string;
  expiryDate: string | null;
  currency: CloudCurrency;
  totalAmount: string;
}

export interface CloudQuotationItem {
  id?: string;
  serviceType: string;
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: string | number;
}

export interface CloudQuotationDetails {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string | null;
  customerName: string;
  customerAddress: string;
  currency: CloudCurrency;
  vatApplicable: number;
  subtotalAmount: string;
  discountAmount: string;
  vatAmount: string;
  totalAmount: string;
  termsConditions: string;
  items: CloudQuotationItem[];
}

export interface CloudQuotationLineInput {
  serviceType: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface SaveCloudQuotationInput {
  quotationNumber: string;
  quotationDate: string;
  expiryDate?: string;
  customerName: string;
  customerAddress?: string;
  currency: CloudCurrency;
  vatApplicable?: boolean;
  discountType?: "amount" | "percent";
  discountValue?: number;
  termsConditions?: string;
  items: CloudQuotationLineInput[];
}
