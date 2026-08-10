export type CustomerSortField =
  | "customerCode"
  | "name"
  | "createdAt"
  | "updatedAt";

export type SortDirection = "asc" | "desc";

export interface Customer {
  id: string;
  tenantId: string;

  customerCode: string;
  name: string;

  legalName: string | null;
  taxNumber: string | null;

  email: string | null;
  phone: string | null;
  website: string | null;

  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;

  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;

  creditLimit: string;
  paymentTermsDays: number;

  notes: string | null;

  isActive: boolean;

  createdBy: string | null;
  updatedBy: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCustomersResponse {
  data: Customer[];
  pagination: PaginationMeta;
}

export interface ListCustomersParams {
  search?: string;
  isActive?: boolean;

  page?: number;
  limit?: number;

  sortBy?: CustomerSortField;
  sortDirection?: SortDirection;
}

export interface CreateCustomerRequest {
  customerCode: string;
  name: string;

  legalName?: string;
  taxNumber?: string;

  email?: string;
  phone?: string;
  website?: string;

  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  creditLimit?: number;
  paymentTermsDays?: number;

  notes?: string;

  isActive?: boolean;
}

export interface UpdateCustomerRequest {
  customerCode?: string;
  name?: string;

  legalName?: string;
  taxNumber?: string;

  email?: string;
  phone?: string;
  website?: string;

  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  creditLimit?: number;
  paymentTermsDays?: number;

  notes?: string;

  isActive?: boolean;
}
