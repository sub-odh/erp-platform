import { isAdminDashboardRole } from './dashboard.service';
import {
  cappedPercent,
  fillDailySeries,
  fillMonthlySeries,
  formatBackTime,
  rawPercent,
  resolveYearMonth,
  resolvedYearlyTarget,
} from './dashboard.series';

describe('dashboard php rules', () => {
  const current = '2026-09';

  it('keeps a valid month and falls back on anything else', () => {
    expect(resolveYearMonth('2026-01', current)).toBe('2026-01');
    expect(resolveYearMonth('2026-12', current)).toBe('2026-12');
    expect(resolveYearMonth('2026-13', current)).toBe(current);
    expect(resolveYearMonth('2026-00', current)).toBe(current);
    expect(resolveYearMonth('09-2026', current)).toBe(current);
    expect(resolveYearMonth(undefined, current)).toBe(current);
    expect(resolveYearMonth('', current)).toBe(current);
  });

  it('caps the target bars and leaves the doughnut uncapped', () => {
    expect(cappedPercent(150, 100)).toBe(100);
    expect(rawPercent(150, 100)).toBe(150);
    expect(cappedPercent(1, 3)).toBe(33.3);
    expect(cappedPercent(0, 0)).toBe(0);
    expect(Math.max(0, 100 - 150)).toBe(0);
  });

  it('copies a monthly target across the year when yearly is unset', () => {
    expect(resolvedYearlyTarget(10, 0)).toBe(120);
    expect(resolvedYearlyTarget(10, -1)).toBe(120);
    expect(resolvedYearlyTarget(10, 80)).toBe(80);
    expect(resolvedYearlyTarget(0, 0)).toBe(0);
  });

  it('shows the admin dashboard to roles 1, 2, 3, 5, 6 and 7 only', () => {
    expect(isAdminDashboardRole('OWNER')).toBe(true);
    expect(isAdminDashboardRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminDashboardRole('HR')).toBe(true);
    expect(isAdminDashboardRole('OPERATIONS')).toBe(true);
    expect(isAdminDashboardRole('MANAGER')).toBe(true);
    expect(isAdminDashboardRole('SALES')).toBe(true);
    expect(isAdminDashboardRole('STAFF')).toBe(true);
    expect(isAdminDashboardRole('MANAGEMENT')).toBe(true);
    expect(isAdminDashboardRole('HEAD')).toBe(true);
    expect(isAdminDashboardRole('EMPLOYEE')).toBe(false);
    expect(isAdminDashboardRole('ADMIN')).toBe(false);
  });

  it('zero-fills an empty month and an empty day', () => {
    const days = fillDailySeries(7, [], '2026-09-28');
    expect(days).toHaveLength(7);
    expect(days.every((point) => point.value === 0)).toBe(true);
    expect(days[6]?.label).toBe('Mon');

    const months = fillMonthlySeries(12, [], '2026-09');
    expect(months).toHaveLength(12);
    expect(months.every((point) => point.value === 0)).toBe(true);
    expect(months[11]?.label).toBe('Sep 26');
  });

  it('formats a return time the way PHP date g:iA does', () => {
    expect(formatBackTime('17:41:02')).toBe('5:41PM');
    expect(formatBackTime('00:05:00')).toBe('12:05AM');
    expect(formatBackTime('12:00:00')).toBe('12:00PM');
  });
});
