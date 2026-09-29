import { apiRequest } from "@/lib/api";
import type { OfficeAsset, OfficeAssetInput } from "@/types/office-asset";

const PATH = "/operations/office-assets";

export function getOfficeAssets() {
  return apiRequest<OfficeAsset[]>(PATH);
}

export function createOfficeAsset(payload: OfficeAssetInput) {
  return apiRequest<OfficeAsset>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOfficeAsset(assetId: string, payload: OfficeAssetInput) {
  return apiRequest<OfficeAsset>(`${PATH}/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteOfficeAsset(assetId: string) {
  return apiRequest<{ message: string }>(`${PATH}/${assetId}`, {
    method: "DELETE",
  });
}
