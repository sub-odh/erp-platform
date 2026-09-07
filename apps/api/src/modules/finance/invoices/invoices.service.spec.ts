import { ConflictException, NotFoundException } from '@nestjs/common';

import type { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const deliveryOrderId = '33333333-3333-4333-8333-333333333333';
  const repository = {
    list: jest.fn(),
    summary: jest.fn(),
    findById: jest.fn(),
    findByDeliveryOrder: jest.fn(),
    getDeliveryOrderForInvoice: jest.fn(),
    latestNumber: jest.fn(),
    create: jest.fn(),
    recordPayment: jest.fn(),
  };
  const service = new InvoicesService(
    repository as unknown as InvoicesRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findByDeliveryOrder.mockResolvedValue(undefined);
    repository.latestNumber.mockResolvedValue('INV-2026-0003');
    repository.getDeliveryOrderForInvoice.mockResolvedValue({
      order: {
        id: deliveryOrderId,
        customerName: 'Acme Trading',
        deliveryDate: '2026-09-07',
      },
      items: [
        {
          itemName: 'Router',
          serialNumber: 'SN-1',
          quantity: 2,
          unitPrice: '1000.00',
        },
      ],
    });
    repository.create.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      invoiceNumber: 'INV-2026-0004',
    });
  });

  it('generates a sequential invoice with 13% VAT from a delivery order', async () => {
    const result = await service.generate(tenantId, actorUserId, {
      deliveryOrderId,
    });

    expect(result.invoiceNumber).toBe('INV-2026-0004');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: expect.objectContaining({
          invoiceNumber: 'INV-2026-0004',
          customerName: 'Acme Trading',
          subtotalAmount: '2000.00',
          vatAmount: '260.00',
          totalAmount: '2260.00',
          status: 'UNPAID',
        }),
      }),
    );
  });

  it('rejects a second invoice for the same delivery order', async () => {
    repository.findByDeliveryOrder.mockResolvedValue({ id: 'existing' });

    await expect(
      service.generate(tenantId, actorUserId, { deliveryOrderId }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message: 'An invoice already exists for this delivery order',
      }),
    );
  });

  it('records a partial payment and keeps remaining balance', async () => {
    repository.findById.mockResolvedValue({
      id: 'inv-1',
      totalAmount: '2260.00',
      paidAmount: '0.00',
      status: 'UNPAID',
    });
    repository.recordPayment.mockResolvedValue({});
    repository.findById
      .mockResolvedValueOnce({
        id: 'inv-1',
        totalAmount: '2260.00',
        paidAmount: '0.00',
        status: 'UNPAID',
      })
      .mockResolvedValueOnce({
        id: 'inv-1',
        totalAmount: 2260,
        paidAmount: 260,
        status: 'PARTIAL',
        items: [],
        payments: [],
      });

    await service.recordPayment(tenantId, actorUserId, 'inv-1', {
      amount: 260,
      method: 'BANK',
      referenceNumber: 'TXN-1',
    });

    expect(repository.recordPayment).toHaveBeenCalledWith(
      tenantId,
      'inv-1',
      expect.objectContaining({
        amount: '260.00',
        method: 'BANK',
        recordedBy: actorUserId,
      }),
      '260.00',
      'PARTIAL',
    );
  });

  it('rejects payment against a missing invoice', async () => {
    repository.findById.mockResolvedValue(undefined);

    await expect(
      service.recordPayment(tenantId, actorUserId, 'missing', {
        amount: 10,
        method: 'CASH',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
