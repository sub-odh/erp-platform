import { apiRequest } from "@/lib/api";
import type {
  ProformaDetails,
  ProformaDraft,
  ProformaListItem,
  SaveProformaInput,
} from "@/types/proforma-invoices";

const PATH = "/sales/proforma-invoices";

export interface ProformaListQuery {
  searchCustomer?: string;
  searchPiNum?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  direction?: string;
}

export function getProformaDraft(): Promise<ProformaDraft> {
  return apiRequest(`${PATH}/draft`);
}

export function listProformaInvoices(
  query: ProformaListQuery,
): Promise<ProformaListItem[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return apiRequest(suffix ? `${PATH}?${suffix}` : PATH);
}

export function getProformaInvoice(id: string): Promise<ProformaDetails> {
  return apiRequest(`${PATH}/${id}`);
}

export function createProformaInvoice(
  payload: SaveProformaInput,
): Promise<ProformaDetails> {
  return apiRequest(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProformaInvoice(
  id: string,
  payload: SaveProformaInput,
): Promise<ProformaDetails> {
  return apiRequest(`${PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function purgeProformaInvoice(
  id: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${PATH}/${id}/purge`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function dispatchProformaInvoice(payload: {
  recipientEmail: string;
  emailSubject: string;
  emailBodyNotes?: string;
  piNumber: string;
}): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${PATH}/dispatch-email`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
