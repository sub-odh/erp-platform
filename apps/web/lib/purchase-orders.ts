import { apiRequest } from "@/lib/api";
import type {
  PurchaseOrderDetails,
  PurchaseOrderInput,
  PurchaseOrderListResponse,
} from "@/types/purchase-orders";

const PATH = "/operations/purchase-orders";

export function getPurchaseOrders(
  params: {
    search?: string;
    vendorId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PurchaseOrderListResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return apiRequest(`${PATH}?${query.toString()}`);
}

export function getNextPurchaseOrderNumber(
  date: string,
): Promise<{ poNumber: string }> {
  return apiRequest(`${PATH}/next-number?date=${encodeURIComponent(date)}`);
}

export function getPurchaseOrder(id: string): Promise<PurchaseOrderDetails> {
  return apiRequest(`${PATH}/${id}`);
}

export function createPurchaseOrder(
  input: PurchaseOrderInput,
): Promise<PurchaseOrderDetails> {
  return apiRequest(PATH, { method: "POST", body: JSON.stringify(input) });
}

export function sendPurchaseOrderEmail(
  id: string,
): Promise<{ success: true; message: string }> {
  return apiRequest(`${PATH}/${id}/email`, { method: "POST" });
}
