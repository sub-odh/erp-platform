import type { QuotationsRepository } from './quotations.repository';
import { QuotationsService } from './quotations.service';

describe('QuotationsService', () => {
  const repository = {
    findCustomer: jest.fn(),
    latestNumber: jest.fn(),
    create: jest.fn(),
    findDetails: jest.fn(),
    list: jest.fn(),
    softDelete: jest.fn(),
  };
  const service = new QuotationsService(
    repository as unknown as QuotationsRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('calculates line totals and 13% VAT on create', async () => {
    repository.findCustomer.mockResolvedValue({ id: 'customer-1' });
    repository.latestNumber.mockResolvedValue(undefined);
    repository.create.mockImplementation(async (quotation: { id: string }) => ({
      id: quotation.id,
    }));
    repository.findDetails.mockResolvedValue({
      id: 'quote-1',
      subtotalAmount: '250.00',
      vatAmount: '32.50',
      totalAmount: '282.50',
      items: [],
    });

    await service.create('tenant-1', 'user-1', {
      customerId: 'customer-1',
      issueDate: '2026-09-03',
      expiryDate: '2026-10-03',
      items: [{ itemName: 'Implementation', quantity: 2, unitPrice: 125 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quotationNumber: 'QT-2026-0001',
        subtotalAmount: '250.00',
        vatAmount: '32.50',
        totalAmount: '282.50',
      }),
      [
        expect.objectContaining({
          itemName: 'Implementation',
          quantity: 2,
          unitPrice: '125.00',
          lineTotal: '250.00',
        }),
      ],
    );
  });

  it('rejects an expiry date before the issue date', async () => {
    await expect(
      service.create('tenant-1', 'user-1', {
        customerId: 'customer-1',
        issueDate: '2026-09-03',
        expiryDate: '2026-09-02',
        items: [{ itemName: 'Service', quantity: 1, unitPrice: 0 }],
      }),
    ).rejects.toThrow(
      'Quotation expiry date must be on or after the issue date',
    );

    expect(repository.findCustomer).not.toHaveBeenCalled();
  });
});
