export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface MasterRecord {
  id: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory extends MasterRecord {
  code: string;
  name: string;
}

export interface ProductUnit extends MasterRecord {
  name: string;
  symbol: string;
}

export interface Vendor extends MasterRecord {
  code: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  address: string | null;
  paymentTermsDays: number;
  notes: string | null;
}

export interface Product extends MasterRecord {
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  unitSymbol: string;
  defaultVendorId: string | null;
  defaultVendorName: string | null;
  description: string | null;
  purchasePrice: number;
  sellingPrice: number;
  reorderLevel: number;
}

export interface MasterDataOptions {
  categories: Array<{ id: string; code: string; name: string }>;
  units: Array<{ id: string; name: string; symbol: string }>;
  vendors: Array<{ id: string; code: string; name: string }>;
}

export interface MasterListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoryInput {
  code: string;
  name: string;
  isActive: boolean;
}

export interface UnitInput {
  name: string;
  symbol: string;
  isActive: boolean;
}

export interface VendorInput {
  code: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  taxNumber?: string | null;
  address?: string | null;
  paymentTermsDays: number;
  notes?: string | null;
  isActive: boolean;
}

export interface ProductInput {
  sku: string;
  name: string;
  categoryId: string;
  unitId: string;
  defaultVendorId?: string | null;
  description?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  reorderLevel: number;
  isActive: boolean;
}
