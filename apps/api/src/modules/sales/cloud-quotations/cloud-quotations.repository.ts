import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';

import {
  db,
  salesCloudQuotationItems,
  salesCloudQuotations,
  type NewSalesCloudQuotationItem,
} from '@erp/db';

@Injectable()
export class CloudQuotationsRepository {
  async list(tenantId: string) {
    return db
      .select({
        id: salesCloudQuotations.id,
        quotationNumber: salesCloudQuotations.quotationNumber,
        customerName: salesCloudQuotations.customerName,
        quotationDate: salesCloudQuotations.issueDate,
        expiryDate: salesCloudQuotations.expiryDate,
        currency: salesCloudQuotations.currency,
        totalAmount: salesCloudQuotations.totalAmount,
      })
      .from(salesCloudQuotations)
      .where(eq(salesCloudQuotations.tenantId, tenantId))
      .orderBy(desc(salesCloudQuotations.createdAt), desc(salesCloudQuotations.id));
  }

  async findHeader(tenantId: string, id: string) {
    const [row] = await db
      .select()
      .from(salesCloudQuotations)
      .where(
        and(
          eq(salesCloudQuotations.tenantId, tenantId),
          eq(salesCloudQuotations.id, id),
        ),
      )
      .limit(1);
    return row;
  }

  async findItems(tenantId: string, quotationId: string) {
    return db
      .select({
        id: salesCloudQuotationItems.id,
        serviceType: salesCloudQuotationItems.serviceType,
        itemName: salesCloudQuotationItems.itemName,
        description: salesCloudQuotationItems.description,
        quantity: salesCloudQuotationItems.quantity,
        unitPrice: salesCloudQuotationItems.unitPrice,
      })
      .from(salesCloudQuotationItems)
      .where(
        and(
          eq(salesCloudQuotationItems.tenantId, tenantId),
          eq(salesCloudQuotationItems.quotationId, quotationId),
        ),
      )
      .orderBy(asc(salesCloudQuotationItems.sortOrder), asc(salesCloudQuotationItems.id));
  }

  async create(
    header: typeof salesCloudQuotations.$inferInsert,
    items: NewSalesCloudQuotationItem[],
  ) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salesCloudQuotations)
        .values(header)
        .returning({ id: salesCloudQuotations.id });
      if (!created) throw new Error('MISSING_CLOUD_QUOTATION');
      if (items.length) {
        await tx.insert(salesCloudQuotationItems).values(
          items.map((item) => ({ ...item, quotationId: created.id })),
        );
      }
      return created;
    });
  }

  async update(
    tenantId: string,
    id: string,
    header: Partial<typeof salesCloudQuotations.$inferInsert>,
    items: NewSalesCloudQuotationItem[],
  ) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(salesCloudQuotations)
        .set({ ...header, updatedAt: new Date() })
        .where(
          and(
            eq(salesCloudQuotations.tenantId, tenantId),
            eq(salesCloudQuotations.id, id),
          ),
        )
        .returning({ id: salesCloudQuotations.id });
      if (!updated) return undefined;
      await tx
        .delete(salesCloudQuotationItems)
        .where(
          and(
            eq(salesCloudQuotationItems.tenantId, tenantId),
            eq(salesCloudQuotationItems.quotationId, id),
          ),
        );
      if (items.length) await tx.insert(salesCloudQuotationItems).values(items);
      return updated;
    });
  }

  async purge(tenantId: string, id: string) {
    const [removed] = await db
      .delete(salesCloudQuotations)
      .where(
        and(
          eq(salesCloudQuotations.tenantId, tenantId),
          eq(salesCloudQuotations.id, id),
        ),
      )
      .returning({ id: salesCloudQuotations.id });
    return removed;
  }
}
