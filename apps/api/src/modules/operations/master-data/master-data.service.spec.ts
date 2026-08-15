import { ConflictException, NotFoundException } from '@nestjs/common';

import type { OperationsCategory, OperationsUnit } from '@erp/db';

import type { MasterDataRepository } from './master-data.repository';
import { MasterDataService } from './master-data.service';

describe('MasterDataService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const categoryId = '33333333-3333-4333-8333-333333333333';
  const unitId = '44444444-4444-4444-8444-444444444444';
  const category = {
    id: categoryId,
    tenantId,
    code: 'SERVER',
    name: 'Servers',
    isActive: true,
  } as OperationsCategory;
  const unit = {
    id: unitId,
    tenantId,
    name: 'Piece',
    symbol: 'pcs',
    isActive: true,
  } as OperationsUnit;
  const repository = {
    findCategory: jest.fn(),
    findUnit: jest.fn(),
    findVendor: jest.fn(),
    findProduct: jest.fn(),
    createCategory: jest.fn(),
    createProduct: jest.fn(),
  };
  const service = new MasterDataService(
    repository as unknown as MasterDataRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findCategory.mockResolvedValue(category);
    repository.findUnit.mockResolvedValue(unit);
  });

  it('validates product references inside the authenticated company', async () => {
    repository.createProduct.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      purchasePrice: '1200.00',
      sellingPrice: '1500.00',
    });

    const result = await service.createProduct(tenantId, actorUserId, {
      sku: ' srv-r740 ',
      name: ' Dell PowerEdge R740 ',
      categoryId,
      unitId,
      purchasePrice: 1200,
      sellingPrice: 1500,
      reorderLevel: 2,
      isActive: true,
    });

    expect(repository.findCategory).toHaveBeenCalledWith(tenantId, categoryId);
    expect(repository.findUnit).toHaveBeenCalledWith(tenantId, unitId);
    expect(repository.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        sku: 'SRV-R740',
        name: 'Dell PowerEdge R740',
        purchasePrice: '1200.00',
        createdBy: actorUserId,
      }),
    );
    expect(result.purchasePrice).toBe(1200);
    expect(result.sellingPrice).toBe(1500);
  });

  it('rejects a reference not found in the authenticated company', async () => {
    repository.findCategory.mockResolvedValue(undefined);

    await expect(
      service.createProduct(tenantId, actorUserId, {
        sku: 'SRV-R740',
        name: 'Dell PowerEdge R740',
        categoryId,
        unitId,
        purchasePrice: 0,
        sellingPrice: 0,
        reorderLevel: 0,
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.createProduct).not.toHaveBeenCalled();
  });

  it('returns a useful conflict for duplicate category data', async () => {
    repository.createCategory.mockRejectedValue({ code: '23505' });

    await expect(
      service.createCategory(tenantId, actorUserId, {
        code: 'SERVER',
        name: 'Servers',
        isActive: true,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message: 'Category code or name already exists',
      }),
    );
  });
});
