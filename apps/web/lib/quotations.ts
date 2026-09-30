import { apiRequest } from "@/lib/api";
import type {
  QuotationDetails,
  QuotationDraft,
  QuotationListResponse,
  SaveQuotationInput,
} from "@/types/quotations";

const PATH = "/sales/quotations";

export function getQuotationDraft(): Promise<QuotationDraft> {
  return apiRequest<QuotationDraft>(`${PATH}/draft`);
}

export function getQuotations(params: {
  search?: string;
  status?: "active" | "expired";
  sort?: string;
  direction?: "asc" | "desc";
}): Promise<QuotationListResponse> {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.direction) search.set("direction", params.direction);
  const query = search.toString();
  return apiRequest<QuotationListResponse>(`${PATH}${query ? `?${query}` : ""}`);
}

export function getQuotation(id: string): Promise<QuotationDetails> {
  return apiRequest<QuotationDetails>(`${PATH}/${id}`);
}

export function createQuotation(
  input: SaveQuotationInput,
): Promise<QuotationDetails> {
  return apiRequest<QuotationDetails>(PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateQuotation(
  id: string,
  input: SaveQuotationInput,
): Promise<QuotationDetails> {
  return apiRequest<QuotationDetails>(`${PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function purgeQuotation(id: string, password: string): Promise<{ message: string }> {
  return apiRequest(`${PATH}/${id}/purge`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
