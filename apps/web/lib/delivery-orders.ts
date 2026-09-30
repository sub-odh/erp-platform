import { apiRequest } from "@/lib/api";
import type {
  DeliverableAsset,
  DeliveryLookups,
  DeliveryOrderDetails,
  DeliveryOrderInput,
  DeliveryOrderListItem,
} from "@/types/delivery-orders";

const PATH = "/operations/delivery-orders";

export function getDeliveryOrders(): Promise<DeliveryOrderListItem[]> {
  return apiRequest<DeliveryOrderListItem[]>(PATH);
}

export function getDeliverableAssets(): Promise<DeliverableAsset[]> {
  return apiRequest<DeliverableAsset[]>(`${PATH}/available-assets`);
}

export function getDeliveryLookups(): Promise<DeliveryLookups> {
  return apiRequest<DeliveryLookups>(`${PATH}/lookups`);
}

export function getDeliveryDraft(
  date: string,
): Promise<{ deliveryNumber: string }> {
  return apiRequest(`${PATH}/draft?date=${encodeURIComponent(date)}`);
}

export function getDeliveryOrder(id: string): Promise<DeliveryOrderDetails> {
  return apiRequest<DeliveryOrderDetails>(`${PATH}/${id}`);
}

export function createDeliveryOrder(
  payload: DeliveryOrderInput,
): Promise<{ id: string; deliveryNumber: string }> {
  return apiRequest(`${PATH}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDeliveryOrder(
  id: string,
  payload: {
    deliveryDate: string;
    sourceBillNo?: string;
    soldById?: string;
    leadId?: string;
    discountValue?: number;
    discountType?: "percent" | "fixed" | "amount";
    taxable?: boolean;
    items: Array<{ id: string; unitPrice: number }>;
  },
): Promise<{ id: string; invoiceId: string }> {
  return apiRequest(`${PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function voidDeliveryOrder(
  id: string,
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${PATH}/${id}/void`, { method: "POST" });
}

export function purgeDeliveryOrder(
  id: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${PATH}/${id}/purge`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
