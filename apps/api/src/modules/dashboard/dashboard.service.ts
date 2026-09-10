import { Injectable } from '@nestjs/common';

import { DashboardRepository } from './dashboard.repository';
import {
  fillDailySeries,
  fillMonthlySeries,
  isoDate,
  isoMonth,
  isYearMonth,
  startOfUtcDay,
} from './dashboard.series';

export const MONTHLY_SALES_TARGET = 100_000;
export const YEARLY_SALES_TARGET = 1_200_000;

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async overview(
    tenantId: string,
    filters: { invMonth?: string; salesMonth?: string },
  ) {
    const now = startOfUtcDay();
    const currentMonth = isoMonth(now);
    const invMonth = isYearMonth(filters.invMonth)
      ? filters.invMonth
      : currentMonth;
    const salesMonth = isYearMonth(filters.salesMonth)
      ? filters.salesMonth
      : currentMonth;

    const from90 = new Date(now);
    from90.setUTCDate(from90.getUTCDate() - 89);
    const fromYear = new Date(now);
    fromYear.setUTCMonth(fromYear.getUTCMonth() - 11);
    fromYear.setUTCDate(1);

    const [
      availableInventory,
      totalDue,
      dailySales,
      monthlySales,
      invoicedMonth,
      invoicedYear,
      crmWon,
      distribution,
      debtors,
    ] = await Promise.all([
      this.repository.availableInventory(tenantId),
      this.repository.outstandingDue(tenantId),
      this.repository.salesByDay(tenantId, isoDate(from90)),
      this.repository.salesByMonth(tenantId, isoMonth(fromYear)),
      this.repository.invoicedInMonth(tenantId, salesMonth),
      this.repository.invoicedInYear(tenantId, now.getUTCFullYear()),
      this.repository.wonDealsInMonth(tenantId, salesMonth),
      this.repository.invoiceDistribution(tenantId, currentMonth),
      this.repository.topDebtors(tenantId),
    ]);

    const inventoryAchievement =
      invMonth === salesMonth
        ? invoicedMonth
        : await this.repository.invoicedInMonth(tenantId, invMonth);

    const yearTrend = fillMonthlySeries(12, monthlySales);
    const last7 = fillDailySeries(7, dailySales);
    const last30 = fillDailySeries(30, dailySales);
    const last90 = fillDailySeries(90, dailySales);

    const remainingMonth = Math.max(0, MONTHLY_SALES_TARGET - invoicedMonth);
    const remainingYear = Math.max(0, YEARLY_SALES_TARGET - invoicedYear);

    return {
      leaveBalance: 0,
      leavesToday: 0,
      availableInventory,
      pendingMemos: 0,
      totalDue,
      yearTrend,
      salesPerformance: {
        '7d': last7,
        '30d': last30,
        '90d': last90,
        '1y': yearTrend,
      },
      fieldVisits: [] as Array<{
        employee: string;
        agenda: string;
        status: string;
      }>,
      progress: {
        month: salesMonth,
        achieved: invoicedMonth,
        target: MONTHLY_SALES_TARGET,
        remaining: remainingMonth,
        percent:
          MONTHLY_SALES_TARGET > 0
            ? Math.round((invoicedMonth / MONTHLY_SALES_TARGET) * 1000) / 10
            : 0,
      },
      crmWon,
      inventoryAchievement: {
        month: invMonth,
        achieved: inventoryAchievement,
      },
      salesDistribution: distribution.map((row) => ({
        label: statusLabel(row.status),
        value: Number(row.total),
      })),
      topDebtors: debtors.map((row) => ({
        name: row.name,
        totalDebt: Number(row.totalDebt),
      })),
      yearly: {
        year: now.getUTCFullYear(),
        achieved: invoicedYear,
        target: YEARLY_SALES_TARGET,
        remaining: remainingYear,
        percent:
          YEARLY_SALES_TARGET > 0
            ? Math.min(
                100,
                Math.round((invoicedYear / YEARLY_SALES_TARGET) * 1000) / 10,
              )
            : 0,
      },
    };
  }
}

function statusLabel(status: string): string {
  if (status === 'UNPAID') return 'Pending';
  if (status === 'PARTIAL') return 'Partial';
  if (status === 'PAID') return 'Paid';
  return status;
}
