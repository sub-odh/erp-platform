export interface DeliveryOrderListItem {
  id: string;
  deliveryNumber: string;
  deliveryDate: string;
  customerName: string;
  contactName: string | null;
  totalQuantity: number;
  totalValue: string | number;
  createdAt: string;
}

export interface DeliverableAsset {
  id: string;
  itemName: string;
  category: string;
  serialNumber: string | null;
  stockQuantity: number;
  mrpPrice: string | number;
}

export interface DeliveryOrderInput {
  deliveryDate: string;
  customerName: string;
  contactName?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  items: Array<{ assetId: string; quantity: number }>;
}
