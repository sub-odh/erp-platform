export interface CustomerContact {
  id: string;
  tenantId: string;
  customerId: string;

  firstName: string;
  lastName: string;

  jobTitle: string | null;

  email: string | null;
  phone: string | null;
  mobile: string | null;

  isPrimary: boolean;
  isActive: boolean;

  createdBy: string | null;
  updatedBy: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerContactRequest {
  firstName: string;
  lastName: string;

  jobTitle?: string;
  email?: string;
  phone?: string;
  mobile?: string;

  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateCustomerContactRequest {
  firstName?: string;
  lastName?: string;

  jobTitle?: string;
  email?: string;
  phone?: string;
  mobile?: string;

  isPrimary?: boolean;
  isActive?: boolean;
}
