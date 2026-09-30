import { apiRequest } from "@/lib/api";
import type {
  CloudQuotationDetails,
  CloudQuotationDraft,
  CloudQuotationListItem,
  SaveCloudQuotationInput,
} from "@/types/cloud-quotations";

const PATH = "/sales/cloud-quotations";

export function getCloudQuotationDraft(): Promise<CloudQuotationDraft> {
  return apiRequest<CloudQuotationDraft>(`${PATH}/draft`);
}

export function getCloudQuotations(): Promise<CloudQuotationListItem[]> {
  return apiRequest<CloudQuotationListItem[]>(PATH);
}

export function getCloudQuotation(id: string): Promise<CloudQuotationDetails> {
  return apiRequest<CloudQuotationDetails>(`${PATH}/${id}`);
}

export function createCloudQuotation(
  input: SaveCloudQuotationInput,
): Promise<CloudQuotationDetails> {
  return apiRequest<CloudQuotationDetails>(PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCloudQuotation(
  id: string,
  input: SaveCloudQuotationInput,
): Promise<CloudQuotationDetails> {
  return apiRequest<CloudQuotationDetails>(`${PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function purgeCloudQuotation(id: string): Promise<{ message: string }> {
  return apiRequest(`${PATH}/${id}/purge`, { method: "POST" });
}
