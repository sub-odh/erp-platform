import { Injectable } from '@nestjs/common';

import { SalesOrdersRepository } from './sales-orders.repository';

export interface SalesOrderReportMonth {
  key: string;
  label: string;
  salesOrderValue: number;
  salesOrderCount: number;
  wonDealValue: number;
  staffSalesOrders: SalesOrderStaffRow[];
  staffWonDeals: SalesOrderStaffRow[];
}

export interface SalesOrderStaffRow {
  userId: string | null;
  name: string;
  amount: number;
}

export interface SalesOrderWonStaffRow extends SalesOrderStaffRow {
  vsTargetPercent: number;
}

export interface SalesOrderReport {
  months: SalesOrderReportMonth[];
  staffSalesOrders: SalesOrderStaffRow[];
  staffWonDeals: SalesOrderWonStaffRow[];
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class SalesOrdersService {
  constructor(private readonly repository: SalesOrdersRepository) {}

  async report(tenantId: string): Promise<SalesOrderReport> {
    const months = this.lastTwelveMonths();
    const fromDate = `${months[0].key}-01`;

    const [orders, deals] = await Promise.all([
      this.repository.listConfirmedSalesOrders(tenantId, fromDate),
      this.repository.listWonDeals(tenantId, fromDate),
    ]);

    const monthMap = new Map(months.map((month) => [month.key, month]));
    const monthSalesByStaff = new Map<
      string,
      Map<string, SalesOrderStaffRow>
    >();
    const monthWonByStaff = new Map<string, Map<string, SalesOrderStaffRow>>();
    const salesByStaff = new Map<string, SalesOrderStaffRow>();
    const wonByStaff = new Map<string, SalesOrderStaffRow>();

    for (const order of orders) {
      const monthKey = this.yearMonth(order.deliveryDate);
      const month = monthMap.get(monthKey);
      const value = this.money(order.totalValue);
      const name = this.displayName(order.firstName, order.lastName);
      if (month) {
        month.salesOrderValue += value;
        month.salesOrderCount += 1;
        this.addStaffAmount(
          this.staffBucket(monthSalesByStaff, monthKey),
          order.deliveredBy,
          name,
          value,
        );
      }
      this.addStaffAmount(salesByStaff, order.deliveredBy, name, value);
    }

    for (const deal of deals) {
      const occurred = deal.closedAt ?? deal.createdAt;
      const monthKey = this.yearMonth(occurred);
      const month = monthMap.get(monthKey);
      const value = this.money(deal.amount);
      const name = this.displayName(deal.firstName, deal.lastName);
      if (month) {
        month.wonDealValue += value;
        this.addStaffAmount(
          this.staffBucket(monthWonByStaff, monthKey),
          deal.ownerUserId,
          name,
          value,
        );
      }
      this.addStaffAmount(wonByStaff, deal.ownerUserId, name, value);
    }

    for (const month of months) {
      month.staffSalesOrders = this.sortedStaff(
        monthSalesByStaff.get(month.key),
      );
      month.staffWonDeals = this.sortedStaff(monthWonByStaff.get(month.key));
    }

    const staffWonDeals = this.sortedStaff(wonByStaff);
    const wonTotal = staffWonDeals.reduce((sum, row) => sum + row.amount, 0);

    return {
      months,
      staffSalesOrders: this.sortedStaff(salesByStaff),
      staffWonDeals: staffWonDeals.map((row) => ({
        ...row,
        vsTargetPercent:
          wonTotal > 0 ? Math.round((row.amount / wonTotal) * 100) : 0,
      })),
    };
  }

  private lastTwelveMonths(now = new Date()): SalesOrderReportMonth[] {
    const months: SalesOrderReportMonth[] = [];
    const cursor = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    cursor.setUTCMonth(cursor.getUTCMonth() - 11);
    for (let index = 0; index < 12; index += 1) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      months.push({
        key: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: MONTH_LABELS[month],
        salesOrderValue: 0,
        salesOrderCount: 0,
        wonDealValue: 0,
        staffSalesOrders: [],
        staffWonDeals: [],
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return months;
  }

  private staffBucket(
    buckets: Map<string, Map<string, SalesOrderStaffRow>>,
    monthKey: string,
  ): Map<string, SalesOrderStaffRow> {
    const existing = buckets.get(monthKey);
    if (existing) return existing;
    const created = new Map<string, SalesOrderStaffRow>();
    buckets.set(monthKey, created);
    return created;
  }

  private sortedStaff(
    bucket: Map<string, SalesOrderStaffRow> | undefined,
  ): SalesOrderStaffRow[] {
    return [...(bucket?.values() ?? [])].sort(
      (left, right) => right.amount - left.amount,
    );
  }

  private addStaffAmount(
    bucket: Map<string, SalesOrderStaffRow>,
    userId: string | null,
    name: string,
    amount: number,
  ): void {
    const key = userId ?? 'unassigned';
    const current = bucket.get(key);
    if (current) {
      current.amount += amount;
      return;
    }
    bucket.set(key, { userId, name, amount });
  }

  private displayName(
    firstName: string | null,
    lastName: string | null,
  ): string {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    return name || 'Unassigned';
  }

  private yearMonth(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 7);
    }
    return String(value).slice(0, 7);
  }

  private money(value: string | number): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  }
}
