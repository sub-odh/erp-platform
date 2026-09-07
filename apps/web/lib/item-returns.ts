import { apiRequest } from "@/lib/api";
import type {
  CreateItemReturnInput,
  ItemReturnListItem,
  ReturnableAsset,
} from "@/types/item-returns";

const PATH = "/operations/item-returns";

export function getItemReturns(): Promise<ItemReturnListItem[]> {
  return apiRequest(PATH);
}

export function getReturnableAssets(): Promise<ReturnableAsset[]> {
  return apiRequest(`${PATH}/returnable-assets`);
}

export function createItemReturn(
  input: CreateItemReturnInput,
): Promise<{ id: string; returnNumber: string }> {
  return apiRequest(PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
