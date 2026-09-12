import { apiRequest } from "@/lib/api";
import type { Partner, PartnerInput } from "@/types/partner";

const PATH = "/hr/partners";

export function getPartners() {
  return apiRequest<Partner[]>(PATH);
}

export function createPartner(payload: PartnerInput) {
  return apiRequest<Partner>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePartner(partnerId: string, payload: PartnerInput) {
  return apiRequest<Partner>(`${PATH}/${partnerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePartner(partnerId: string) {
  return apiRequest<{ success: true }>(`${PATH}/${partnerId}`, {
    method: "DELETE",
  });
}

export function uploadPartnerLogo(partnerId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Partner>(`${PATH}/${partnerId}/logo`, {
    method: "POST",
    body: formData,
  });
}
