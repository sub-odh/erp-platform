export interface Company {
  id: string;
  name: string;
  code: string;
  legalName: string | null;
  registrationNumber: string | null;
  registrationDate: string | null;
  taxNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  currencyCode: string;
  timezone: string;
  officeStartTime: string | null;
  officeEndTime: string | null;
  logoUrl: string | null;
  logoFileName: string | null;
  logoMimeType: string | null;
  logoSize: number | null;
  invoiceLogoUrl: string | null;
  invoiceLogoFileName: string | null;
  invoiceLogoMimeType: string | null;
  invoiceLogoSize: number | null;
  faviconUrl: string | null;
  faviconFileName: string | null;
  faviconMimeType: string | null;
  faviconSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateCompanyInput = Partial<
  Pick<
    Company,
    | "name"
    | "legalName"
    | "registrationNumber"
    | "registrationDate"
    | "taxNumber"
    | "email"
    | "phone"
    | "website"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "state"
    | "postalCode"
    | "country"
    | "currencyCode"
    | "timezone"
    | "officeStartTime"
    | "officeEndTime"
  >
>;

export interface CompanyDataCounts {
  pipelineStages: number;
  customers: number;
  customerContacts: number;
  leads: number;
  opportunities: number;
  inventoryAssets: number;
  inventoryMovements: number;
  categories: number;
  units: number;
  vendors: number;
  products: number;
  purchaseOrders: number;
  purchaseOrderItems: number;
  quotations: number;
  quotationItems: number;
  goodsReceipts: number;
  goodsReceiptItems: number;
  deliveryOrders: number;
  deliveryOrderItems: number;
  itemReturns: number;
}

export interface CompanyBackup {
  format: "erp-company-backup";
  version: 1;
  company: Pick<Company, "id" | "code" | "name">;
  exportedAt: string;
  data: {
    pipelineStages: unknown[];
    customers: unknown[];
    customerContacts: unknown[];
    leads: unknown[];
    opportunities: unknown[];
    inventoryAssets: unknown[];
    inventoryMovements: unknown[];
    categories: unknown[];
    units: unknown[];
    vendors: unknown[];
    products: unknown[];
    purchaseOrders: unknown[];
    purchaseOrderItems: unknown[];
    quotations: unknown[];
    quotationItems: unknown[];
    goodsReceipts: unknown[];
    goodsReceiptItems: unknown[];
    deliveryOrders: unknown[];
    deliveryOrderItems: unknown[];
    itemReturns: unknown[];
  };
  counts: CompanyDataCounts;
}

export interface CompanyDataOperationResult {
  success: true;
  message: string;
  counts: CompanyDataCounts;
}
