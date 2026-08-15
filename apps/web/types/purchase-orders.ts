import type { PaginationMeta, Product, Vendor } from "@/types/master-data";

export type PurchaseOrderStatus =
  "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  poDate: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  attentionContact: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  description: string | null;
  unitSymbol: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  receivedQuantity: number;
}

export interface PurchaseOrderDetails extends PurchaseOrderListItem {
  vendorAddress: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  deliveryAddress: string | null;
  paymentTerms: string | null;
  notes: string | null;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderListResponse {
  data: PurchaseOrderListItem[];
  pagination: PaginationMeta;
}

export interface PurchaseOrderInput {
  vendorId: string;
  poDate: string;
  attentionContact?: string | null;
  deliveryAddress?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PurchaseOrderCatalog {
  products: Product[];
  vendors: Vendor[];
}
