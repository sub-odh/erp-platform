import { apiRequest } from "@/lib/api";
import type {
  CreateQuotationInput,
  QuotationDetails,
  QuotationListResponse,
  QuotationStatus,
} from "@/types/quotations";

const PATH = "/sales/quotations";

export function getQuotations(
  params: {
    search?: string;
    status?: QuotationStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<QuotationListResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return apiRequest(`${PATH}?${query.toString()}`);
}
export function getNextQuotationNumber(
  date: string,
): Promise<{ quotationNumber: string }> {
  return apiRequest(`${PATH}/next-number?date=${encodeURIComponent(date)}`);
}
export function getQuotation(id: string): Promise<QuotationDetails> {
  return apiRequest(`${PATH}/${id}`);
}
export function createQuotation(
  input: CreateQuotationInput,
): Promise<QuotationDetails> {
  return apiRequest(PATH, { method: "POST", body: JSON.stringify(input) });
}
export function deleteQuotation(id: string): Promise<void> {
  return apiRequest(`${PATH}/${id}`, { method: "DELETE" });
}
