import { apiRequest } from "@/lib/api";

import type {
  CreateCustomerRequest,
  Customer,
  ListCustomersParams,
  PaginatedCustomersResponse,
  UpdateCustomerRequest,
} from "@/types/customer";

const CUSTOMERS_PATH = "/sales/customers";

export function getCustomers(
  params: ListCustomersParams = {},
): Promise<PaginatedCustomersResponse> {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }

  searchParams.set("page", String(params.page ?? 1));

  searchParams.set("limit", String(params.limit ?? 20));

  searchParams.set("sortBy", params.sortBy ?? "createdAt");

  searchParams.set("sortDirection", params.sortDirection ?? "desc");

  return apiRequest<PaginatedCustomersResponse>(
    `${CUSTOMERS_PATH}?${searchParams.toString()}`,
  );
}

export function getCustomer(customerId: string): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_PATH}/${customerId}`);
}

export function createCustomer(
  payload: CreateCustomerRequest,
): Promise<Customer> {
  return apiRequest<Customer>(CUSTOMERS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomer(
  customerId: string,
  payload: UpdateCustomerRequest,
): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_PATH}/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateCustomerStatus(
  customerId: string,
  isActive: boolean,
): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_PATH}/${customerId}/status`, {
    method: "PATCH",

    body: JSON.stringify({
      isActive,
    }),
  });
}
