export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "VOID";
export type PaymentMethod = "CASH" | "BANK" | "CHEQUE" | "ONLINE" | "OTHER";

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  deliveryOrderId: string;
  deliveryNumber: string;
  customerName: string;
  invoiceDate: string;
  subtotalAmount: string | number;
  vatAmount: string | number;
  totalAmount: string | number;
  paidAmount: string | number;
  status: InvoiceStatus;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  itemName: string;
  serialNumber: string | null;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
}

export interface InvoicePayment {
  id: string;
  amount: string | number;
  method: PaymentMethod;
  referenceNumber: string | null;
  remarks: string | null;
  paidAt: string;
}

export interface InvoiceDetails extends InvoiceListItem {
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

export interface InvoiceSummary {
  unpaid: number;
  partial: number;
  paid: number;
  outstanding: string | number;
}
