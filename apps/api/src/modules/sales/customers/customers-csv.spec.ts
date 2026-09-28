import { parseCustomerCsv } from './customers-csv';

describe('parseCustomerCsv', () => {
  it('maps the legacy client template columns', () => {
    const csv = [
      'Client Name,Address,VAT_PAN_Number,Contact Person,Alt Contact Person,Primary Number,Alt Number,Primary Email,Alt Email',
      'Acme Trading,Kathmandu,123456789,Hari Sharma,,9801111111,,hari@acme.com,',
    ].join('\n');

    expect(parseCustomerCsv(Buffer.from(csv))).toEqual([
      {
        name: 'Acme Trading',
        address: 'Kathmandu',
        taxNumber: '123456789',
        contactPerson: 'Hari Sharma',
        phone: '9801111111',
        email: 'hari@acme.com',
      },
    ]);
  });

  it('rejects a file without a client name column', () => {
    expect(() =>
      parseCustomerCsv(Buffer.from('Address,Email\nKathmandu,a@b.com\n')),
    ).toThrow('CSV column Client Name is required');
  });
});
