export interface DeliveryOrderListItem {
  id: string;
  deliveryNumber: string;
  deliveryDate: string;
  customerName: string;
  contactName: string | null;
  isBillable: number;
  isVoided: number;
  status: string;
  grandTotal: string | number;
  soldByName: string | null;
  soldByDesignation: string | null;
  soldByPhoto: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
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

export interface DeliverySalesperson {
  id: string;
  firstName: string;
  lastName: string;
  designation: string | null;
}

export interface DeliveryLeadOption {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  firstName: string;
  lastName: string;
}

export interface DeliveryLookups {
  salespeople: DeliverySalesperson[];
  leads: DeliveryLeadOption[];
}

export interface DeliveryOrderLineInput {
  assetId?: string;
  serviceName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface DeliveryOrderInput {
  deliveryDate: string;
  customerName: string;
  customerId?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  billable?: boolean;
  returnValidityDays?: 15 | 90 | 180 | 365;
  sourceBillNo?: string;
  soldById?: string;
  leadId?: string;
  discountValue?: number;
  discountType?: "percent" | "fixed" | "amount";
  taxable?: boolean;
  items: DeliveryOrderLineInput[];
}

export interface DeliveryOrderItem {
  id: string;
  assetId: string | null;
  serviceName: string | null;
  itemName: string;
  serialNumber: string | null;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  modelNumber?: string | null;
  returned?: boolean;
}

export interface DeliveryOrderDetails {
  order: {
    id: string;
    deliveryNumber: string;
    deliveryDate: string;
    customerName: string;
    contactName: string | null;
    contactPhone: string | null;
    deliveryAddress: string | null;
    notes: string | null;
    status: string;
    isBillable: number;
    isVoided: number;
    isTaxable: number;
    returnValidityDays: number;
    sourceBillNo: string | null;
    discountValue: string | number;
    discountType: string;
    subtotalAmount: string | number;
    vatAmount: string | number;
    grandTotal: string | number;
    soldById: string | null;
    leadId: string | null;
    clientAddress?: string | null;
    creatorName?: string;
  };
  items: DeliveryOrderItem[];
  salesperson: DeliverySalesperson | null;
}
