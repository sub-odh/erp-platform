import { apiRequest } from "@/lib/api";
import type {
  CategoryInput,
  MasterDataOptions,
  MasterListParams,
  PaginatedResponse,
  Product,
  ProductCategory,
  ProductInput,
  ProductUnit,
  UnitInput,
  Vendor,
  VendorInput,
} from "@/types/master-data";

const PATH = "/operations/master-data";

function listQuery(params: MasterListParams): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.isActive !== undefined) {
    query.set("isActive", String(params.isActive));
  }
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  return query.toString();
}

function jsonBody(input: unknown): RequestInit {
  return { body: JSON.stringify(input) };
}

export function getMasterDataOptions(): Promise<MasterDataOptions> {
  return apiRequest<MasterDataOptions>(`${PATH}/options`);
}

export function getCategories(
  params: MasterListParams = {},
): Promise<PaginatedResponse<ProductCategory>> {
  return apiRequest(`${PATH}/categories?${listQuery(params)}`);
}

export function createCategory(input: CategoryInput): Promise<ProductCategory> {
  return apiRequest(`${PATH}/categories`, {
    method: "POST",
    ...jsonBody(input),
  });
}

export function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ProductCategory> {
  return apiRequest(`${PATH}/categories/${id}`, {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export function archiveCategory(id: string): Promise<void> {
  return apiRequest(`${PATH}/categories/${id}`, { method: "DELETE" });
}

export function getUnits(
  params: MasterListParams = {},
): Promise<PaginatedResponse<ProductUnit>> {
  return apiRequest(`${PATH}/units?${listQuery(params)}`);
}

export function createUnit(input: UnitInput): Promise<ProductUnit> {
  return apiRequest(`${PATH}/units`, {
    method: "POST",
    ...jsonBody(input),
  });
}

export function updateUnit(id: string, input: UnitInput): Promise<ProductUnit> {
  return apiRequest(`${PATH}/units/${id}`, {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export function archiveUnit(id: string): Promise<void> {
  return apiRequest(`${PATH}/units/${id}`, { method: "DELETE" });
}

export function getVendors(
  params: MasterListParams = {},
): Promise<PaginatedResponse<Vendor>> {
  return apiRequest(`${PATH}/vendors?${listQuery(params)}`);
}

export function createVendor(input: VendorInput): Promise<Vendor> {
  return apiRequest(`${PATH}/vendors`, {
    method: "POST",
    ...jsonBody(input),
  });
}

export function updateVendor(id: string, input: VendorInput): Promise<Vendor> {
  return apiRequest(`${PATH}/vendors/${id}`, {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export function archiveVendor(id: string): Promise<void> {
  return apiRequest(`${PATH}/vendors/${id}`, { method: "DELETE" });
}

export function getProducts(
  params: MasterListParams = {},
): Promise<PaginatedResponse<Product>> {
  return apiRequest(`${PATH}/products?${listQuery(params)}`);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return apiRequest(`${PATH}/products`, {
    method: "POST",
    ...jsonBody(input),
  });
}

export function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  return apiRequest(`${PATH}/products/${id}`, {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export function archiveProduct(id: string): Promise<void> {
  return apiRequest(`${PATH}/products/${id}`, { method: "DELETE" });
}
