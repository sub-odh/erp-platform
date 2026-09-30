import { apiRequest } from "@/lib/api";
import type {
  ProformaCurrency,
  ProformaDetails,
  ProformaDraft,
  ProformaItem,
  ProformaListItem,
  SaveProformaInput,
} from "@/types/proforma-invoices";

const PATH = "/operations/purchase-orders";

interface ApiListItem {
  id: string;
  poNumber: string;
  poDate: string;
  vendorDetails: string;
  totalAmount: string;
  currency: ProformaCurrency;
  generatedBy: string;
}

interface ApiDetails {
  id: string;
  poNumber: string;
  poDate: string;
  vendorDetails: string;
  billTo: string;
  shipTo: string;
  termsConditions: string;
  totalAmount: string;
  currency: ProformaCurrency;
  createdAt: string;
  signatureUrl: string | null;
  totalInWords: string;
  preparedBy: string;
  position: string;
  items: ProformaItem[];
}

interface ApiDraft {
  poNumber: string;
  poDate: string;
  preparedBy: string;
  position: string;
}

export interface PurchaseOrderListQuery {
  searchCustomer?: string;
  searchPiNum?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  direction?: string;
}

const SORTS: Record<string, string> = {
  pi_number: "po_number",
  pi_date: "po_date",
  customer_details: "vendor_name",
  total_amount: "total_amount",
  first_name: "first_name",
};

export function getProformaDraft(): Promise<ProformaDraft> {
  return apiRequest<ApiDraft>(`${PATH}/draft`).then((draft) => ({
    piNumber: draft.poNumber,
    piDate: draft.poDate,
    creatorName: draft.preparedBy,
    creatorPosition: draft.position,
  }));
}

export function listProformaInvoices(
  query: PurchaseOrderListQuery,
): Promise<ProformaListItem[]> {
  const params = new URLSearchParams();
  if (query.searchCustomer) params.set("searchVendor", query.searchCustomer);
  if (query.searchPiNum) params.set("searchPoNum", query.searchPiNum);
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  if (query.sort && SORTS[query.sort]) params.set("sort", SORTS[query.sort]);
  if (query.direction) params.set("direction", query.direction);
  const suffix = params.toString();
  return apiRequest<ApiListItem[]>(suffix ? `${PATH}?${suffix}` : PATH).then(
    (rows) =>
      rows.map((row) => ({
        id: row.id,
        piNumber: row.poNumber,
        piDate: row.poDate,
        customerDetails: row.vendorDetails,
        totalAmount: row.totalAmount,
        currency: row.currency === "USD" ? "USD" : "NPR",
        creatorName: row.generatedBy,
      })),
  );
}

export function getProformaInvoice(id: string): Promise<ProformaDetails> {
  return apiRequest<ApiDetails>(`${PATH}/${id}`).then((row) => ({
    id: row.id,
    piNumber: row.poNumber,
    piDate: row.poDate,
    customerDetails: row.vendorDetails,
    billTo: row.billTo,
    shipTo: row.shipTo,
    termsConditions: row.termsConditions,
    totalAmount: row.totalAmount,
    currency: row.currency === "USD" ? "USD" : "NPR",
    createdAt: row.createdAt,
    signatureUrl: row.signatureUrl,
    totalInWords: row.totalInWords,
    creatorName: row.preparedBy,
    creatorPosition: row.position,
    items: row.items,
  }));
}

function toApi(payload: SaveProformaInput) {
  return {
    poNumber: payload.piNumber,
    poDate: payload.piDate,
    vendorDetails: payload.customerDetails,
    billTo: payload.billTo,
    shipTo: payload.shipTo,
    termsConditions: payload.termsConditions,
    currency: payload.currency,
    items: payload.items,
  };
}

export function createProformaInvoice(
  payload: SaveProformaInput,
): Promise<ProformaDetails> {
  return apiRequest<ApiDetails>(PATH, {
    method: "POST",
    body: JSON.stringify(toApi(payload)),
  }).then((row) => ({ id: row.id }) as ProformaDetails);
}

export function updateProformaInvoice(
  id: string,
  payload: SaveProformaInput,
): Promise<ProformaDetails> {
  return apiRequest<ApiDetails>(`${PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(toApi(payload)),
  }).then((row) => ({ id: row.id }) as ProformaDetails);
}

export function purgeProformaInvoice(
  id: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${PATH}/${id}/purge`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function dispatchProformaInvoice(payload: {
  recipientEmail: string;
  emailSubject: string;
  emailBodyNotes?: string;
  piNumber: string;
}): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${PATH}/dispatch-email`, {
    method: "POST",
    body: JSON.stringify({
      recipientEmail: payload.recipientEmail,
      emailSubject: payload.emailSubject,
      emailBodyNotes: payload.emailBodyNotes,
      poNumber: payload.piNumber,
    }),
  });
}
