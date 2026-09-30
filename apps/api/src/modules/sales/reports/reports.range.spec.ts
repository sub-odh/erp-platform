import {
  cappedPercent,
  effectiveTarget,
  reportRange,
} from './reports.range';

describe('sales report range', () => {
  const now = new Date('2026-10-01T08:00:00+05:45');

  it('defaults to the last twelve months', () => {
    expect(reportRange('all', now)).toEqual({
      start: '2025-11-01',
      end: '2026-10-31',
    });
  });

  it('uses the selected month of the current Kathmandu year', () => {
    expect(reportRange('03', now)).toEqual({
      start: '2026-03-01',
      end: '2026-03-31',
    });
  });

  it('prorates a target only across the overlapping days', () => {
    const full = effectiveTarget(36500, '2026-01-01', '2026-12-31', '2026-01-01', '2026-12-31', now);
    expect(full).toBeCloseTo(36500, 4);
    const march = effectiveTarget(36500, '2026-01-01', '2026-12-31', '2026-03-01', '2026-03-31', now);
    expect(march).toBeCloseTo(3100, 4);
    expect(effectiveTarget(1000, '2026-06-01', '2026-06-30', '2026-01-01', '2026-01-31', now)).toBe(0);
    expect(effectiveTarget(0, null, null, '2026-01-01', '2026-01-31', now)).toBe(0);
  });

  it('caps achievement at 100 percent', () => {
    expect(cappedPercent(50, 200)).toBe(25);
    expect(cappedPercent(250, 100)).toBe(100);
    expect(cappedPercent(10, 0)).toBe(0);
  });
});
