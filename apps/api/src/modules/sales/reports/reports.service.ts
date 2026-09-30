import { ForbiddenException, Injectable } from '@nestjs/common';

import { PHP_ROLE_1 } from '../../auth/role-access';
import { ReportsRepository } from './reports.repository';
import {
  calendarYearWindow,
  cappedPercent,
  currentMonthWindow,
  effectiveTarget,
  emptyMonths,
  kathmanduDate,
  monthKeyFromIso,
  reportRange,
  trendLabel,
  type MonthKey,
} from './reports.range';

const ELEVATED = new Set<string>([...PHP_ROLE_1, 'MANAGEMENT', 'HEAD']);

interface StaffBucket {
  id: string;
  firstName: string;
  salesTarget: number;
  targetStartDate: string | null;
  targetEndDate: string | null;
  amount: number;
  months: Record<MonthKey, number>;
}

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  async trend(tenantId: string, month?: string) {
    const range = reportRange(month);
    const startAt = new Date(`${range.start}T00:00:00+05:45`);
    const endAt = new Date(`${range.end}T23:59:59+05:45`);
    const [invoices, won, targeted] = await Promise.all([
      this.repository.invoiceFacts(tenantId, range.start, range.end),
      this.repository.wonFacts(tenantId, startAt, endAt),
      this.repository.targetedEmployees(tenantId),
    ]);

    let revenue = 0;
    const revenueMonths = emptyMonths();
    const orderMonths = emptyMonths();
    const wonMonths = emptyMonths();
    const trend = new Map<string, { invoiced: number; won: number }>();
    const invoiceStaff = new Map<string, StaffBucket>();

    for (const row of invoices) {
      const amount = Number(row.totalAmount) || 0;
      const key = monthKeyFromIso(row.invoiceDate);
      const yearMonth = row.invoiceDate.slice(0, 7);
      revenue += amount;
      revenueMonths[key] += amount;
      orderMonths[key] += 1;
      const point = trend.get(yearMonth) ?? { invoiced: 0, won: 0 };
      point.invoiced += amount;
      trend.set(yearMonth, point);
      if (!row.employeeId) continue;
      const staff = this.bucket(invoiceStaff, {
        id: row.employeeId,
        firstName: row.firstName ?? 'Employee',
        salesTarget: Number(row.salesTarget) || 0,
        targetStartDate: row.targetStartDate,
        targetEndDate: row.targetEndDate,
      });
      staff.amount += amount;
      staff.months[key] += amount;
    }

    let wonTotal = 0;
    const wonStaff = new Map<string, StaffBucket>();
    for (const employee of targeted) {
      this.bucket(wonStaff, {
        id: employee.id,
        firstName: employee.firstName,
        salesTarget: Number(employee.salesTarget) || 0,
        targetStartDate: employee.targetStartDate,
        targetEndDate: employee.targetEndDate,
      });
    }
    for (const row of won) {
      const amount = Number(row.dealValue) || 0;
      const occurred = kathmanduDate(row.updatedAt);
      const key = monthKeyFromIso(occurred);
      const yearMonth = occurred.slice(0, 7);
      wonTotal += amount;
      wonMonths[key] += amount;
      const point = trend.get(yearMonth) ?? { invoiced: 0, won: 0 };
      point.won += amount;
      trend.set(yearMonth, point);
      if (!row.employeeId) continue;
      const staff = this.bucket(wonStaff, {
        id: row.employeeId,
        firstName: row.firstName ?? 'Employee',
        salesTarget: Number(row.salesTarget) || 0,
        targetStartDate: row.targetStartDate,
        targetEndDate: row.targetEndDate,
      });
      staff.amount += amount;
      staff.months[key] += amount;
    }

    return {
      startDate: range.start,
      endDate: range.end,
      revenue,
      invoiceCount: invoices.length,
      wonTotal,
      revenueMonths,
      orderMonths,
      wonMonths,
      trend: [...trend.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => ({
          key,
          label: trendLabel(key),
          invoiced: value.invoiced,
          won: value.won,
        })),
      staffInvoices: [...invoiceStaff.values()]
        .sort((left, right) => right.amount - left.amount)
        .map((row) => this.staff(row, range)),
      staffWon: [...wonStaff.values()]
        .sort((left, right) => right.amount - left.amount)
        .map((row) => this.staff(row, range)),
    };
  }

  async invoiceBreakdown(tenantId: string, employeeId: string, start: string, end: string) {
    const rows = await this.repository.invoiceLines(tenantId, employeeId, start, end);
    const orders = new Map<string, {
      id: string;
      deliveryDate: string;
      customerName: string;
      deliveryNumber: string;
      grandTotal: string;
      items: string[];
    }>();
    for (const row of rows) {
      const order = orders.get(row.id) ?? {
        id: row.id,
        deliveryDate: row.deliveryDate,
        customerName: row.customerName,
        deliveryNumber: row.deliveryNumber,
        grandTotal: row.grandTotal,
        items: [],
      };
      if (row.itemName) order.items.push(`${row.itemName} (${row.quantity})`);
      orders.set(row.id, order);
    }
    return [...orders.values()].sort((left, right) => right.deliveryDate.localeCompare(left.deliveryDate));
  }

  async wonBreakdown(tenantId: string, employeeId: string, start: string, end: string) {
    const rows = await this.repository.wonLines(
      tenantId,
      employeeId,
      new Date(`${start}T00:00:00+05:45`),
      new Date(`${end}T23:59:59+05:45`),
    );
    return rows
      .slice()
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .map((row) => ({
        updatedAt: kathmanduDate(row.updatedAt),
        companyName: row.companyName ?? '',
        contactPerson: row.contactPerson || '-',
        dealValue: row.dealValue,
        dealRemarks: row.dealRemarks ?? '',
      }));
  }

  async targets(tenantId: string, userId: string, role: string) {
    const [employees, current] = await Promise.all([
      this.repository.activeTargetEmployees(tenantId),
      this.repository.findEmployeeForUser(tenantId, userId),
    ]);
    const currentEmployeeId = current[0]?.id ?? null;
    const canViewAll = ELEVATED.has(role);
    const payments = await this.repository.recoveries(
      tenantId,
      employees.map((employee) => employee.id),
    );
    const month = currentMonthWindow();
    const year = calendarYearWindow();
    return {
      currentEmployeeId,
      canViewAll,
      employees: employees
        .slice()
        .sort((left, right) => left.firstName.localeCompare(right.firstName))
        .map((employee) => {
          const start = employee.targetStartDate ?? year.start;
          const end = employee.targetEndDate ?? year.end;
          const own = payments.filter((payment) => payment.employeeId === employee.id);
          const yearlyAchieved = this.sumBetween(own, start, end);
          const monthlyAchieved = this.sumBetween(
            own.filter((payment) => payment.paidOn >= month.start && payment.paidOn <= month.end),
            start,
            end,
          );
          const monthlyTarget = Number(employee.salesTarget) || 0;
          const yearlyTarget = Number(employee.yearlySalesTarget) || 0;
          return {
            id: employee.id,
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
            photoUrl: employee.photoUrl,
            designation: employee.designation || 'Sales Representative',
            department: employee.department ?? '',
            salesTarget: monthlyTarget,
            yearlySalesTarget: yearlyTarget,
            monthlyAchieved,
            yearlyAchieved,
            monthlyPct: cappedPercent(monthlyAchieved, monthlyTarget),
            yearlyPct: cappedPercent(yearlyAchieved, yearlyTarget),
            canViewBreakdown: canViewAll || employee.id === currentEmployeeId,
          };
        }),
    };
  }

  async recoveries(
    tenantId: string,
    userId: string,
    role: string,
    employeeId: string,
    range: string,
    start?: string,
    end?: string,
  ) {
    const [current, employee] = await Promise.all([
      this.repository.findEmployeeForUser(tenantId, userId),
      this.repository.findEmployeeWindow(tenantId, employeeId),
    ]);
    const currentEmployeeId = current[0]?.id ?? null;
    if (!ELEVATED.has(role) && employeeId !== currentEmployeeId) {
      throw new ForbiddenException('Unauthorized');
    }
    if (!employee[0]) return [];
    const year = calendarYearWindow();
    const explicit = Boolean(start || end);
    const windowStart = explicit ? start || '0001-01-01' : employee[0].targetStartDate || year.start;
    const windowEnd = explicit ? end || '9999-12-31' : employee[0].targetEndDate || year.end;
    const month = !explicit && range === 'monthly' ? currentMonthWindow() : null;
    const rows = await this.repository.recoveries(tenantId, [employeeId]);
    return rows
      .filter((row) => {
        if (row.paidOn < windowStart || row.paidOn > windowEnd) return false;
        if (month && (row.paidOn < month.start || row.paidOn > month.end)) return false;
        return true;
      })
      .sort((left, right) => right.paidOn.localeCompare(left.paidOn))
      .map((row) => ({
        deliveryNumber: row.deliveryNumber,
        invoiceDate: row.invoiceDate,
        recoveryDate: row.paidOn,
        method: row.method,
        amount: row.amount,
      }));
  }

  private bucket(
    buckets: Map<string, StaffBucket>,
    seed: Omit<StaffBucket, 'amount' | 'months'>,
  ): StaffBucket {
    const existing = buckets.get(seed.id);
    if (existing) return existing;
    const created = { ...seed, amount: 0, months: emptyMonths() };
    buckets.set(seed.id, created);
    return created;
  }

  private staff(row: StaffBucket, range: { start: string; end: string }) {
    return {
      id: row.id,
      firstName: row.firstName,
      salesTarget: row.salesTarget,
      targetStartDate: row.targetStartDate,
      targetEndDate: row.targetEndDate,
      amount: row.amount,
      months: row.months,
      effectiveTarget: effectiveTarget(
        row.salesTarget,
        row.targetStartDate,
        row.targetEndDate,
        range.start,
        range.end,
      ),
    };
  }

  private sumBetween(
    rows: { paidOn: string; amount: string }[],
    start: string,
    end: string,
  ): number {
    return rows.reduce((sum, row) => {
      if (row.paidOn < start || row.paidOn > end) return sum;
      return sum + (Number(row.amount) || 0);
    }, 0);
  }
}
