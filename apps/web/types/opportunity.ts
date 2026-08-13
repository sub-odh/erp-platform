export type OpportunityStatus = "OPEN" | "WON" | "LOST";

export type OpportunityRecordState = "active" | "archived" | "all";

export type OpportunitySortField =
  | "name"
  | "amount"
  | "probability"
  | "expectedCloseDate"
  | "createdAt"
  | "updatedAt";

export type OpportunitySortDirection = "asc" | "desc";

export interface Opportunity {
  id: string;

  tenantId: string;

  name: string;

  customerId: string | null;

  leadId: string | null;

  stageId: string;

  ownerUserId: string | null;

  amount: string;

  probability: number;

  expectedCloseDate: string | null;

  status: OpportunityStatus;

  lossReason: string | null;

  description: string | null;

  createdBy: string | null;

  updatedBy: string | null;

  createdAt: string;

  updatedAt: string;

  closedAt: string | null;

  deletedAt: string | null;
}

export interface OpportunityPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
}

export interface PaginatedOpportunitiesResponse {
  data: Opportunity[];

  pagination: OpportunityPagination;
}

export interface ListOpportunitiesParams {
  search?: string;

  status?: OpportunityStatus;

  recordState?: OpportunityRecordState;

  stageId?: string;

  ownerUserId?: string;

  customerId?: string;

  leadId?: string;

  page?: number;

  limit?: number;

  sortBy?: OpportunitySortField;

  sortDirection?: OpportunitySortDirection;
}

export interface CreateOpportunityRequest {
  name: string;

  customerId?: string;

  leadId?: string;

  stageId: string;

  ownerUserId?: string;

  amount?: number;

  probability?: number;

  expectedCloseDate?: string;

  description?: string;
}

export interface UpdateOpportunityRequest {
  name?: string;

  customerId?: string;

  leadId?: string;

  ownerUserId?: string;

  amount?: number;

  probability?: number;

  expectedCloseDate?: string;

  description?: string;
}

export interface ChangeOpportunityStageRequest {
  stageId: string;

  lossReason?: string;
}
