import { apiRequest } from "@/lib/api";

import type {
  CreateGuaranteePayload,
  CreateTenderPayload,
  Guarantee,
  GuaranteeListResponse,
  GuaranteeStatus,
  GuaranteeType,
  ReleaseGuaranteePayload,
  Tender,
  UpdateTenderPayload,
  UploadedDocument,
} from "@/types/procurement";

const TENDERS_PATH = "/procurement/tenders";
const GUARANTEES_PATH = "/procurement/guarantees";

export function getTenders(
  params: { search?: string; fromDate?: string; toDate?: string } = {},
): Promise<Tender[]> {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.fromDate) {
    searchParams.set("fromDate", params.fromDate);
  }

  if (params.toDate) {
    searchParams.set("toDate", params.toDate);
  }

  const query = searchParams.toString();
  return apiRequest<Tender[]>(query ? `${TENDERS_PATH}?${query}` : TENDERS_PATH);
}

export function createTender(payload: CreateTenderPayload): Promise<Tender> {
  return apiRequest<Tender>(TENDERS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTender(
  tenderId: string,
  payload: UpdateTenderPayload,
): Promise<Tender> {
  return apiRequest<Tender>(`${TENDERS_PATH}/${tenderId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTender(tenderId: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`${TENDERS_PATH}/${tenderId}`, {
    method: "DELETE",
  });
}

export function getGuarantees(
  params: {
    search?: string;
    guaranteeType?: GuaranteeType;
    status?: GuaranteeStatus;
  } = {},
): Promise<GuaranteeListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.guaranteeType) {
    searchParams.set("guaranteeType", params.guaranteeType);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();
  return apiRequest<GuaranteeListResponse>(
    query ? `${GUARANTEES_PATH}?${query}` : GUARANTEES_PATH,
  );
}

export function createGuarantee(
  payload: CreateGuaranteePayload,
): Promise<Guarantee> {
  return apiRequest<Guarantee>(GUARANTEES_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function releaseGuarantee(
  guaranteeId: string,
  payload: ReleaseGuaranteePayload,
): Promise<Guarantee> {
  return apiRequest<Guarantee>(`${GUARANTEES_PATH}/${guaranteeId}/release`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteGuarantee(
  guaranteeId: string,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`${GUARANTEES_PATH}/${guaranteeId}`, {
    method: "DELETE",
  });
}

export function uploadGuaranteeDocument(
  file: File,
): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadedDocument>(`${GUARANTEES_PATH}/documents`, {
    method: "POST",
    body: formData,
  });
}
