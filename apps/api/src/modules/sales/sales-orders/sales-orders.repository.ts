import { Injectable } from '@nestjs/common';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';

import {
  db,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesOpportunities,
  users,
} from '@erp/db';

@Injectable()
export class SalesOrdersRepository {
  async listConfirmedSalesOrders(tenantId: string, fromDate: string) {
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryDate: operationsDeliveryOrders.deliveryDate,
        deliveredBy: operationsDeliveryOrders.deliveredBy,
        firstName: users.firstName,
        lastName: users.lastName,
        totalValue: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)::numeric`,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .leftJoin(users, eq(users.id, operationsDeliveryOrders.deliveredBy))
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          gte(operationsDeliveryOrders.deliveryDate, fromDate),
        ),
      )
      .groupBy(
        operationsDeliveryOrders.id,
        operationsDeliveryOrders.deliveryDate,
        operationsDeliveryOrders.deliveredBy,
        users.firstName,
        users.lastName,
      );
  }

  async listWonDeals(tenantId: string, fromDate: string) {
    return db
      .select({
        id: salesOpportunities.id,
        amount: salesOpportunities.amount,
        closedAt: salesOpportunities.closedAt,
        createdAt: salesOpportunities.createdAt,
        ownerUserId: salesOpportunities.ownerUserId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(salesOpportunities)
      .leftJoin(users, eq(users.id, salesOpportunities.ownerUserId))
      .where(
        and(
          eq(salesOpportunities.tenantId, tenantId),
          eq(salesOpportunities.status, 'WON'),
          isNull(salesOpportunities.deletedAt),
          sql`coalesce(${salesOpportunities.closedAt}, ${salesOpportunities.createdAt}) >= ${fromDate}::date`,
        ),
      );
  }
}
