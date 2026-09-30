export type ProformaCurrency = "NPR" | "USD";

export interface ProformaListItem {
  id: string;
  piNumber: string;
  piDate: string;
  customerDetails: string;
  totalAmount: string;
  currency: ProformaCurrency;
  creatorName: string;
}

export interface ProformaItem {
  id?: string;
  itemName: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

export interface ProformaDraft {
  piNumber: string;
  piDate: string;
  creatorName: string;
  creatorPosition: string;
}

export interface ProformaDetails extends ProformaDraft {
  id: string;
  customerDetails: string;
  billTo: string;
  shipTo: string;
  termsConditions: string;
  totalAmount: string;
  currency: ProformaCurrency;
  createdAt: string;
  signatureUrl: string | null;
  totalInWords: string;
  items: ProformaItem[];
}

export interface SaveProformaInput {
  piNumber: string;
  piDate: string;
  customerDetails: string;
  billTo: string;
  shipTo: string;
  termsConditions?: string;
  currency: ProformaCurrency;
  items: Array<{
    itemName?: string;
    partNumber?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export const DEFAULT_PROFORMA_TERMS =
  "1. Proforma Invoice is valid for 30 days from the issue date.\n2. Payment terms: Advance or as agreed prior to shipment.\n3. Goods will be dispatched upon receipt of confirmed payment.";
