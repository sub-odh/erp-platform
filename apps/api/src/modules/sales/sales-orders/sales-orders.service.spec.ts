import type { SalesOrdersRepository } from './sales-orders.repository';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const repository = {
    listConfirmedSalesOrders: jest.fn(),
    listWonDeals: jest.fn(),
  };
  const service = new SalesOrdersService(
    repository as unknown as SalesOrdersRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-07T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds a twelve-month trend and staff totals from confirmed orders and won deals', async () => {
    repository.listConfirmedSalesOrders.mockResolvedValue([
      {
        id: 'order-1',
        deliveryDate: '2026-09-01',
        deliveredBy: 'user-1',
        firstName: 'Ujwal',
        lastName: 'Shakya',
        totalValue: '150000.00',
      },
      {
        id: 'order-2',
        deliveryDate: '2026-08-20',
        deliveredBy: 'user-1',
        firstName: 'Ujwal',
        lastName: 'Shakya',
        totalValue: '50000.00',
      },
    ]);
    repository.listWonDeals.mockResolvedValue([
      {
        id: 'deal-1',
        amount: '200000.00',
        closedAt: new Date('2026-09-03T00:00:00.000Z'),
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        ownerUserId: 'user-1',
        firstName: 'Ujwal',
        lastName: 'Shakya',
      },
      {
        id: 'deal-2',
        amount: '100000.00',
        closedAt: null,
        createdAt: '2026-09-05T00:00:00.000Z',
        ownerUserId: 'user-2',
        firstName: 'Maya',
        lastName: 'Rai',
      },
    ]);

    const report = await service.report(tenantId);

    expect(repository.listConfirmedSalesOrders).toHaveBeenCalledWith(
      tenantId,
      '2025-10-01',
    );
    expect(report.months).toHaveLength(12);
    expect(report.months[0].key).toBe('2025-10');
    expect(report.months[11]).toEqual(
      expect.objectContaining({
        key: '2026-09',
        label: 'September',
        salesOrderValue: 150000,
        salesOrderCount: 1,
        wonDealValue: 300000,
      }),
    );
    expect(report.months[11].staffSalesOrders).toEqual([
      { userId: 'user-1', name: 'Ujwal Shakya', amount: 150000 },
    ]);
    expect(report.staffSalesOrders).toEqual([
      {
        userId: 'user-1',
        name: 'Ujwal Shakya',
        amount: 200000,
      },
    ]);
    expect(report.staffWonDeals).toEqual([
      {
        userId: 'user-1',
        name: 'Ujwal Shakya',
        amount: 200000,
        vsTargetPercent: 67,
      },
      {
        userId: 'user-2',
        name: 'Maya Rai',
        amount: 100000,
        vsTargetPercent: 33,
      },
    ]);
  });

  it('returns empty series when the company has no sales activity', async () => {
    repository.listConfirmedSalesOrders.mockResolvedValue([]);
    repository.listWonDeals.mockResolvedValue([]);

    const report = await service.report(tenantId);

    expect(report.staffSalesOrders).toEqual([]);
    expect(report.staffWonDeals).toEqual([]);
    expect(report.months.every((month) => month.salesOrderCount === 0)).toBe(
      true,
    );
  });
});
