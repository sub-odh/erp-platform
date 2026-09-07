import { ConflictException, NotFoundException } from '@nestjs/common';

import type { DeliveryOrdersRepository } from './delivery-orders.repository';
import { DeliveryOrdersService } from './delivery-orders.service';

describe('DeliveryOrdersService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const assetId = '33333333-3333-4333-8333-333333333333';
  const repository = {
    list: jest.fn(),
    listAvailableAssets: jest.fn(),
    latestNumber: jest.fn(),
    create: jest.fn(),
  };
  const service = new DeliveryOrdersService(
    repository as unknown as DeliveryOrdersRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.latestNumber.mockResolvedValue('DO-2026-0042');
    repository.create.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      deliveryNumber: 'DO-2026-0043',
    });
  });

  it('creates a company-scoped order with a sequential number and normalized details', async () => {
    await service.create(tenantId, actorUserId, {
      deliveryDate: '2026-08-22',
      customerName: '  Acme Trading  ',
      contactName: '  Maya Rai ',
      contactPhone: ' 9800000000 ',
      deliveryAddress: '  Kathmandu ',
      notes: '  Deliver before noon ',
      items: [{ assetId, quantity: 2 }],
    });

    expect(repository.latestNumber).toHaveBeenCalledWith(tenantId, 2026);
    expect(repository.create).toHaveBeenCalledWith({
      tenantId,
      actorUserId,
      deliveryNumber: 'DO-2026-0043',
      deliveryDate: '2026-08-22',
      customerName: 'Acme Trading',
      contactName: 'Maya Rai',
      contactPhone: '9800000000',
      deliveryAddress: 'Kathmandu',
      notes: 'Deliver before noon',
      items: [{ assetId, quantity: 2 }],
    });
  });

  it('starts numbering at 0001 when the company has no earlier delivery', async () => {
    repository.latestNumber.mockResolvedValue(undefined);

    await service.create(tenantId, actorUserId, {
      deliveryDate: '2027-01-03',
      customerName: 'New Customer',
      items: [{ assetId, quantity: 1 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryNumber: 'DO-2027-0001' }),
    );
  });

  it('forwards list and available-stock queries only for the authenticated company', async () => {
    await service.list(tenantId);
    await service.listAvailableAssets(tenantId);

    expect(repository.list).toHaveBeenCalledWith(tenantId);
    expect(repository.listAvailableAssets).toHaveBeenCalledWith(tenantId);
  });

  it('rejects a delivery that exceeds current stock', async () => {
    repository.create.mockRejectedValue(new Error('INSUFFICIENT_STOCK'));

    await expect(
      service.create(tenantId, actorUserId, {
        deliveryDate: '2026-08-22',
        customerName: 'Acme Trading',
        items: [{ assetId, quantity: 99 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message: 'One or more items no longer have enough stock available',
      }),
    );
  });

  it('rejects duplicate asset rows', async () => {
    repository.create.mockRejectedValue(new Error('DUPLICATE_DELIVERY_ITEM'));

    await expect(
      service.create(tenantId, actorUserId, {
        deliveryDate: '2026-08-22',
        customerName: 'Acme Trading',
        items: [
          { assetId, quantity: 1 },
          { assetId, quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects inventory items that do not belong to the company', async () => {
    repository.create.mockRejectedValue(new Error('INVALID_DELIVERY_ITEM'));

    await expect(
      service.create(tenantId, actorUserId, {
        deliveryDate: '2026-08-22',
        customerName: 'Acme Trading',
        items: [{ assetId, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
