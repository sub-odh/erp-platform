import { apiRequest } from "@/lib/api";
import type {
  CreateItemReturnInput,
  ItemReturnListItem,
  ReturnableAsset,
  ReturnLookupItem,
} from "@/types/item-returns";

const PATH = "/operations/item-returns";

export function getItemReturns(): Promise<ItemReturnListItem[]> {
  return apiRequest(PATH);
}

export function getReturnableAssets(): Promise<ReturnableAsset[]> {
  return apiRequest(`${PATH}/returnable-assets`);
}

export function lookupReturnItems(input: {
  doNumber?: string;
  serial?: string;
}): Promise<ReturnLookupItem[]> {
  const params = new URLSearchParams();
  if (input.doNumber?.trim()) params.set("doNumber", input.doNumber.trim());
  if (input.serial?.trim()) params.set("serial", input.serial.trim());
  return apiRequest(`${PATH}/lookup?${params.toString()}`);
}

export function processItemReturns(input: {
  lineIds: string[];
  returnType: "standard" | "damaged";
  remarks?: string;
}): Promise<{ message: string }> {
  return apiRequest(`${PATH}/process`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createItemReturn(
  input: CreateItemReturnInput,
): Promise<{ id: string; returnNumber: string }> {
  return apiRequest(PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
