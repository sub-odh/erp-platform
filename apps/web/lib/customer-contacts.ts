import { apiRequest } from "@/lib/api";

import type {
  CreateCustomerContactRequest,
  CustomerContact,
  UpdateCustomerContactRequest,
} from "@/types/customer-contact";

function contactsPath(customerId: string): string {
  return `/sales/customers/${customerId}/contacts`;
}

export function getCustomerContacts(
  customerId: string,
): Promise<CustomerContact[]> {
  return apiRequest<CustomerContact[]>(contactsPath(customerId));
}

export function createCustomerContact(
  customerId: string,
  payload: CreateCustomerContactRequest,
): Promise<CustomerContact> {
  return apiRequest<CustomerContact>(contactsPath(customerId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomerContact(
  customerId: string,
  contactId: string,
  payload: UpdateCustomerContactRequest,
): Promise<CustomerContact> {
  return apiRequest<CustomerContact>(
    `${contactsPath(customerId)}/${contactId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function updateCustomerContactStatus(
  customerId: string,
  contactId: string,
  isActive: boolean,
): Promise<CustomerContact> {
  return apiRequest<CustomerContact>(
    `${contactsPath(customerId)}/${contactId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        isActive,
      }),
    },
  );
}

export function archiveCustomerContact(
  customerId: string,
  contactId: string,
): Promise<void> {
  return apiRequest<void>(`${contactsPath(customerId)}/${contactId}`, {
    method: "DELETE",
  });
}
