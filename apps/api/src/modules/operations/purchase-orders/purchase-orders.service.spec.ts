import { BadRequestException } from '@nestjs/common';

import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const repository = {
    nextSequence: jest.fn(),
    findActor: jest.fn(),
    list: jest.fn(),
    findHeader: jest.fn(),
    findItems: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    purge: jest.fn(),
  };
  const companyService = { findCurrent: jest.fn() };
  const smtp = { send: jest.fn() };
  const service = new PurchaseOrdersService(
    repository as never,
    companyService as never,
    smtp as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.nextSequence.mockResolvedValue(7);
    repository.findActor.mockResolvedValue({
      firstName: 'Mina',
      lastName: 'Shrestha',
      role: 'SALES',
      passwordHash: '$2b$10$hash',
    });
  });

  it('adds 13 percent VAT only for NPR purchase orders', async () => {
    repository.create.mockResolvedValue({ id: 'po-1' });
    repository.findHeader.mockResolvedValue({
      id: 'po-1',
      poNumber: 'PO-2026-007',
      poDate: '2026-09-30',
      vendorDetails: 'Technova',
      billTo: 'Head office',
      shipTo: 'Warehouse',
      termsConditions: null,
      totalAmount: '113.00',
      currency: 'NPR',
      createdAt: new Date(),
      creatorFirstName: 'Mina',
      creatorLastName: 'Shrestha',
      creatorRole: 'SALES',
      signatureUrl: null,
    });
    repository.findItems.mockResolvedValue([]);

    await service.create(tenantId, userId, {
      poNumber: 'PO-2026-007',
      poDate: '2026-09-30',
      vendorDetails: 'Technova',
      billTo: 'Head office',
      shipTo: 'Warehouse',
      currency: 'NPR',
      items: [{ itemName: 'Cable', quantity: 1, unitPrice: 100 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: '113.00', currency: 'NPR' }),
      expect.any(Array),
    );
  });

  it('rejects a purge when the password does not match', async () => {
    jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

    await expect(
      service.purge(tenantId, userId, 'po-1', 'wrong'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.purge).not.toHaveBeenCalled();
  });
});
