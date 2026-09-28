import { apiRequest } from "@/lib/api";
import { downloadTextFile } from "@/lib/inventory";

import type {
  CreateCustomerRequest,
  Customer,
  CustomerCsvImportResult,
  CustomerHistoryResponse,
  ListCustomersParams,
  PaginatedCustomersResponse,
  UpdateCustomerRequest,
} from "@/types/customer";
import type { CsvDownload } from "@/types/inventory";

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

export function getCustomerHistory(
  customerId: string,
): Promise<CustomerHistoryResponse> {
  return apiRequest<CustomerHistoryResponse>(
    `${CUSTOMERS_PATH}/${customerId}/history`,
  );
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

export function uploadCustomerLogo(
  customerId: string,
  file: File,
): Promise<Customer> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Customer>(`${CUSTOMERS_PATH}/${customerId}/logo`, {
    method: "POST",
    body: formData,
  });
}

export function deleteCustomer(
  customerId: string,
  password: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`${CUSTOMERS_PATH}/${customerId}`, {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export function importCustomersCsv(
  file: File,
): Promise<CustomerCsvImportResult> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<CustomerCsvImportResult>(`${CUSTOMERS_PATH}/import`, {
    method: "POST",
    body,
  });
}

export function getCustomerCsvTemplate(): Promise<CsvDownload> {
  return apiRequest<CsvDownload>(`${CUSTOMERS_PATH}/csv-template`);
}

export async function downloadCustomerCsvTemplate(): Promise<void> {
  downloadTextFile(await getCustomerCsvTemplate());
}
