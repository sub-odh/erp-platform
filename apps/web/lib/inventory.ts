import { apiRequest } from "@/lib/api";
import type {
  CsvDownload,
  InventoryAsset,
  InventoryAssetInput,
  InventoryDashboard,
  InventoryListParams,
  InventoryListResponse,
  InventoryMovementsResponse,
} from "@/types/inventory";

const INVENTORY_PATH = "/operations/inventory";

function queryString(params: InventoryListParams): string {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.status) searchParams.set("status", params.status);
  if (params.vendor?.trim()) searchParams.set("vendor", params.vendor.trim());
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 20));
  searchParams.set("sortBy", params.sortBy ?? "createdAt");
  searchParams.set("sortDirection", params.sortDirection ?? "desc");
  return searchParams.toString();
}

export function getInventoryDashboard(): Promise<InventoryDashboard> {
  return apiRequest<InventoryDashboard>(`${INVENTORY_PATH}/dashboard`);
}

export function getInventoryAssets(
  params: InventoryListParams = {},
): Promise<InventoryListResponse> {
  return apiRequest<InventoryListResponse>(
    `${INVENTORY_PATH}/assets?${queryString(params)}`,
  );
}

export function createInventoryAsset(
  payload: InventoryAssetInput,
): Promise<InventoryAsset> {
  return apiRequest<InventoryAsset>(`${INVENTORY_PATH}/assets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInventoryAsset(
  assetId: string,
  payload: Partial<InventoryAssetInput>,
): Promise<InventoryAsset> {
  return apiRequest<InventoryAsset>(`${INVENTORY_PATH}/assets/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveInventoryAsset(assetId: string): Promise<void> {
  return apiRequest<void>(`${INVENTORY_PATH}/assets/${assetId}`, {
    method: "DELETE",
  });
}

export function importInventoryCsv(file: File): Promise<{ imported: number }> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<{ imported: number }>(`${INVENTORY_PATH}/assets/import`, {
    method: "POST",
    body,
  });
}

export function getInventorySampleCsv(): Promise<CsvDownload> {
  return apiRequest<CsvDownload>(`${INVENTORY_PATH}/assets/sample`);
}

export function exportInventoryCsv(
  params: InventoryListParams = {},
): Promise<CsvDownload> {
  return apiRequest<CsvDownload>(
    `${INVENTORY_PATH}/assets/export?${queryString(params)}`,
  );
}

export function getInventoryMovements(
  params: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<InventoryMovementsResponse> {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.type) searchParams.set("type", params.type);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 20));
  return apiRequest<InventoryMovementsResponse>(
    `${INVENTORY_PATH}/movements?${searchParams.toString()}`,
  );
}

export function downloadTextFile(file: CsvDownload): void {
  const blob = new Blob([file.content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
