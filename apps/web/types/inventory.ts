export type InventoryAssetStatus =
  | "IN_STOCK"
  | "SOLD"
  | "OUT_OF_STOCK"
  | "DELIVERED"
  | "DAMAGED"
  | "RETURNED"
  | "RMA"
  | "AVAILABLE"
  | "IN_USE"
  | "POC_LOAN";

export type InventorySortField =
  | "itemName"
  | "category"
  | "serialNumber"
  | "purchasePrice"
  | "mrpPrice"
  | "stockQuantity"
  | "status"
  | "createdAt";

export type InventorySortDirection = "asc" | "desc";

export interface InventoryAsset {
  id: string;
  tenantId: string;
  itemName: string;
  category: string;
  vendor: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  purchaseSource: string | null;
  purchaseDate: string | null;
  location: string | null;
  stockQuantity: number;
  soldQuantity: number;
  damagedQuantity: number;
  purchasePrice: number;
  mrpPrice: number;
  status: InventoryAssetStatus;
  notes: string | null;
  assignedUserName: string | null;
  assignedUserContact: string | null;
  assignedDate: string | null;
  purpose: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDashboard {
  total: number;
  stock: number;
  sold: number;
  damaged: number;
  investment: number;
  marketValue: number;
  vendors: Array<{
    vendor: string;
    total: number;
    stock: number;
    sold: number;
    damaged: number;
  }>;
}

export interface InventoryListResponse {
  data: InventoryAsset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: {
    purchaseValue: number;
    mrpValue: number;
    stockQuantity: number;
  };
}

export interface InventoryAssetInput {
  itemName: string;
  category: string;
  vendor?: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseSource?: string;
  purchaseDate?: string;
  location?: string;
  quantity: number;
  purchasePrice: number;
  mrpPrice: number;
  status?: InventoryAssetStatus;
  notes?: string;
  assignedUserName?: string;
  assignedUserContact?: string;
  assignedDate?: string;
  purpose?: string;
  soldQuantity?: number;
  damagedQuantity?: number;
}

export interface InventoryListParams {
  search?: string;
  status?: InventoryAssetStatus;
  vendor?: string;
  page?: number;
  limit?: number;
  sortBy?: InventorySortField;
  sortDirection?: InventorySortDirection;
}

export interface InventoryMovement {
  id: string;
  assetId: string;
  itemName: string;
  serialNumber: string | null;
  type: "ADDITION" | "ADJUSTMENT" | "REMOVAL" | "RETURN" | "SALE" | "DAMAGE";
  quantityDelta: number;
  stockQuantityAfter: number;
  remarks: string | null;
  performedBy: string | null;
  performerName: string | null;
  createdAt: string;
}

export interface InventoryMovementsResponse {
  data: InventoryMovement[];
  pagination: InventoryListResponse["pagination"];
}

export interface CsvDownload {
  fileName: string;
  content: string;
}
