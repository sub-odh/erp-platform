import type { JwtPayload } from '../auth/types/jwt-payload.type';
import type { CompanyDataService } from './company-data.service';
import { CompanyController } from './company.controller';
import type { CompanyService } from './company.service';

describe('CompanyController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'admin@example.com',
    role: 'ADMIN',
    tokenVersion: 0,
  };
  const companyService = {
    findCurrent: jest.fn(),
    updateCurrent: jest.fn(),
    uploadLogo: jest.fn(),
    removeLogo: jest.fn(),
    uploadInvoiceLogo: jest.fn(),
    removeInvoiceLogo: jest.fn(),
  };
  const companyDataService = {
    createBackup: jest.fn(),
    restoreBackup: jest.fn(),
    resetData: jest.fn(),
  };
  const controller = new CompanyController(
    companyService as unknown as CompanyService,
    companyDataService as unknown as CompanyDataService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('reads the company from the authenticated tenant only', async () => {
    companyService.findCurrent.mockResolvedValue({ id: user.organizationId });

    await controller.getCurrent(user);

    expect(companyService.findCurrent).toHaveBeenCalledWith(
      user.organizationId,
    );
  });

  it('creates a backup for the authenticated company only', async () => {
    companyDataService.createBackup.mockResolvedValue({
      format: 'erp-company-backup',
    });

    await controller.createBackup(user);

    expect(companyDataService.createBackup).toHaveBeenCalledWith(
      user.organizationId,
    );
  });

  it('passes restore confirmation and file into the current company scope', async () => {
    const file = { buffer: Buffer.from('{}') } as Express.Multer.File;
    companyDataService.restoreBackup.mockResolvedValue({ success: true });

    await controller.restoreBackup(
      user,
      {
        confirmation: 'RESTORE MYCOMPANY',
        ownerPassword: 'current-owner-password',
      },
      file,
    );

    expect(companyDataService.restoreBackup).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      'RESTORE MYCOMPANY',
      'current-owner-password',
      file,
    );
  });

  it('resets data inside the authenticated company scope only', async () => {
    companyDataService.resetData.mockResolvedValue({ success: true });

    await controller.resetData(user, {
      confirmation: 'RESET MYCOMPANY',
      ownerPassword: 'current-owner-password',
    });

    expect(companyDataService.resetData).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      'RESET MYCOMPANY',
      'current-owner-password',
    );
  });
});
