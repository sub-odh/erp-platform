import { apiRequest } from "@/lib/api";
import type {
  DeliverableAsset,
  DeliveryOrderInput,
  DeliveryOrderListItem,
} from "@/types/delivery-orders";

const DELIVERY_ORDERS_PATH = "/operations/delivery-orders";

export function getDeliveryOrders(): Promise<DeliveryOrderListItem[]> {
  return apiRequest<DeliveryOrderListItem[]>(DELIVERY_ORDERS_PATH);
}

export function getDeliverableAssets(): Promise<DeliverableAsset[]> {
  return apiRequest<DeliverableAsset[]>(
    `${DELIVERY_ORDERS_PATH}/available-assets`,
  );
}

export function createDeliveryOrder(
  payload: DeliveryOrderInput,
): Promise<{ id: string; deliveryNumber: string }> {
  return apiRequest<{ id: string; deliveryNumber: string }>(
    DELIVERY_ORDERS_PATH,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
