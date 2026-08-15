import { ConflictException } from '@nestjs/common';

import type { PurchaseOrdersRepository } from './purchase-orders.repository';
import type { CompanyService } from '../../company/company.service';
import type { SmtpService } from '../../smtp/smtp.service';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const vendorId = '33333333-3333-4333-8333-333333333333';
  const productId = '44444444-4444-4444-8444-444444444444';
  const repository = {
    findVendor: jest.fn(),
    findProducts: jest.fn(),
    latestNumber: jest.fn(),
    create: jest.fn(),
    findDetails: jest.fn(),
  };
  const companyService = { findCurrent: jest.fn() };
  const smtp = { send: jest.fn() };
  const service = new PurchaseOrdersService(
    repository as unknown as PurchaseOrdersRepository,
    companyService as unknown as CompanyService,
    smtp as unknown as SmtpService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findVendor.mockResolvedValue({
      id: vendorId,
      paymentTermsDays: 30,
    });
    repository.findProducts.mockResolvedValue([
      {
        id: productId,
        name: 'Router',
        description: null,
        unitSymbol: 'pcs',
        purchasePrice: '100.00',
        isActive: true,
      },
    ]);
    repository.latestNumber.mockResolvedValue('PO-2026-0007');
    repository.create.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
    });
    repository.findDetails.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      totalAmount: 240,
      items: [],
    });
    companyService.findCurrent.mockResolvedValue({
      name: 'Example Company',
      legalName: null,
      addressLine1: null,
      city: null,
      country: null,
      phone: null,
      email: null,
      taxNumber: null,
    });
  });

  it('creates catalog-backed line items and calculates the total', async () => {
    await service.create(tenantId, actorUserId, {
      vendorId,
      poDate: '2026-08-15',
      items: [{ productId, quantity: 2, unitPrice: 120 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        poNumber: 'PO-2026-0008',
        totalAmount: '240.00',
        vendorId,
      }),
      [
        expect.objectContaining({
          productId,
          productName: 'Router',
          quantity: 2,
          lineTotal: '240.00',
        }),
      ],
    );
  });

  it('sends the printable purchase order to the vendor email', async () => {
    repository.findDetails.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      poNumber: 'PO-2026-0008',
      poDate: '2026-08-15',
      vendorName: 'Example Vendor',
      vendorEmail: 'vendor@example.com',
      attentionContact: 'Sales Team',
      totalAmount: 240,
      items: [
        {
          productName: 'Router',
          description: null,
          quantity: 2,
          unitSymbol: 'pcs',
          unitPrice: 120,
          lineTotal: 240,
        },
      ],
    });

    await service.sendEmail(tenantId, '55555555-5555-4555-8555-555555555555');

    expect(smtp.send).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        to: 'vendor@example.com',
        subject: expect.stringContaining('PO-2026-0008'),
        html: expect.stringContaining('PURCHASE ORDER'),
      }),
    );
  });

  it('rejects a duplicated product row', async () => {
    await expect(
      service.create(tenantId, actorUserId, {
        vendorId,
        poDate: '2026-08-15',
        items: [
          { productId, quantity: 1, unitPrice: 100 },
          { productId, quantity: 1, unitPrice: 100 },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
