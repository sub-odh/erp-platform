import { BadRequestException } from '@nestjs/common';
import { compare } from 'bcrypt';

import { amountInWords, proformaTotal } from './pi-words';
import type { ProformaInvoicesRepository } from './proforma-invoices.repository';
import { ProformaInvoicesService } from './proforma-invoices.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('ProformaInvoicesService', () => {
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
  const service = new ProformaInvoicesService(
    repository as unknown as ProformaInvoicesRepository,
    companyService as never,
    smtp as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('adds 13% VAT for NPR and leaves USD untaxed', () => {
    expect(
      proformaTotal([{ quantity: 2, unitPrice: 100 }], 'NPR').total,
    ).toBeCloseTo(226);
    expect(
      proformaTotal([{ quantity: 2, unitPrice: 100 }], 'USD').total,
    ).toBeCloseTo(200);
  });

  it('spells NPR and USD amounts', () => {
    expect(amountInWords(113, 'NPR')).toBe(
      'Nepalese Rupees One Hundred Thirteen Only',
    );
    expect(amountInWords(250.5, 'USD')).toBe(
      'US Dollars Two Hundred Fifty Only and Fifty Cents',
    );
    expect(amountInWords(0, 'NPR')).toBe('Nepalese Rupees Zero Only');
  });

  it('stores the VAT-inclusive total on create', async () => {
    repository.nextSequence.mockResolvedValue(1);
    repository.create.mockResolvedValue({ id: 'pi-1' });
    repository.findHeader.mockResolvedValue({
      id: 'pi-1',
      piNumber: 'PI-2026-0001',
      piDate: '2026-09-30',
      customerDetails: 'Acme',
      billTo: 'Acme',
      shipTo: 'Acme',
      termsConditions: null,
      totalAmount: '226.00',
      currency: 'NPR',
      createdAt: new Date('2026-09-30T00:00:00Z'),
      createdBy: 'user-1',
      creatorFirstName: 'Ada',
      creatorLastName: 'Lovelace',
      creatorRole: 'SALES',
      signatureUrl: null,
    });
    repository.findItems.mockResolvedValue([]);

    await service.create('tenant-1', 'user-1', {
      piNumber: 'PI-2026-0001',
      piDate: '2026-09-30',
      customerDetails: 'Acme',
      billTo: 'Acme',
      shipTo: 'Acme',
      currency: 'NPR',
      items: [{ quantity: 2, unitPrice: 100 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: '226.00', currency: 'NPR' }),
      expect.any(Array),
    );
  });

  it('rejects a purge when the account password does not match', async () => {
    repository.findActor.mockResolvedValue({ passwordHash: 'hash' });
    jest.mocked(compare).mockResolvedValue(false as never);

    await expect(
      service.purge('tenant-1', 'user-1', 'pi-1', 'wrong'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.purge).not.toHaveBeenCalled();
  });
});
