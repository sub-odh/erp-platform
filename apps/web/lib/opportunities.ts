import { apiRequest } from "@/lib/api";

import type {
  ChangeOpportunityStageRequest,
  CreateOpportunityRequest,
  ListOpportunitiesParams,
  Opportunity,
  PaginatedOpportunitiesResponse,
  UpdateOpportunityRequest,
} from "@/types/opportunity";

const OPPORTUNITIES_PATH = "/sales/opportunities";

export function getOpportunities(
  params: ListOpportunitiesParams = {},
): Promise<PaginatedOpportunitiesResponse> {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.recordState) {
    searchParams.set("recordState", params.recordState);
  }

  if (params.stageId) {
    searchParams.set("stageId", params.stageId);
  }

  if (params.ownerUserId) {
    searchParams.set("ownerUserId", params.ownerUserId);
  }

  if (params.customerId) {
    searchParams.set("customerId", params.customerId);
  }

  if (params.leadId) {
    searchParams.set("leadId", params.leadId);
  }

  searchParams.set("page", String(params.page ?? 1));

  searchParams.set("limit", String(params.limit ?? 20));

  searchParams.set("sortBy", params.sortBy ?? "createdAt");

  searchParams.set("sortDirection", params.sortDirection ?? "desc");

  return apiRequest<PaginatedOpportunitiesResponse>(
    `${OPPORTUNITIES_PATH}?${searchParams.toString()}`,
  );
}

export function getOpportunity(opportunityId: string): Promise<Opportunity> {
  return apiRequest<Opportunity>(`${OPPORTUNITIES_PATH}/${opportunityId}`);
}

export function createOpportunity(
  payload: CreateOpportunityRequest,
): Promise<Opportunity> {
  return apiRequest<Opportunity>(OPPORTUNITIES_PATH, {
    method: "POST",

    body: JSON.stringify(payload),
  });
}

export function updateOpportunity(
  opportunityId: string,
  payload: UpdateOpportunityRequest,
): Promise<Opportunity> {
  return apiRequest<Opportunity>(`${OPPORTUNITIES_PATH}/${opportunityId}`, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
}

export function changeOpportunityStage(
  opportunityId: string,
  payload: ChangeOpportunityStageRequest,
): Promise<Opportunity> {
  return apiRequest<Opportunity>(
    `${OPPORTUNITIES_PATH}/${opportunityId}/stage`,
    {
      method: "PATCH",

      body: JSON.stringify(payload),
    },
  );
}

export function archiveOpportunity(opportunityId: string): Promise<void> {
  return apiRequest<void>(`${OPPORTUNITIES_PATH}/${opportunityId}`, {
    method: "DELETE",
  });
}

export function restoreOpportunity(
  opportunityId: string,
): Promise<Opportunity> {
  return apiRequest<Opportunity>(
    `${OPPORTUNITIES_PATH}/${opportunityId}/restore`,
    {
      method: "POST",
    },
  );
}

export function permanentlyDeleteOpportunity(
  opportunityId: string,
): Promise<void> {
  return apiRequest<void>(`${OPPORTUNITIES_PATH}/${opportunityId}/permanent`, {
    method: "DELETE",
  });
}
