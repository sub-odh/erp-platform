import { QuotationsService } from './quotations.service';

describe('QuotationsService', () => {
  const repository = {
    list: jest.fn(),
    metrics: jest.fn(),
    findHeader: jest.fn(),
    findItems: jest.fn(),
    findActor: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    purge: jest.fn(),
  };
  const service = new QuotationsService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('adds 13 percent VAT for NPR and skips VAT for USD', async () => {
    repository.create.mockResolvedValue({ id: 'quote-1' });
    repository.findHeader.mockResolvedValue({
      id: 'quote-1',
      quotationNumber: 'QT-20260930-AB12',
      quotationDate: '2026-09-30',
      expiryDate: '2026-10-30',
      customerId: null,
      customerName: 'Acme',
      customerAddress: '',
      termsConditions: '',
      totalAmount: '113.00',
      subtotalAmount: '100.00',
      vatAmount: '13.00',
      currency: 'NPR',
      vatApplicable: 1,
      leadId: null,
      leadName: null,
      createdAt: new Date(),
      creatorName: 'Mina',
      signatureUrl: null,
    });
    repository.findItems.mockResolvedValue([]);

    await service.create('tenant-1', 'user-1', {
      quotationNumber: 'QT-20260930-AB12',
      quotationDate: '2026-09-30',
      expiryDate: '2026-10-30',
      customerName: 'Acme',
      currency: 'NPR',
      vatApplicable: true,
      items: [{ itemName: 'Cable', quantity: 1, unitPrice: 100 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAmount: '113.00',
        vatAmount: '13.00',
        currency: 'NPR',
      }),
      expect.any(Array),
    );

    await service.create('tenant-1', 'user-1', {
      quotationNumber: 'QT-20260930-CD34',
      quotationDate: '2026-09-30',
      expiryDate: '2026-10-30',
      customerName: 'Acme',
      currency: 'USD',
      vatApplicable: true,
      items: [{ itemName: 'Cable', quantity: 1, unitPrice: 100 }],
    });

    expect(repository.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        totalAmount: '100.00',
        vatAmount: '0.00',
        vatApplicable: 0,
        currency: 'USD',
      }),
      expect.any(Array),
    );
  });
});
