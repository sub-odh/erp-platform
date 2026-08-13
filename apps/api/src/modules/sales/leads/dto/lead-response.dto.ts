import type { SalesLead, SalesLeadStatus } from '@erp/db';

export class LeadResponseDto {
  id!: string;

  tenantId!: string;

  firstName!: string;

  lastName!: string;

  companyName!: string | null;

  jobTitle!: string | null;

  email!: string | null;

  phone!: string | null;

  mobile!: string | null;

  source!: string | null;

  status!: SalesLeadStatus;

  ownerUserId!: string | null;

  notes!: string | null;

  createdBy!: string | null;

  updatedBy!: string | null;

  createdAt!: Date;

  updatedAt!: Date;

  convertedAt!: Date | null;

  deletedAt!: Date | null;

  static fromEntity(lead: SalesLead): LeadResponseDto {
    return {
      id: lead.id,

      tenantId: lead.tenantId,

      firstName: lead.firstName,

      lastName: lead.lastName,

      companyName: lead.companyName,

      jobTitle: lead.jobTitle,

      email: lead.email,

      phone: lead.phone,

      mobile: lead.mobile,

      source: lead.source,

      status: lead.status,

      ownerUserId: lead.ownerUserId,

      notes: lead.notes,

      createdBy: lead.createdBy,

      updatedBy: lead.updatedBy,

      createdAt: lead.createdAt,

      updatedAt: lead.updatedAt,

      convertedAt: lead.convertedAt,

      deletedAt: lead.deletedAt,
    };
  }
}
