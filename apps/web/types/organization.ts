export interface Organization {
  id: string;
  name: string;
  code: string;
  legalName: string | null;
  registrationNumber: string | null;
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
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateOrganizationInput = Partial<
  Pick<
    Organization,
    | "name"
    | "legalName"
    | "registrationNumber"
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
    | "logoUrl"
  >
>;
