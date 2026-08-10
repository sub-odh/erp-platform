import { apiRequest } from "@/lib/api";

import type {
  CreateLeadRequest,
  EditableLeadStatus,
  Lead,
  ListLeadsParams,
  PaginatedLeadsResponse,
  UpdateLeadRequest,
} from "@/types/lead";

const LEADS_PATH = "/sales/leads";

export function getLeads(
  params: ListLeadsParams = {},
): Promise<PaginatedLeadsResponse> {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.ownerUserId) {
    searchParams.set("ownerUserId", params.ownerUserId);
  }

  searchParams.set("page", String(params.page ?? 1));

  searchParams.set("limit", String(params.limit ?? 20));

  searchParams.set("sortBy", params.sortBy ?? "createdAt");

  searchParams.set("sortDirection", params.sortDirection ?? "desc");

  return apiRequest<PaginatedLeadsResponse>(
    `${LEADS_PATH}?${searchParams.toString()}`,
  );
}

export function getLead(leadId: string): Promise<Lead> {
  return apiRequest<Lead>(`${LEADS_PATH}/${leadId}`);
}

export function createLead(payload: CreateLeadRequest): Promise<Lead> {
  return apiRequest<Lead>(LEADS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLead(
  leadId: string,
  payload: UpdateLeadRequest,
): Promise<Lead> {
  return apiRequest<Lead>(`${LEADS_PATH}/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateLeadStatus(
  leadId: string,
  status: EditableLeadStatus,
): Promise<Lead> {
  return apiRequest<Lead>(`${LEADS_PATH}/${leadId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
    }),
  });
}

export function archiveLead(leadId: string): Promise<void> {
  return apiRequest<void>(`${LEADS_PATH}/${leadId}`, {
    method: "DELETE",
  });
}
