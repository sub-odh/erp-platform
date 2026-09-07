import { ConflictException, NotFoundException } from '@nestjs/common';

import type { GoodsReceiptsRepository } from './goods-receipts.repository';
import { GoodsReceiptsService } from './goods-receipts.service';

describe('GoodsReceiptsService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const purchaseOrderId = '33333333-3333-4333-8333-333333333333';
  const purchaseOrderItemId = '44444444-4444-4444-8444-444444444444';
  const repository = {
    list: jest.fn(),
    latestNumber: jest.fn(),
    receive: jest.fn(),
  };
  const service = new GoodsReceiptsService(
    repository as unknown as GoodsReceiptsRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.latestNumber.mockResolvedValue('GR-2026-0007');
    repository.receive.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      receiptNumber: 'GR-2026-0008',
    });
  });

  it('records a company-scoped receipt with a sequential number and trimmed notes', async () => {
    await service.receive(tenantId, actorUserId, {
      purchaseOrderId,
      receivedDate: '2026-09-03',
      deliveryNote: '  DN-12 ',
      notes: '  Pallet A ',
      items: [{ purchaseOrderItemId, quantity: 2 }],
    });

    expect(repository.latestNumber).toHaveBeenCalledWith(tenantId, 2026);
    expect(repository.receive).toHaveBeenCalledWith({
      tenantId,
      actorUserId,
      purchaseOrderId,
      receiptNumber: 'GR-2026-0008',
      receivedDate: '2026-09-03',
      deliveryNote: 'DN-12',
      notes: 'Pallet A',
      items: [{ purchaseOrderItemId, quantity: 2 }],
    });
  });

  it('starts numbering at 0001 when the company has no earlier receipt', async () => {
    repository.latestNumber.mockResolvedValue(undefined);

    await service.receive(tenantId, actorUserId, {
      purchaseOrderId,
      receivedDate: '2027-01-04',
      items: [{ purchaseOrderItemId, quantity: 1 }],
    });

    expect(repository.receive).toHaveBeenCalledWith(
      expect.objectContaining({ receiptNumber: 'GR-2027-0001' }),
    );
  });

  it('rejects a receipt that exceeds the outstanding purchase-order quantity', async () => {
    repository.receive.mockRejectedValue(new Error('OVER_RECEIPT'));

    await expect(
      service.receive(tenantId, actorUserId, {
        purchaseOrderId,
        receivedDate: '2026-09-03',
        items: [{ purchaseOrderItemId, quantity: 99 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message:
          'Received quantity cannot exceed the outstanding purchase-order quantity',
      }),
    );
  });

  it('rejects purchase-order items that do not belong to the order', async () => {
    repository.receive.mockRejectedValue(new Error('INVALID_RECEIPT_ITEM'));

    await expect(
      service.receive(tenantId, actorUserId, {
        purchaseOrderId,
        receivedDate: '2026-09-03',
        items: [{ purchaseOrderItemId, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
