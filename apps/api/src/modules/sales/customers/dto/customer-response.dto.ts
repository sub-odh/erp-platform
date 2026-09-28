import type { SalesCustomer } from '@erp/db';
import type { PaginationMeta } from '../../../../common/pagination';

export interface CustomerDirectoryStats {
  activeDue: string;
  deliveryOrderCount: number;
}

export class CustomerResponseDto {
  id!: string;
  tenantId!: string;
  customerCode!: string;
  name!: string;
  legalName!: string | null;
  taxNumber!: string | null;
  contactPerson!: string | null;
  address!: string | null;
  email!: string | null;
  phone!: string | null;
  website!: string | null;

  billingAddressLine1!: string | null;
  billingAddressLine2!: string | null;
  billingCity!: string | null;
  billingState!: string | null;
  billingPostalCode!: string | null;
  billingCountry!: string | null;

  shippingAddressLine1!: string | null;
  shippingAddressLine2!: string | null;
  shippingCity!: string | null;
  shippingState!: string | null;
  shippingPostalCode!: string | null;
  shippingCountry!: string | null;

  creditLimit!: string;
  paymentTermsDays!: number;
  notes!: string | null;
  logoUrl!: string | null;
  logoFileName!: string | null;
  isActive!: boolean;
  activeDue!: string;
  deliveryOrderCount!: number;
  createdBy!: string | null;
  updatedBy!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(
    customer: SalesCustomer,
    stats?: CustomerDirectoryStats,
  ): CustomerResponseDto {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      customerCode: customer.customerCode,
      name: customer.name,
      legalName: customer.legalName,
      taxNumber: customer.taxNumber,
      contactPerson: customer.contactPerson,
      address: customer.address,
      email: customer.email,
      phone: customer.phone,
      website: customer.website,

      billingAddressLine1: customer.billingAddressLine1,
      billingAddressLine2: customer.billingAddressLine2,
      billingCity: customer.billingCity,
      billingState: customer.billingState,
      billingPostalCode: customer.billingPostalCode,
      billingCountry: customer.billingCountry,

      shippingAddressLine1: customer.shippingAddressLine1,
      shippingAddressLine2: customer.shippingAddressLine2,
      shippingCity: customer.shippingCity,
      shippingState: customer.shippingState,
      shippingPostalCode: customer.shippingPostalCode,
      shippingCountry: customer.shippingCountry,

      creditLimit: customer.creditLimit,
      paymentTermsDays: Number(customer.paymentTermsDays),
      notes: customer.notes,
      logoUrl: customer.logoUrl,
      logoFileName: customer.logoFileName,
      isActive: customer.isActive,
      activeDue: stats?.activeDue ?? '0.00',
      deliveryOrderCount: stats?.deliveryOrderCount ?? 0,
      createdBy: customer.createdBy,
      updatedBy: customer.updatedBy,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}

export class PaginatedCustomersResponseDto {
  data!: CustomerResponseDto[];

  pagination!: PaginationMeta;
}
