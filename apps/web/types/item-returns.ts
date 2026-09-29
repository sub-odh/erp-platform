export interface ItemReturnListItem {
  id: string;
  returnNumber: string;
  returnDate: string;
  itemName: string;
  serialNumber: string | null;
  customerName: string | null;
  quantity: number;
  reason: string | null;
}

export interface ReturnableAsset {
  id: string;
  itemName: string;
  serialNumber: string | null;
  soldQuantity: number;
  clientName: string | null;
}

export interface ReturnLookupItem {
  lineId: string;
  id: string;
  itemName: string;
  statusLabel: string;
  serialNumber: string | null;
  quantity: number;
  deliveryNumber: string;
  customerName: string;
  deliveryDate: string;
  daysOld: number;
  policyDays: number;
  expired: boolean;
  processed: boolean;
}

export interface CreateItemReturnInput {
  assetId: string;
  returnDate: string;
  quantity: number;
  customerName?: string;
  reason?: string;
  notes?: string;
}
