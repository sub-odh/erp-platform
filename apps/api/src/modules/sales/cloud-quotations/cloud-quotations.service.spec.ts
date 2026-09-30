import { CloudQuotationsService } from './cloud-quotations.service';

describe('CloudQuotationsService', () => {
  const repository = {
    create: jest.fn(),
    findHeader: jest.fn(),
    findItems: jest.fn(),
  };
  const service = new CloudQuotationsService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('applies a percent discount before 13 percent VAT and skips VAT for USD', async () => {
    repository.create.mockResolvedValue({ id: 'cloud-1' });
    repository.findHeader.mockResolvedValue({
      id: 'cloud-1',
      quotationNumber: 'QT-20261001-AB12',
      issueDate: '2026-10-01',
      expiryDate: '2026-10-31',
      customerName: 'Acme',
      customerAddress: '',
      currency: 'NPR',
      vatApplicable: 1,
      subtotalAmount: '1000.00',
      discountAmount: '100.00',
      vatAmount: '117.00',
      totalAmount: '1017.00',
      terms: '',
    });
    repository.findItems.mockResolvedValue([]);

    await service.create('tenant-1', 'user-1', {
      quotationNumber: 'QT-20261001-AB12',
      quotationDate: '2026-10-01',
      expiryDate: '2026-10-31',
      customerName: 'Acme',
      currency: 'NPR',
      vatApplicable: true,
      discountType: 'percent',
      discountValue: 10,
      items: [{ serviceType: 'VPS', itemName: 'Plan', quantity: 1, unitPrice: 1000 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotalAmount: '1000.00',
        discountAmount: '100.00',
        vatAmount: '117.00',
        totalAmount: '1017.00',
      }),
      expect.any(Array),
    );

    await service.create('tenant-1', 'user-1', {
      quotationNumber: 'QT-20261001-CD34',
      quotationDate: '2026-10-01',
      customerName: 'Acme',
      currency: 'USD',
      vatApplicable: true,
      discountType: 'amount',
      discountValue: 50,
      items: [{ serviceType: 'VPS', itemName: 'Plan', quantity: 1, unitPrice: 1000 }],
    });

    expect(repository.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        vatApplicable: 0,
        vatAmount: '0.00',
        discountAmount: '50.00',
        totalAmount: '950.00',
        currency: 'USD',
      }),
      expect.any(Array),
    );
  });
});
