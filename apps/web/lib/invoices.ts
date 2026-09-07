import { apiRequest } from "@/lib/api";
import type {
  InvoiceDetails,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceSummary,
  PaymentMethod,
} from "@/types/invoices";

const INVOICES_PATH = "/finance/invoices";

export function getInvoices(filters?: {
  search?: string;
  status?: InvoiceStatus;
}): Promise<InvoiceListItem[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  return apiRequest<InvoiceListItem[]>(
    query ? `${INVOICES_PATH}?${query}` : INVOICES_PATH,
  );
}

export function getInvoiceSummary(): Promise<InvoiceSummary> {
  return apiRequest<InvoiceSummary>(`${INVOICES_PATH}/summary`);
}

export function getInvoice(id: string): Promise<InvoiceDetails> {
  return apiRequest<InvoiceDetails>(`${INVOICES_PATH}/${id}`);
}

export function generateInvoice(deliveryOrderId: string): Promise<{
  id: string;
  invoiceNumber: string;
}> {
  return apiRequest<{ id: string; invoiceNumber: string }>(INVOICES_PATH, {
    method: "POST",
    body: JSON.stringify({ deliveryOrderId }),
  });
}

export function recordInvoicePayment(
  invoiceId: string,
  payload: {
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    remarks?: string;
  },
): Promise<InvoiceDetails> {
  return apiRequest<InvoiceDetails>(`${INVOICES_PATH}/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
