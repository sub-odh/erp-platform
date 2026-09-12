export interface PartnerAssignee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface Partner {
  id: string;
  name: string;
  portalUrl: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  logoFileName: string | null;
  assignedEmployees: PartnerAssignee[];
  createdAt: string;
  updatedAt: string;
}

export interface PartnerInput {
  name: string;
  portalUrl?: string | null;
  websiteUrl?: string | null;
  employeeIds?: string[];
}
