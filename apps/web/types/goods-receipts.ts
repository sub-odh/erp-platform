import type { PurchaseOrderDetails } from "@/types/purchase-orders";

export interface GoodsReceiptListItem {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  deliveryNote: string | null;
  purchaseOrderId: string;
  poNumber: string;
  vendorName: string;
  totalQuantity: number;
  createdAt: string;
}

export interface ReceiveGoodsInput {
  purchaseOrderId: string;
  receivedDate: string;
  deliveryNote?: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId: string;
    quantity: number;
  }>;
}

export type ReceivablePurchaseOrder = Pick<
  PurchaseOrderDetails,
  "id" | "poNumber" | "vendorName" | "status" | "items"
>;
