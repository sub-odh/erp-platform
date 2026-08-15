import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  db,
  inventoryAssets,
  inventoryMovements,
  operationsCategories,
  operationsPurchaseOrderItems,
  operationsPurchaseOrders,
  operationsProducts,
  operationsUnits,
  operationsVendors,
  organizations,
  salesCustomerContacts,
  salesCustomers,
  salesLeads,
  salesOpportunities,
  salesPipelineStages,
  users,
  type InventoryAsset,
  type InventoryMovement,
  type NewInventoryAsset,
  type NewInventoryMovement,
  type NewOperationsCategory,
  type NewOperationsPurchaseOrder,
  type NewOperationsPurchaseOrderItem,
  type NewOperationsProduct,
  type NewOperationsUnit,
  type NewOperationsVendor,
  type NewSalesCustomer,
  type NewSalesCustomerContact,
  type NewSalesLead,
  type NewSalesOpportunity,
  type NewSalesPipelineStage,
  type SalesCustomer,
  type SalesCustomerContact,
  type SalesLead,
  type SalesOpportunity,
  type SalesPipelineStage,
  type OperationsCategory,
  type OperationsPurchaseOrder,
  type OperationsPurchaseOrderItem,
  type OperationsProduct,
  type OperationsUnit,
  type OperationsVendor,
} from '@erp/db';

import { OwnerVerificationService } from '../users/owner-verification.service';

const BACKUP_FORMAT = 'erp-company-backup';
const BACKUP_VERSION = 1;

type BackupRecord = Record<string, unknown>;

interface ParsedCompanyBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  company: {
    id: string;
    code: string;
    name: string;
  };
  exportedAt: string;
  data: {
    pipelineStages: BackupRecord[];
    customers: BackupRecord[];
    customerContacts: BackupRecord[];
    leads: BackupRecord[];
    opportunities: BackupRecord[];
    inventoryAssets?: BackupRecord[];
    inventoryMovements?: BackupRecord[];
    categories?: BackupRecord[];
    units?: BackupRecord[];
    vendors?: BackupRecord[];
    products?: BackupRecord[];
    purchaseOrders?: BackupRecord[];
    purchaseOrderItems?: BackupRecord[];
  };
}

export interface CompanyDataCounts {
  pipelineStages: number;
  customers: number;
  customerContacts: number;
  leads: number;
  opportunities: number;
  inventoryAssets: number;
  inventoryMovements: number;
  categories: number;
  units: number;
  vendors: number;
  products: number;
  purchaseOrders: number;
  purchaseOrderItems: number;
}

export interface CompanyBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  company: {
    id: string;
    code: string;
    name: string;
  };
  exportedAt: string;
  data: {
    pipelineStages: SalesPipelineStage[];
    customers: SalesCustomer[];
    customerContacts: SalesCustomerContact[];
    leads: SalesLead[];
    opportunities: SalesOpportunity[];
    inventoryAssets: InventoryAsset[];
    inventoryMovements: InventoryMovement[];
    categories: OperationsCategory[];
    units: OperationsUnit[];
    vendors: OperationsVendor[];
    products: OperationsProduct[];
    purchaseOrders: OperationsPurchaseOrder[];
    purchaseOrderItems: OperationsPurchaseOrderItem[];
  };
  counts: CompanyDataCounts;
}

export interface CompanyDataOperationResult {
  success: true;
  message: string;
  counts: CompanyDataCounts;
}

@Injectable()
export class CompanyDataService {
  constructor(private readonly ownerVerification: OwnerVerificationService) {}

  async createBackup(organizationId: string): Promise<CompanyBackup> {
    const company = await this.findCompany(organizationId);

    const [
      pipelineStages,
      customers,
      customerContacts,
      leads,
      opportunities,
      inventoryAssetRows,
      inventoryMovementRows,
      categoryRows,
      unitRows,
      vendorRows,
      productRows,
      purchaseOrderRows,
      purchaseOrderItemRows,
    ] = await Promise.all([
      db
        .select()
        .from(salesPipelineStages)
        .where(eq(salesPipelineStages.tenantId, organizationId)),
      db
        .select()
        .from(salesCustomers)
        .where(eq(salesCustomers.tenantId, organizationId)),
      db
        .select()
        .from(salesCustomerContacts)
        .where(eq(salesCustomerContacts.tenantId, organizationId)),
      db
        .select()
        .from(salesLeads)
        .where(eq(salesLeads.tenantId, organizationId)),
      db
        .select()
        .from(salesOpportunities)
        .where(eq(salesOpportunities.tenantId, organizationId)),
      db
        .select()
        .from(inventoryAssets)
        .where(eq(inventoryAssets.tenantId, organizationId)),
      db
        .select()
        .from(inventoryMovements)
        .where(eq(inventoryMovements.tenantId, organizationId)),
      db
        .select()
        .from(operationsCategories)
        .where(eq(operationsCategories.tenantId, organizationId)),
      db
        .select()
        .from(operationsUnits)
        .where(eq(operationsUnits.tenantId, organizationId)),
      db
        .select()
        .from(operationsVendors)
        .where(eq(operationsVendors.tenantId, organizationId)),
      db
        .select()
        .from(operationsProducts)
        .where(eq(operationsProducts.tenantId, organizationId)),
      db
        .select()
        .from(operationsPurchaseOrders)
        .where(eq(operationsPurchaseOrders.tenantId, organizationId)),
      db
        .select()
        .from(operationsPurchaseOrderItems)
        .where(eq(operationsPurchaseOrderItems.tenantId, organizationId)),
    ]);

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
      },
      exportedAt: new Date().toISOString(),
      data: {
        pipelineStages,
        customers,
        customerContacts,
        leads,
        opportunities,
        inventoryAssets: inventoryAssetRows,
        inventoryMovements: inventoryMovementRows,
        categories: categoryRows,
        units: unitRows,
        vendors: vendorRows,
        products: productRows,
        purchaseOrders: purchaseOrderRows,
        purchaseOrderItems: purchaseOrderItemRows,
      },
      counts: this.counts({
        pipelineStages,
        customers,
        customerContacts,
        leads,
        opportunities,
        inventoryAssets: inventoryAssetRows,
        inventoryMovements: inventoryMovementRows,
        categories: categoryRows,
        units: unitRows,
        vendors: vendorRows,
        products: productRows,
        purchaseOrders: purchaseOrderRows,
        purchaseOrderItems: purchaseOrderItemRows,
      }),
    };
  }

  async restoreBackup(
    organizationId: string,
    confirmation: string,
    file: Express.Multer.File | undefined,
  ): Promise<CompanyDataOperationResult> {
    const company = await this.findCompany(organizationId);
    this.assertConfirmation(confirmation, `RESTORE ${company.code}`);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Select a company backup JSON file');
    }

    const backup = this.parseBackup(file.buffer);

    if (
      backup.company.id !== company.id ||
      backup.company.code.toUpperCase() !== company.code.toUpperCase()
    ) {
      throw new BadRequestException(
        'This backup belongs to a different company and cannot be restored here',
      );
    }

    const rows = this.normalizeBackup(backup, organizationId);
    await this.assertInternalReferences(rows, organizationId);

    try {
      await this.deleteOperationalData(organizationId);

      if (rows.pipelineStages.length > 0) {
        await db.insert(salesPipelineStages).values(rows.pipelineStages);
      }
      if (rows.customers.length > 0) {
        await db.insert(salesCustomers).values(rows.customers);
      }
      if (rows.customerContacts.length > 0) {
        await db.insert(salesCustomerContacts).values(rows.customerContacts);
      }
      if (rows.leads.length > 0) {
        await db.insert(salesLeads).values(rows.leads);
      }
      if (rows.opportunities.length > 0) {
        await db.insert(salesOpportunities).values(rows.opportunities);
      }
      if (rows.categories.length > 0) {
        await db.insert(operationsCategories).values(rows.categories);
      }
      if (rows.units.length > 0) {
        await db.insert(operationsUnits).values(rows.units);
      }
      if (rows.vendors.length > 0) {
        await db.insert(operationsVendors).values(rows.vendors);
      }
      if (rows.products.length > 0) {
        await db.insert(operationsProducts).values(rows.products);
      }
      if (rows.purchaseOrders.length > 0) {
        await db.insert(operationsPurchaseOrders).values(rows.purchaseOrders);
      }
      if (rows.purchaseOrderItems.length > 0) {
        await db
          .insert(operationsPurchaseOrderItems)
          .values(rows.purchaseOrderItems);
      }
      if (rows.inventoryAssets.length > 0) {
        await db.insert(inventoryAssets).values(rows.inventoryAssets);
      }
      if (rows.inventoryMovements.length > 0) {
        await db.insert(inventoryMovements).values(rows.inventoryMovements);
      }
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'The backup contains invalid or incompatible company data',
      );
    }

    return {
      success: true,
      message: `Company data restored from ${backup.exportedAt}.`,
      counts: this.counts(rows),
    };
  }

  async resetData(
    organizationId: string,
    actorUserId: string,
    confirmation: string,
    ownerPassword: string,
  ): Promise<CompanyDataOperationResult> {
    const company = await this.findCompany(organizationId);
    this.assertConfirmation(confirmation, `RESET ${company.code}`);
    await this.ownerVerification.assertPassword(
      organizationId,
      actorUserId,
      ownerPassword,
    );
    const counts = await this.deleteOperationalData(organizationId);

    return {
      success: true,
      message: 'Company operational data was reset successfully.',
      counts,
    };
  }

  private async findCompany(organizationId: string) {
    const [company] = await db
      .select({
        id: organizations.id,
        code: organizations.code,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  private parseBackup(buffer: Buffer): ParsedCompanyBackup {
    let parsed: unknown;

    try {
      parsed = JSON.parse(buffer.toString('utf8')) as unknown;
    } catch {
      throw new BadRequestException('The selected file is not valid JSON');
    }

    if (!this.isRecord(parsed)) {
      throw new BadRequestException('Invalid company backup file');
    }

    const company = parsed.company;
    const data = parsed.data;

    if (
      parsed.format !== BACKUP_FORMAT ||
      parsed.version !== BACKUP_VERSION ||
      typeof parsed.exportedAt !== 'string' ||
      !this.isRecord(company) ||
      typeof company.id !== 'string' ||
      typeof company.code !== 'string' ||
      typeof company.name !== 'string' ||
      !this.isRecord(data)
    ) {
      throw new BadRequestException(
        'Unsupported or incomplete company backup file',
      );
    }

    const requiredCollections = [
      'pipelineStages',
      'customers',
      'customerContacts',
      'leads',
      'opportunities',
    ] as const;

    for (const collection of requiredCollections) {
      const value = data[collection];

      if (!Array.isArray(value) || !value.every((row) => this.isRecord(row))) {
        throw new BadRequestException(
          `Backup collection ${collection} is invalid`,
        );
      }
    }

    for (const collection of [
      'inventoryAssets',
      'inventoryMovements',
      'categories',
      'units',
      'vendors',
      'products',
      'purchaseOrders',
      'purchaseOrderItems',
    ] as const) {
      const value = data[collection];
      if (
        value !== undefined &&
        (!Array.isArray(value) || !value.every((row) => this.isRecord(row)))
      ) {
        throw new BadRequestException(
          `Backup collection ${collection} is invalid`,
        );
      }
    }

    return parsed as unknown as ParsedCompanyBackup;
  }

  private normalizeBackup(
    backup: ParsedCompanyBackup,
    organizationId: string,
  ): {
    pipelineStages: NewSalesPipelineStage[];
    customers: NewSalesCustomer[];
    customerContacts: NewSalesCustomerContact[];
    leads: NewSalesLead[];
    opportunities: NewSalesOpportunity[];
    inventoryAssets: NewInventoryAsset[];
    inventoryMovements: NewInventoryMovement[];
    categories: NewOperationsCategory[];
    units: NewOperationsUnit[];
    vendors: NewOperationsVendor[];
    products: NewOperationsProduct[];
    purchaseOrders: NewOperationsPurchaseOrder[];
    purchaseOrderItems: NewOperationsPurchaseOrderItem[];
  } {
    return {
      pipelineStages: backup.data.pipelineStages.map((row) =>
        this.normalizeRow<NewSalesPipelineStage>(row, organizationId),
      ),
      customers: backup.data.customers.map((row) =>
        this.normalizeRow<NewSalesCustomer>(row, organizationId),
      ),
      customerContacts: backup.data.customerContacts.map((row) =>
        this.normalizeRow<NewSalesCustomerContact>(row, organizationId),
      ),
      leads: backup.data.leads.map((row) =>
        this.normalizeRow<NewSalesLead>(row, organizationId),
      ),
      opportunities: backup.data.opportunities.map((row) =>
        this.normalizeRow<NewSalesOpportunity>(row, organizationId),
      ),
      inventoryAssets: (backup.data.inventoryAssets ?? []).map((row) =>
        this.normalizeRow<NewInventoryAsset>(row, organizationId),
      ),
      inventoryMovements: (backup.data.inventoryMovements ?? []).map((row) =>
        this.normalizeRow<NewInventoryMovement>(row, organizationId),
      ),
      categories: (backup.data.categories ?? []).map((row) =>
        this.normalizeRow<NewOperationsCategory>(row, organizationId),
      ),
      units: (backup.data.units ?? []).map((row) =>
        this.normalizeRow<NewOperationsUnit>(row, organizationId),
      ),
      vendors: (backup.data.vendors ?? []).map((row) =>
        this.normalizeRow<NewOperationsVendor>(row, organizationId),
      ),
      products: (backup.data.products ?? []).map((row) =>
        this.normalizeRow<NewOperationsProduct>(row, organizationId),
      ),
      purchaseOrders: (backup.data.purchaseOrders ?? []).map((row) =>
        this.normalizeRow<NewOperationsPurchaseOrder>(row, organizationId),
      ),
      purchaseOrderItems: (backup.data.purchaseOrderItems ?? []).map((row) =>
        this.normalizeRow<NewOperationsPurchaseOrderItem>(row, organizationId),
      ),
    };
  }

  private normalizeRow<T>(row: BackupRecord, organizationId: string): T {
    const normalized: BackupRecord = {
      ...row,
      tenantId: organizationId,
    };

    for (const field of [
      'createdAt',
      'updatedAt',
      'deletedAt',
      'convertedAt',
      'closedAt',
      'deliveryDate',
    ]) {
      const value = normalized[field];

      if (typeof value === 'string') {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          throw new BadRequestException(`Backup field ${field} is invalid`);
        }

        normalized[field] = date;
      }
    }

    return normalized as T;
  }

  private async assertInternalReferences(
    rows: {
      pipelineStages: NewSalesPipelineStage[];
      customers: NewSalesCustomer[];
      customerContacts: NewSalesCustomerContact[];
      leads: NewSalesLead[];
      opportunities: NewSalesOpportunity[];
      inventoryAssets: NewInventoryAsset[];
      inventoryMovements: NewInventoryMovement[];
      categories: NewOperationsCategory[];
      units: NewOperationsUnit[];
      vendors: NewOperationsVendor[];
      products: NewOperationsProduct[];
      purchaseOrders: NewOperationsPurchaseOrder[];
      purchaseOrderItems: NewOperationsPurchaseOrderItem[];
    },
    organizationId: string,
  ): Promise<void> {
    const stageIds = new Set(rows.pipelineStages.map((row) => row.id));
    const customerIds = new Set(rows.customers.map((row) => row.id));
    const leadIds = new Set(rows.leads.map((row) => row.id));
    const inventoryAssetIds = new Set(
      rows.inventoryAssets.map((row) => row.id),
    );
    const categoryIds = new Set(rows.categories.map((row) => row.id));
    const unitIds = new Set(rows.units.map((row) => row.id));
    const vendorIds = new Set(rows.vendors.map((row) => row.id));
    const productIds = new Set(rows.products.map((row) => row.id));
    const purchaseOrderIds = new Set(rows.purchaseOrders.map((row) => row.id));

    if (
      rows.customerContacts.some((row) => !customerIds.has(row.customerId)) ||
      rows.opportunities.some(
        (row) =>
          !stageIds.has(row.stageId) ||
          (row.customerId !== null &&
            row.customerId !== undefined &&
            !customerIds.has(row.customerId)) ||
          (row.leadId !== null &&
            row.leadId !== undefined &&
            !leadIds.has(row.leadId)),
      ) ||
      rows.inventoryMovements.some(
        (row) => !inventoryAssetIds.has(row.assetId),
      ) ||
      rows.products.some(
        (row) =>
          !categoryIds.has(row.categoryId) ||
          !unitIds.has(row.unitId) ||
          (row.defaultVendorId !== null &&
            row.defaultVendorId !== undefined &&
            !vendorIds.has(row.defaultVendorId)),
      ) ||
      rows.purchaseOrders.some((row) => !vendorIds.has(row.vendorId)) ||
      rows.purchaseOrderItems.some(
        (row) =>
          !purchaseOrderIds.has(row.purchaseOrderId) ||
          (row.productId !== null &&
            row.productId !== undefined &&
            !productIds.has(row.productId)),
      )
    ) {
      throw new BadRequestException(
        'The backup contains broken operational relationships',
      );
    }

    const referencedUserIds = new Set<string>();

    for (const row of [
      ...rows.pipelineStages,
      ...rows.customers,
      ...rows.customerContacts,
      ...rows.leads,
      ...rows.opportunities,
      ...rows.inventoryAssets,
      ...rows.inventoryMovements,
      ...rows.categories,
      ...rows.units,
      ...rows.vendors,
      ...rows.products,
      ...rows.purchaseOrders,
      ...rows.purchaseOrderItems,
    ]) {
      for (const field of [
        'createdBy',
        'updatedBy',
        'ownerUserId',
        'performedBy',
      ] as const) {
        const value = row[field as keyof typeof row];
        if (typeof value === 'string') referencedUserIds.add(value);
      }
    }

    if (referencedUserIds.size === 0) return;

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          inArray(users.id, [...referencedUserIds]),
        ),
      );
    const existingUserIds = new Set(existingUsers.map((user) => user.id));

    for (const row of [
      ...rows.pipelineStages,
      ...rows.customers,
      ...rows.customerContacts,
      ...rows.leads,
      ...rows.opportunities,
      ...rows.inventoryAssets,
      ...rows.inventoryMovements,
      ...rows.categories,
      ...rows.units,
      ...rows.vendors,
      ...rows.products,
      ...rows.purchaseOrders,
      ...rows.purchaseOrderItems,
    ] as Array<Record<string, unknown>>) {
      for (const field of [
        'createdBy',
        'updatedBy',
        'ownerUserId',
        'performedBy',
      ]) {
        const value = row[field];
        if (typeof value === 'string' && !existingUserIds.has(value)) {
          row[field] = null;
        }
      }
    }
  }

  private async deleteOperationalData(
    organizationId: string,
  ): Promise<CompanyDataCounts> {
    const movementRows = await db
      .delete(inventoryMovements)
      .where(eq(inventoryMovements.tenantId, organizationId))
      .returning({ id: inventoryMovements.id });
    const assetRows = await db
      .delete(inventoryAssets)
      .where(eq(inventoryAssets.tenantId, organizationId))
      .returning({ id: inventoryAssets.id });
    const purchaseOrderItemRows = await db
      .delete(operationsPurchaseOrderItems)
      .where(eq(operationsPurchaseOrderItems.tenantId, organizationId))
      .returning({ id: operationsPurchaseOrderItems.id });
    const purchaseOrderRows = await db
      .delete(operationsPurchaseOrders)
      .where(eq(operationsPurchaseOrders.tenantId, organizationId))
      .returning({ id: operationsPurchaseOrders.id });
    const productRows = await db
      .delete(operationsProducts)
      .where(eq(operationsProducts.tenantId, organizationId))
      .returning({ id: operationsProducts.id });
    const vendorRows = await db
      .delete(operationsVendors)
      .where(eq(operationsVendors.tenantId, organizationId))
      .returning({ id: operationsVendors.id });
    const unitRows = await db
      .delete(operationsUnits)
      .where(eq(operationsUnits.tenantId, organizationId))
      .returning({ id: operationsUnits.id });
    const categoryRows = await db
      .delete(operationsCategories)
      .where(eq(operationsCategories.tenantId, organizationId))
      .returning({ id: operationsCategories.id });
    const opportunities = await db
      .delete(salesOpportunities)
      .where(eq(salesOpportunities.tenantId, organizationId))
      .returning({ id: salesOpportunities.id });
    const customerContacts = await db
      .delete(salesCustomerContacts)
      .where(eq(salesCustomerContacts.tenantId, organizationId))
      .returning({ id: salesCustomerContacts.id });
    const customers = await db
      .delete(salesCustomers)
      .where(eq(salesCustomers.tenantId, organizationId))
      .returning({ id: salesCustomers.id });
    const leads = await db
      .delete(salesLeads)
      .where(eq(salesLeads.tenantId, organizationId))
      .returning({ id: salesLeads.id });
    const pipelineStages = await db
      .delete(salesPipelineStages)
      .where(eq(salesPipelineStages.tenantId, organizationId))
      .returning({ id: salesPipelineStages.id });

    return {
      pipelineStages: pipelineStages.length,
      customers: customers.length,
      customerContacts: customerContacts.length,
      leads: leads.length,
      opportunities: opportunities.length,
      inventoryAssets: assetRows.length,
      inventoryMovements: movementRows.length,
      categories: categoryRows.length,
      units: unitRows.length,
      vendors: vendorRows.length,
      products: productRows.length,
      purchaseOrders: purchaseOrderRows.length,
      purchaseOrderItems: purchaseOrderItemRows.length,
    };
  }

  private counts(data: {
    pipelineStages:
      readonly SalesPipelineStage[] | readonly NewSalesPipelineStage[];
    customers: readonly SalesCustomer[] | readonly NewSalesCustomer[];
    customerContacts:
      readonly SalesCustomerContact[] | readonly NewSalesCustomerContact[];
    leads: readonly SalesLead[] | readonly NewSalesLead[];
    opportunities: readonly SalesOpportunity[] | readonly NewSalesOpportunity[];
    inventoryAssets: readonly InventoryAsset[] | readonly NewInventoryAsset[];
    inventoryMovements:
      readonly InventoryMovement[] | readonly NewInventoryMovement[];
    categories:
      readonly OperationsCategory[] | readonly NewOperationsCategory[];
    units: readonly OperationsUnit[] | readonly NewOperationsUnit[];
    vendors: readonly OperationsVendor[] | readonly NewOperationsVendor[];
    products: readonly OperationsProduct[] | readonly NewOperationsProduct[];
    purchaseOrders:
      | readonly OperationsPurchaseOrder[]
      | readonly NewOperationsPurchaseOrder[];
    purchaseOrderItems:
      | readonly OperationsPurchaseOrderItem[]
      | readonly NewOperationsPurchaseOrderItem[];
  }): CompanyDataCounts {
    return {
      pipelineStages: data.pipelineStages.length,
      customers: data.customers.length,
      customerContacts: data.customerContacts.length,
      leads: data.leads.length,
      opportunities: data.opportunities.length,
      inventoryAssets: data.inventoryAssets.length,
      inventoryMovements: data.inventoryMovements.length,
      categories: data.categories.length,
      units: data.units.length,
      vendors: data.vendors.length,
      products: data.products.length,
      purchaseOrders: data.purchaseOrders.length,
      purchaseOrderItems: data.purchaseOrderItems.length,
    };
  }

  private assertConfirmation(actual: string, expected: string): void {
    if (actual.trim() !== expected) {
      throw new BadRequestException(`Type ${expected} to confirm this action`);
    }
  }

  private isRecord(value: unknown): value is BackupRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
