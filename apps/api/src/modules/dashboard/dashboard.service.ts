import { Injectable } from '@nestjs/common';

import { rolesForPhpIds } from '../auth/php-role-access';
import { DashboardRepository } from './dashboard.repository';
import {
  cappedPercent,
  fillDailySeries,
  fillMonthlySeries,
  formatBackTime,
  kathmanduClock,
  rawPercent,
  resolveYearMonth,
  resolvedYearlyTarget,
  shiftIsoDate,
  shiftIsoMonth,
} from './dashboard.series';

const ADMIN_DASHBOARD_ROLES = new Set(rolesForPhpIds([1, 2, 3, 5, 6, 7]));

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAdminDashboardRole(role: string | undefined): boolean {
  return ADMIN_DASHBOARD_ROLES.has(role as never);
}

export type DashboardActionInput = {
  mark_back_id?: string;
  visit_remarks?: string;
  confirm_sub_id?: string;
  reject_sub_id?: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async overview(
    tenantId: string,
    userId: string,
    role: string,
    filters: { inv_month?: string; sales_month?: string },
  ) {
    const clock = kathmanduClock();
    const invMonth = resolveYearMonth(filters.inv_month, clock.month);
    const salesMonth = resolveYearMonth(filters.sales_month, clock.month);
    const adminView = isAdminDashboardRole(role);
    const year = Number(clock.date.slice(0, 4));

    const employee = await this.repository.findEmployee(tenantId, userId);
    const employeeId = employee?.id;

    const [
      substitutions,
      leavesToday,
      activeVisitId,
      visits,
    ] = await Promise.all([
      employeeId
        ? this.repository.pendingSubstitutions(tenantId, employeeId, clock.date)
        : Promise.resolve([]),
      this.repository.leavesToday(tenantId, clock.date),
      employeeId
        ? this.repository.activeVisitId(tenantId, employeeId, clock.date)
        : Promise.resolve(null),
      this.repository.todayVisits(tenantId, clock.date),
    ]);

    const monthlyTarget = Number(employee?.salesTarget ?? 0);
    const yearlyTarget = resolvedYearlyTarget(
      monthlyTarget,
      Number(employee?.yearlySalesTarget ?? 0),
    );
    const hasTarget = Boolean(employee?.hasSalesTarget);
    const targetStart =
      employee?.targetStartDate || `${year}-01-01`;
    const targetEnd = employee?.targetEndDate || `${year}-12-31`;

    let salesAchievement = 0;
    let yearlyAchievement = 0;
    let crmWon = 0;
    let inventoryAchievement = 0;

    if (hasTarget) {
      [salesAchievement, yearlyAchievement] = await Promise.all([
        this.repository.recoveredInMonth(tenantId, userId, salesMonth),
        this.repository.recoveredBetween(
          tenantId,
          userId,
          targetStart,
          targetEnd,
        ),
      ]);

      if (monthlyTarget > 0) {
        [crmWon, inventoryAchievement] = await Promise.all([
          this.repository.wonDealsInMonth(tenantId, userId, salesMonth),
          this.repository.invoicedForSeller(tenantId, userId, invMonth),
        ]);
      }
    }

    const monthlyRemaining = Math.max(0, monthlyTarget - salesAchievement);
    const yearlyRemaining = Math.max(0, yearlyTarget - yearlyAchievement);

    const admin = adminView
      ? await this.adminFigures(tenantId, clock.date, clock.month)
      : null;
    const partners =
      !adminView && employeeId
        ? await this.repository.assignedPartners(tenantId, employeeId)
        : [];

    return {
      adminView,
      invMonth,
      salesMonth,
      today: clock.date,
      activeVisitId,
      leaveBalance:
        Number(employee?.sickLeaveBal ?? 0) +
        Number(employee?.casualLeaveBal ?? 0),
      leavesToday,
      substitutions: substitutions.map((row) => ({
        id: row.id,
        name: `${row.firstName} ${row.lastName}`.trim(),
        startDate: row.startDate,
        endDate: row.endDate,
      })),
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        logoUrl: partner.logoUrl,
        portalUrl: partner.portalUrl,
        websiteUrl: partner.websiteUrl,
      })),
      hasTarget,
      monthlyTarget,
      crmWon,
      inventoryAchievement,
      progress: {
        achieved: salesAchievement,
        target: monthlyTarget,
        remaining: monthlyRemaining,
        percent: rawPercent(salesAchievement, monthlyTarget),
        cappedPercent: cappedPercent(salesAchievement, monthlyTarget),
      },
      yearly: {
        year,
        achieved: yearlyAchievement,
        target: yearlyTarget,
        remaining: yearlyRemaining,
        percent: cappedPercent(yearlyAchievement, yearlyTarget),
        startDate: targetStart,
        endDate: targetEnd,
      },
      availableInventory: admin?.availableInventory ?? 0,
      pendingMemos: admin?.pendingMemos ?? 0,
      totalDue: admin?.totalDue ?? 0,
      yearTrend: admin?.yearTrend ?? [],
      salesPerformance: admin?.salesPerformance ?? {
        '7d': [],
        '30d': [],
        '90d': [],
        '1y': [],
      },
      salesDistribution: {
        month: clock.month,
        points: admin?.statusPoints ?? [],
        deliveryMonthTotal: admin?.deliveryMonthTotal ?? 0,
      },
      topDebtors: admin?.topDebtors ?? [],
      fieldVisits: visits.map((visit) => ({
        id: visit.id,
        employee: visit.firstName,
        fullName: `${visit.firstName} ${visit.lastName}`.trim(),
        agenda: visit.agenda,
        visitType: visitTypeLabel(String(visit.visitType ?? '')),
        outTime: visit.outTime,
        inTime: visit.inTime,
        remarks: visit.remarks,
        mine: employeeId !== undefined && visit.employeeId === employeeId,
        status: visit.inTime ? `Back ${formatBackTime(visit.inTime)}` : 'OUT',
      })),
    };
  }

  async applyAction(
    tenantId: string,
    userId: string,
    input: DashboardActionInput,
  ) {
    const employee = await this.repository.findEmployee(tenantId, userId);
    if (!employee) {
      return;
    }

    const clock = kathmanduClock();

    if (input.mark_back_id !== undefined) {
      if (isUuid(input.mark_back_id)) {
        await this.repository.markBack(
          tenantId,
          employee.id,
          input.mark_back_id,
          input.visit_remarks ?? '',
          clock.time,
        );
      }
      return;
    }

    if (input.confirm_sub_id !== undefined) {
      if (isUuid(input.confirm_sub_id)) {
        await this.repository.confirmSubstitute(
          tenantId,
          employee.id,
          input.confirm_sub_id,
        );
      }
      return;
    }

    if (input.reject_sub_id !== undefined && isUuid(input.reject_sub_id)) {
      await this.repository.rejectSubstitute(
        tenantId,
        employee.id,
        input.reject_sub_id,
      );
    }
  }

  private async adminFigures(tenantId: string, today: string, month: string) {
    const from90 = shiftIsoDate(today, -89);
    const fromMonth = shiftIsoMonth(month, -11);
    const [
      availableInventory,
      pendingMemos,
      totalDue,
      debtors,
      daily,
      monthly,
      deliveryMonthTotal,
    ] = await Promise.all([
      this.repository.availableInventory(tenantId),
      this.repository.pendingMemos(tenantId),
      this.repository.outstandingDue(tenantId),
      this.repository.topDebtors(tenantId),
      this.repository.deliveryTotalsByDay(tenantId, from90),
      this.repository.deliveryTotalsByMonth(tenantId, fromMonth),
      this.repository.deliveryTotalInMonth(tenantId, month),
    ]);

    const yearTrend = fillMonthlySeries(12, monthly, month);

    return {
      availableInventory,
      pendingMemos,
      totalDue,
      deliveryMonthTotal,
      statusPoints:
        deliveryMonthTotal > 0
          ? [{ label: 'Delivery Total', value: deliveryMonthTotal }]
          : [],
      yearTrend,
      salesPerformance: {
        '7d': fillDailySeries(7, daily, today),
        '30d': fillDailySeries(30, daily, today),
        '90d': fillDailySeries(90, daily, today),
        '1y': yearTrend,
      },
      topDebtors: debtors.map((row) => ({
        name: row.name,
        totalDebt: Number(row.totalDebt),
      })),
    };
  }
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function visitTypeLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
