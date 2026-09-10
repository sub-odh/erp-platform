import { fillDailySeries, fillMonthlySeries } from './dashboard.series';

describe('dashboard series', () => {
  it('fills missing daily sales with zeroes', () => {
    const points = fillDailySeries(7, []);
    expect(points).toHaveLength(7);
    expect(points.every((point) => point.value === 0)).toBe(true);
  });

  it('fills twelve monthly trend points', () => {
    const points = fillMonthlySeries(12, [{ month: '1999-01', total: 10 }]);
    expect(points).toHaveLength(12);
    expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(0);
  });
});
