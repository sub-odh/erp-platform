import { BadRequestException } from '@nestjs/common';

import { parseInventoryCsv } from './inventory-csv';

describe('parseInventoryCsv', () => {
  it('parses quoted fields and legacy status names', () => {
    const rows = parseInventoryCsv(
      Buffer.from(
        'item_name,category,vendor,quantity,cost,mrp,status\n"Router, branch",Network,Cisco,2,100.50,125,Available',
      ),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        itemName: 'Router, branch',
        category: 'Network',
        vendor: 'Cisco',
        quantity: 2,
        purchasePrice: 100.5,
        mrpPrice: 125,
        status: 'IN_STOCK',
      }),
    ]);
  });

  it('rejects incomplete rows', () => {
    expect(() =>
      parseInventoryCsv(Buffer.from('item_name,category,quantity\nRouter,,1')),
    ).toThrow(BadRequestException);
  });
});
