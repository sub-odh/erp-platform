import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import {
  db,
  financeInvoiceItems,
  financeInvoices,
  hrEmployees,
  inventoryAssets,
  inventoryMovements,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesCustomers,
  salesLeads,
  users,
} from '@erp/db';

export interface CreateDeliveryOrderInput {
  tenantId: string;
  actorUserId: string;
  deliveryNumber: string;
  deliveryDate: string;
  customerName: string;
  customerId?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  billable?: boolean;
  returnValidityDays?: number;
  sourceBillNo?: string;
  soldById?: string;
  leadId?: string;
  discountValue?: number;
  discountType?: string;
  taxable?: boolean;
  items: Array<{
    assetId?: string;
    serviceName?: string;
    quantity: number;
    unitPrice?: number;
  }>;
}

@Injectable()
export class DeliveryOrdersRepository {
  async list(tenantId: string) {
    const soldFirst = sql<string | null>`max(${hrEmployees.firstName})`;
    const soldLast = sql<string | null>`max(${hrEmployees.lastName})`;
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        deliveryDate: operationsDeliveryOrders.deliveryDate,
        customerName: operationsDeliveryOrders.customerName,
        contactName: operationsDeliveryOrders.contactName,
        isBillable: operationsDeliveryOrders.isBillable,
        isVoided: operationsDeliveryOrders.isVoided,
        status: operationsDeliveryOrders.status,
        grandTotal: sql<string>`coalesce(nullif(${operationsDeliveryOrders.grandTotal}, 0), sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)`,
        soldByName: sql<string | null>`nullif(trim(concat(${soldFirst}, ' ', ${soldLast})), '')`,
        soldByDesignation: sql<string | null>`max(${hrEmployees.designation})`,
        soldByPhoto: sql<string | null>`max(${hrEmployees.photoUrl})`,
        invoiceId: sql<string | null>`max(${financeInvoices.id}::text)`,
        invoiceNumber: sql<string | null>`max(${financeInvoices.invoiceNumber})`,
        createdAt: operationsDeliveryOrders.createdAt,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .leftJoin(
        financeInvoices,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .leftJoin(
        hrEmployees,
        eq(hrEmployees.id, operationsDeliveryOrders.soldById),
      )
      .where(eq(operationsDeliveryOrders.tenantId, tenantId))
      .groupBy(operationsDeliveryOrders.id)
      .orderBy(desc(operationsDeliveryOrders.createdAt));
  }

  async listAvailableAssets(tenantId: string) {
    return db
      .select({
        id: inventoryAssets.id,
        itemName: inventoryAssets.itemName,
        category: inventoryAssets.category,
        serialNumber: inventoryAssets.serialNumber,
        stockQuantity: inventoryAssets.stockQuantity,
        mrpPrice: inventoryAssets.mrpPrice,
      })
      .from(inventoryAssets)
      .where(
        and(
          eq(inventoryAssets.tenantId, tenantId),
          isNull(inventoryAssets.deletedAt),
          gt(inventoryAssets.stockQuantity, 0),
          inArray(inventoryAssets.status, ['IN_STOCK', 'AVAILABLE', 'RETURNED']),
        ),
      )
      .orderBy(inventoryAssets.itemName, inventoryAssets.serialNumber);
  }

  async lookups(tenantId: string) {
    const [salespeople, leads] = await Promise.all([
      db
        .select({
          id: hrEmployees.id,
          firstName: hrEmployees.firstName,
          lastName: hrEmployees.lastName,
          designation: hrEmployees.designation,
        })
        .from(hrEmployees)
        .where(
          and(
            eq(hrEmployees.tenantId, tenantId),
            eq(hrEmployees.hasSalesTarget, true),
            eq(hrEmployees.status, 'ACTIVE'),
          ),
        )
        .orderBy(hrEmployees.firstName, hrEmployees.lastName)
        .limit(200),
      db
        .select({
          id: salesLeads.id,
          companyName: salesLeads.companyName,
          jobTitle: salesLeads.jobTitle,
          firstName: salesLeads.firstName,
          lastName: salesLeads.lastName,
        })
        .from(salesLeads)
        .where(eq(salesLeads.tenantId, tenantId))
        .orderBy(salesLeads.companyName)
        .limit(100),
    ]);
    return { salespeople, leads };
  }

  async latestNumber(
    tenantId: string,
    year: number,
  ): Promise<string | undefined> {
    const [row] = await db
      .select({ deliveryNumber: operationsDeliveryOrders.deliveryNumber })
      .from(operationsDeliveryOrders)
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          sql`${operationsDeliveryOrders.deliveryNumber} like ${`DO-${year}-%`}`,
        ),
      )
      .orderBy(
        desc(
          sql`coalesce(nullif(split_part(${operationsDeliveryOrders.deliveryNumber}, '-', 3), '')::int, 0)`,
        ),
      )
      .limit(1);
    return row?.deliveryNumber;
  }

  async findActor(tenantId: string, userId: string) {
    const [row] = await db
      .select({ passwordHash: users.passwordHash, role: users.role })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.organizationId, tenantId)))
      .limit(1);
    return row;
  }

  async findDetails(tenantId: string, id: string) {
    const [order] = await db
      .select()
      .from(operationsDeliveryOrders)
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.id, id),
        ),
      )
      .limit(1);
    if (!order) return undefined;
    const itemRows = await db
      .select({
        item: operationsDeliveryOrderItems,
        modelNumber: inventoryAssets.modelNumber,
        assetStatus: inventoryAssets.status,
      })
      .from(operationsDeliveryOrderItems)
      .leftJoin(
        inventoryAssets,
        eq(inventoryAssets.id, operationsDeliveryOrderItems.assetId),
      )
      .where(eq(operationsDeliveryOrderItems.deliveryOrderId, id));
    const items = itemRows.map((row) => ({
      ...row.item,
      modelNumber: row.modelNumber,
      returned: row.assetStatus === 'RETURNED',
    }));
    const [salesperson] = order.soldById
      ? await db
          .select({
            id: hrEmployees.id,
            firstName: hrEmployees.firstName,
            lastName: hrEmployees.lastName,
            designation: hrEmployees.designation,
            photoUrl: hrEmployees.photoUrl,
          })
          .from(hrEmployees)
          .where(eq(hrEmployees.id, order.soldById))
          .limit(1)
      : [];
    const creators = alias(hrEmployees, 'delivery_creators');
    const [creator] = order.createdBy
      ? await db
          .select({
            name: sql<string>`trim(concat(coalesce(${creators.firstName}, ${users.firstName}, ''), ' ', coalesce(${creators.lastName}, ${users.lastName}, '')))`,
          })
          .from(users)
          .leftJoin(
            creators,
            and(eq(creators.userId, users.id), eq(creators.tenantId, tenantId)),
          )
          .where(eq(users.id, order.createdBy))
          .limit(1)
      : [];
    const [client] = order.customerId
      ? await db
          .select({
            name: salesCustomers.name,
            address: salesCustomers.address,
          })
          .from(salesCustomers)
          .where(eq(salesCustomers.id, order.customerId))
          .limit(1)
      : [];
    return {
      order: {
        ...order,
        customerName: client?.name || order.customerName,
        clientAddress: client?.address ?? order.deliveryAddress,
        creatorName: creator?.name?.trim() || 'Authorized Signatory',
      },
      items,
      salesperson: salesperson ?? null,
    };
  }

  async create(input: CreateDeliveryOrderInput) {
    return db.transaction(async (tx) => {
      const stockLines = input.items.filter((item) => item.assetId);
      const assetIds = stockLines.map((item) => item.assetId!);
      if (new Set(assetIds).size !== assetIds.length) {
        throw new Error('DUPLICATE_DELIVERY_ITEM');
      }

      const assets = assetIds.length
        ? await tx
            .select({
              id: inventoryAssets.id,
              itemName: inventoryAssets.itemName,
              serialNumber: inventoryAssets.serialNumber,
              stockQuantity: inventoryAssets.stockQuantity,
              mrpPrice: inventoryAssets.mrpPrice,
            })
            .from(inventoryAssets)
            .where(
              and(
                eq(inventoryAssets.tenantId, input.tenantId),
                isNull(inventoryAssets.deletedAt),
                inArray(inventoryAssets.id, assetIds),
              ),
            )
        : [];
      if (assets.length !== assetIds.length) {
        throw new Error('INVALID_DELIVERY_ITEM');
      }

      const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
      for (const item of stockLines) {
        const asset = assetsById.get(item.assetId!);
        if (!asset || item.quantity > asset.stockQuantity) {
          throw new Error(
            `INSUFFICIENT_STOCK:${asset?.itemName ?? 'item'}:${asset?.stockQuantity ?? 0}`,
          );
        }
      }

      const priced = input.items.map((item) => {
        if (item.assetId) {
          const asset = assetsById.get(item.assetId)!;
          const unitPrice = item.unitPrice ?? Number(asset.mrpPrice);
          return {
            assetId: asset.id,
            serviceName: null as string | null,
            itemName: asset.itemName,
            serialNumber: asset.serialNumber,
            quantity: item.quantity,
            unitPrice,
          };
        }
        const unitPrice = item.unitPrice ?? 0;
        return {
          assetId: null as string | null,
          serviceName: item.serviceName?.trim() || 'Service',
          itemName: item.serviceName?.trim() || 'Service',
          serialNumber: null as string | null,
          quantity: item.quantity,
          unitPrice,
        };
      });
      const money = this.totals(
        priced,
        input.discountValue ?? 0,
        input.discountType ?? 'percent',
        input.taxable !== false,
      );

      const [order] = await tx
        .insert(operationsDeliveryOrders)
        .values({
          tenantId: input.tenantId,
          deliveryNumber: input.deliveryNumber,
          deliveryDate: input.deliveryDate,
          customerId: input.customerId ?? null,
          customerName: input.customerName,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          deliveryAddress: input.deliveryAddress,
          notes: input.notes,
          status: 'Delivered',
          isBillable: input.billable === false ? 0 : 1,
          isTaxable: input.taxable === false ? 0 : 1,
          returnValidityDays: input.returnValidityDays ?? 365,
          sourceBillNo: input.sourceBillNo ?? null,
          discountValue: (input.discountValue ?? 0).toFixed(2),
          discountType:
            input.discountType === 'amount' || input.discountType === 'fixed'
              ? 'fixed'
              : 'percent',
          subtotalAmount: money.subtotal.toFixed(2),
          vatAmount: money.vat.toFixed(2),
          grandTotal: money.grand.toFixed(2),
          soldById: input.soldById ?? null,
          leadId: input.leadId ?? null,
          createdBy: input.actorUserId,
          deliveredBy: input.actorUserId,
        })
        .returning();
      if (!order) throw new Error('DELIVERY_CREATE_FAILED');

      await tx.insert(operationsDeliveryOrderItems).values(
        priced.map((item) => ({
          tenantId: input.tenantId,
          deliveryOrderId: order.id,
          assetId: item.assetId,
          serviceName: item.serviceName,
          itemName: item.itemName,
          serialNumber: item.serialNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: (item.unitPrice * item.quantity).toFixed(2),
        })),
      );

      for (const item of stockLines) {
        const asset = assetsById.get(item.assetId!)!;
        const remaining = asset.stockQuantity - item.quantity;
        const [updatedAsset] = await tx
          .update(inventoryAssets)
          .set({
            stockQuantity: sql`${inventoryAssets.stockQuantity} - ${item.quantity}`,
            soldQuantity: sql`${inventoryAssets.soldQuantity} + ${item.quantity}`,
            status: remaining === 0 ? 'SOLD' : 'IN_STOCK',
            clientName: input.customerName,
            deliveryDate: new Date(`${input.deliveryDate}T00:00:00`),
            updatedBy: input.actorUserId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventoryAssets.id, asset.id),
              eq(inventoryAssets.tenantId, input.tenantId),
              sql`${inventoryAssets.stockQuantity} >= ${item.quantity}`,
            ),
          )
          .returning({ id: inventoryAssets.id });
        if (!updatedAsset) {
          throw new Error(
            `INSUFFICIENT_STOCK:${asset.itemName}:${asset.stockQuantity}`,
          );
        }

        await tx.insert(inventoryMovements).values({
          tenantId: input.tenantId,
          assetId: asset.id,
          type: 'SALE',
          quantityDelta: -item.quantity,
          stockQuantityAfter: remaining,
          remarks: `Delivery order ${input.deliveryNumber} to ${input.customerName}`,
          performedBy: input.actorUserId,
        });
      }

      return order;
    });
  }

  async updateFinancials(
    tenantId: string,
    actorUserId: string,
    id: string,
    input: {
      deliveryDate: string;
      sourceBillNo?: string;
      soldById?: string;
      leadId?: string;
      discountValue: number;
      discountType: string;
      taxable: boolean;
      lines: Array<{ id: string; unitPrice: number }>;
    },
  ) {
    return db.transaction(async (tx) => {
      const [header] = await tx
        .select()
        .from(operationsDeliveryOrders)
        .where(
          and(
            eq(operationsDeliveryOrders.tenantId, tenantId),
            eq(operationsDeliveryOrders.id, id),
          ),
        )
        .limit(1);
      if (!header) return undefined;
      const items = await tx
        .select()
        .from(operationsDeliveryOrderItems)
        .where(
          and(
            eq(operationsDeliveryOrderItems.tenantId, tenantId),
            eq(operationsDeliveryOrderItems.deliveryOrderId, id),
          ),
        );
      const prices = new Map(input.lines.map((line) => [line.id, line.unitPrice]));
      const removed = items.filter((item) => !prices.has(item.id));
      if (removed.length) {
        await tx
          .delete(operationsDeliveryOrderItems)
          .where(
            inArray(
              operationsDeliveryOrderItems.id,
              removed.map((item) => item.id),
            ),
          );
      }
      const priced = items
        .filter((item) => prices.has(item.id))
        .map((item) => ({
          ...item,
          unitPrice: prices.get(item.id) ?? Number(item.unitPrice),
        }));
      const money = this.totals(
        priced.map((item) => ({
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        input.discountValue,
        input.discountType,
        input.taxable,
      );
      await tx
        .update(operationsDeliveryOrders)
        .set({
          deliveryDate: input.deliveryDate,
          sourceBillNo: input.sourceBillNo ?? null,
          soldById: input.soldById ?? null,
          leadId: input.leadId ?? null,
          discountValue: input.discountValue.toFixed(2),
          discountType:
            input.discountType === 'amount' || input.discountType === 'fixed'
              ? 'fixed'
              : 'percent',
          isTaxable: input.taxable ? 1 : 0,
          subtotalAmount: money.subtotal.toFixed(2),
          vatAmount: money.vat.toFixed(2),
          grandTotal: money.grand.toFixed(2),
        })
        .where(eq(operationsDeliveryOrders.id, id));
      for (const item of priced) {
        await tx
          .update(operationsDeliveryOrderItems)
          .set({
            unitPrice: item.unitPrice.toFixed(2),
            lineTotal: (item.unitPrice * item.quantity).toFixed(2),
          })
          .where(eq(operationsDeliveryOrderItems.id, item.id));
      }
      const invoiceId = await this.syncInvoice(tx, {
        tenantId,
        actorUserId,
        orderId: id,
        customerName: header.customerName,
        money,
        items: priced.map((item) => ({
          itemName: item.serviceName || item.itemName,
          serialNumber: item.serialNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      return { id, invoiceId };
    });
  }

  async voidOrder(tenantId: string, actorUserId: string, id: string) {
    return db.transaction(async (tx) => {
      const [invoice] = await tx
        .select({ id: financeInvoices.id })
        .from(financeInvoices)
        .where(
          and(
            eq(financeInvoices.tenantId, tenantId),
            eq(financeInvoices.deliveryOrderId, id),
          ),
        )
        .limit(1);
      if (invoice) throw new Error('INVOICE_EXISTS');
      const [order] = await tx
        .update(operationsDeliveryOrders)
        .set({
          isVoided: 1,
          status: 'Voided',
        })
        .where(
          and(
            eq(operationsDeliveryOrders.tenantId, tenantId),
            eq(operationsDeliveryOrders.id, id),
            eq(operationsDeliveryOrders.isVoided, 0),
          ),
        )
        .returning({ id: operationsDeliveryOrders.id });
      if (!order) return undefined;
      await this.restoreStock(tx, tenantId, actorUserId, id, 'void');
      return order;
    });
  }

  async purge(tenantId: string, actorUserId: string, id: string) {
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: operationsDeliveryOrders.id })
        .from(operationsDeliveryOrders)
        .where(
          and(
            eq(operationsDeliveryOrders.tenantId, tenantId),
            eq(operationsDeliveryOrders.id, id),
          ),
        )
        .limit(1);
      if (!order) return undefined;
      await tx
        .delete(financeInvoices)
        .where(
          and(
            eq(financeInvoices.tenantId, tenantId),
            eq(financeInvoices.deliveryOrderId, id),
          ),
        );
      await this.restoreStock(tx, tenantId, actorUserId, id, 'delete');
      await tx
        .delete(operationsDeliveryOrderItems)
        .where(eq(operationsDeliveryOrderItems.deliveryOrderId, id));
      await tx
        .delete(operationsDeliveryOrders)
        .where(eq(operationsDeliveryOrders.id, id));
      return order;
    });
  }

  private async restoreStock(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    tenantId: string,
    actorUserId: string,
    orderId: string,
    reason: 'void' | 'delete',
  ) {
    const lines = await tx
      .select()
      .from(operationsDeliveryOrderItems)
      .where(eq(operationsDeliveryOrderItems.deliveryOrderId, orderId));
    for (const line of lines) {
      if (!line.assetId) continue;
      const [asset] = await tx
        .update(inventoryAssets)
        .set({
          stockQuantity: sql`${inventoryAssets.stockQuantity} + ${line.quantity}`,
          soldQuantity: sql`greatest(0, ${inventoryAssets.soldQuantity} - ${line.quantity})`,
          status: 'IN_STOCK',
          clientName: null,
          deliveryDate: null,
          updatedBy: actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryAssets.id, line.assetId),
            eq(inventoryAssets.tenantId, tenantId),
          ),
        )
        .returning({ stockQuantity: inventoryAssets.stockQuantity });
      if (!asset) continue;
      await tx.insert(inventoryMovements).values({
        tenantId,
        assetId: line.assetId,
        type: 'RETURN',
        quantityDelta: line.quantity,
        stockQuantityAfter: asset.stockQuantity,
        remarks:
          reason === 'void'
            ? `Delivery order voided; stock restored`
            : `Delivery order deleted; stock restored`,
        performedBy: actorUserId,
      });
    }
  }

  private async syncInvoice(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    input: {
      tenantId: string;
      actorUserId: string;
      orderId: string;
      customerName: string;
      money: { subtotal: number; vat: number; grand: number };
      items: Array<{
        itemName: string;
        serialNumber: string | null;
        quantity: number;
        unitPrice: number;
      }>;
    },
  ) {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [existing] = await tx
      .select({ id: financeInvoices.id })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, input.tenantId),
          eq(financeInvoices.deliveryOrderId, input.orderId),
        ),
      )
      .limit(1);
    let invoiceId = existing?.id;
    if (invoiceId) {
      await tx
        .update(financeInvoices)
        .set({
          customerName: input.customerName,
          invoiceDate: today,
          subtotalAmount: input.money.subtotal.toFixed(2),
          vatAmount: input.money.vat.toFixed(2),
          totalAmount: input.money.grand.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(financeInvoices.id, invoiceId));
      await tx
        .delete(financeInvoiceItems)
        .where(eq(financeInvoiceItems.invoiceId, invoiceId));
    } else {
      const year = Number(today.slice(0, 4));
      const [latest] = await tx
        .select({ invoiceNumber: financeInvoices.invoiceNumber })
        .from(financeInvoices)
        .where(
          and(
            eq(financeInvoices.tenantId, input.tenantId),
            sql`${financeInvoices.invoiceNumber} like ${`INV-${year}-%`}`,
          ),
        )
        .orderBy(desc(financeInvoices.invoiceNumber))
        .limit(1);
      const suffix = latest ? Number(latest.invoiceNumber.split('-').at(-1)) : 0;
      const invoiceNumber = `INV-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
      const [created] = await tx
        .insert(financeInvoices)
        .values({
          tenantId: input.tenantId,
          invoiceNumber,
          deliveryOrderId: input.orderId,
          customerName: input.customerName,
          invoiceDate: today,
          subtotalAmount: input.money.subtotal.toFixed(2),
          vatAmount: input.money.vat.toFixed(2),
          totalAmount: input.money.grand.toFixed(2),
          paidAmount: '0.00',
          status: 'UNPAID',
          createdBy: input.actorUserId,
        })
        .returning({ id: financeInvoices.id });
      if (!created) throw new Error('INVOICE_CREATE_FAILED');
      invoiceId = created.id;
    }
    if (input.items.length) {
      await tx.insert(financeInvoiceItems).values(
        input.items.map((item) => ({
          tenantId: input.tenantId,
          invoiceId,
          itemName: item.itemName,
          serialNumber: item.serialNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: (item.unitPrice * item.quantity).toFixed(2),
        })),
      );
    }
    return invoiceId;
  }

  private totals(
    lines: Array<{ unitPrice: number; quantity: number }>,
    discountValue: number,
    discountType: string,
    taxable: boolean,
  ) {
    const subtotal = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    const discount =
      discountType === 'percent'
        ? (subtotal * discountValue) / 100
        : discountValue;
    const base = Math.max(0, subtotal - discount);
    const vat = taxable ? Math.round(base * 0.13 * 100) / 100 : 0;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vat,
      grand: Math.round((base + vat) * 100) / 100,
    };
  }
}
