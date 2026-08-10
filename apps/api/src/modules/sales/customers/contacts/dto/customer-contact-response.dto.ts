import type { SalesCustomerContact } from '@erp/db';

export class CustomerContactResponseDto {
  id!: string;
  tenantId!: string;
  customerId!: string;

  firstName!: string;
  lastName!: string;

  jobTitle!: string | null;

  email!: string | null;
  phone!: string | null;
  mobile!: string | null;

  isPrimary!: boolean;
  isActive!: boolean;

  createdBy!: string | null;
  updatedBy!: string | null;

  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(contact: SalesCustomerContact): CustomerContactResponseDto {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      customerId: contact.customerId,

      firstName: contact.firstName,
      lastName: contact.lastName,

      jobTitle: contact.jobTitle,

      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,

      isPrimary: contact.isPrimary,
      isActive: contact.isActive,

      createdBy: contact.createdBy,
      updatedBy: contact.updatedBy,

      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}
