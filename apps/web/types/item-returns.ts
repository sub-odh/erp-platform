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

export interface CreateItemReturnInput {
  assetId: string;
  returnDate: string;
  quantity: number;
  customerName?: string;
  reason?: string;
  notes?: string;
}
