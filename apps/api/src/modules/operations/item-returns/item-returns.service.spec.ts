import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import type { ItemReturnsRepository } from './item-returns.repository';
import { ItemReturnsService } from './item-returns.service';

describe('ItemReturnsService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const assetId = '33333333-3333-4333-8333-333333333333';
  const repository = {
    list: jest.fn(),
    listReturnableAssets: jest.fn(),
    latestNumber: jest.fn(),
    create: jest.fn(),
    search: jest.fn(),
    process: jest.fn(),
  };
  const service = new ItemReturnsService(
    repository as unknown as ItemReturnsRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.latestNumber.mockResolvedValue('RT-2026-0004');
    repository.create.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      returnNumber: 'RT-2026-0005',
    });
  });

  it('creates a company-scoped return with a sequential number and trimmed details', async () => {
    await service.create(tenantId, actorUserId, {
      assetId,
      returnDate: '2026-09-07',
      quantity: 1,
      customerName: '  Acme Trading  ',
      reason: '  Damaged in transit ',
      notes: '  Inspected ',
    });

    expect(repository.latestNumber).toHaveBeenCalledWith(tenantId, 2026);
    expect(repository.create).toHaveBeenCalledWith({
      tenantId,
      actorUserId,
      returnNumber: 'RT-2026-0005',
      assetId,
      returnDate: '2026-09-07',
      customerName: 'Acme Trading',
      quantity: 1,
      reason: 'Damaged in transit',
      notes: 'Inspected',
    });
  });

  it('starts numbering at 0001 when the company has no earlier return', async () => {
    repository.latestNumber.mockResolvedValue(undefined);

    await service.create(tenantId, actorUserId, {
      assetId,
      returnDate: '2027-02-01',
      quantity: 1,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ returnNumber: 'RT-2027-0001' }),
    );
  });

  it('rejects a return that exceeds the delivered quantity', async () => {
    repository.create.mockRejectedValue(new Error('INSUFFICIENT_RETURN_QTY'));

    await expect(
      service.create(tenantId, actorUserId, {
        assetId,
        returnDate: '2026-09-07',
        quantity: 99,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message: 'Returned quantity cannot exceed delivered quantity',
      }),
    );
  });

  it('rejects inventory items that do not belong to the company', async () => {
    repository.create.mockRejectedValue(new Error('INVALID_RETURN_ITEM'));

    await expect(
      service.create(tenantId, actorUserId, {
        assetId,
        returnDate: '2026-09-07',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks a standard return back to stock and a damaged return for replacement', async () => {
    const lineId = '55555555-5555-4555-8555-555555555555';
    await service.process(tenantId, actorUserId, {
      lineIds: [lineId, lineId],
      returnType: 'standard',
      remarks: '  Customer changed mind  ',
    });
    expect(repository.process).toHaveBeenCalledWith({
      tenantId,
      actorUserId,
      lineIds: [lineId],
      returnType: 'standard',
      remarks: 'RETURNED TO STOCK: Customer changed mind',
    });

    await service.process(tenantId, actorUserId, {
      lineIds: [lineId],
      returnType: 'damaged',
    });
    expect(repository.process).toHaveBeenLastCalledWith(
      expect.objectContaining({
        returnType: 'damaged',
        remarks: 'DAMAGED: Marked for Replacement',
      }),
    );
  });

  it('labels delivery matches and flags an expired return policy', async () => {
    repository.search.mockResolvedValue([
      {
        lineId: '55555555-5555-4555-8555-555555555555',
        id: assetId,
        itemName: 'Cisco Switch',
        status: 'DELIVERED',
        serialNumber: 'SN-1',
        quantity: 1,
        deliveryNumber: 'DO-2026-001',
        deliveredAt: new Date('2020-01-01T00:00:00'),
        customerName: 'Acme',
      },
    ]);

    const rows = await service.lookup(tenantId, {
      doNumber: 'DO-2026-001',
    });

    expect(rows[0]).toEqual(
      expect.objectContaining({
        statusLabel: 'Delivered',
        customerName: 'Acme',
        policyDays: 365,
        expired: true,
        processed: false,
      }),
    );
  });

  it('rejects processing when no items are selected', async () => {
    await expect(
      service.process(tenantId, actorUserId, {
        lineIds: [],
        returnType: 'standard',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
