export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "DISQUALIFIED"
  | "CONVERTED";

export type EditableLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "DISQUALIFIED";

export type LeadSortField =
  | "firstName"
  | "lastName"
  | "companyName"
  | "status"
  | "createdAt"
  | "updatedAt";

export type LeadSortDirection = "asc" | "desc";

export interface Lead {
  id: string;
  tenantId: string;

  firstName: string;
  lastName: string;

  companyName: string | null;
  jobTitle: string | null;

  email: string | null;
  phone: string | null;
  mobile: string | null;

  source: string | null;

  status: LeadStatus;

  ownerUserId: string | null;

  notes: string | null;

  createdBy: string | null;
  updatedBy: string | null;

  createdAt: string;
  updatedAt: string;

  convertedAt: string | null;
}

export interface LeadPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedLeadsResponse {
  data: Lead[];
  pagination: LeadPagination;
}

export interface ListLeadsParams {
  search?: string;

  status?: EditableLeadStatus;

  ownerUserId?: string;

  page?: number;
  limit?: number;

  sortBy?: LeadSortField;

  sortDirection?: LeadSortDirection;
}

export interface CreateLeadRequest {
  firstName: string;
  lastName: string;

  companyName?: string;
  jobTitle?: string;

  email?: string;
  phone?: string;
  mobile?: string;

  source?: string;

  status?: EditableLeadStatus;

  ownerUserId?: string;

  notes?: string;
}

export interface UpdateLeadRequest {
  firstName?: string;
  lastName?: string;

  companyName?: string;
  jobTitle?: string;

  email?: string;
  phone?: string;
  mobile?: string;

  source?: string;

  status?: EditableLeadStatus;

  ownerUserId?: string;

  notes?: string;
}
