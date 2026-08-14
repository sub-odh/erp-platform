import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { SmtpController } from './smtp.controller';
import type { SmtpService } from './smtp.service';

describe('SmtpController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'admin@example.com',
    role: 'ADMIN',
    tokenVersion: 0,
  };
  const service = {
    getCurrent: jest.fn(),
    updateCurrent: jest.fn(),
    testCurrent: jest.fn(),
  };
  const controller = new SmtpController(service as unknown as SmtpService);

  beforeEach(() => jest.clearAllMocks());

  it('reads only the current company configuration', async () => {
    service.getCurrent.mockResolvedValue(null);

    await controller.getCurrent(user);

    expect(service.getCurrent).toHaveBeenCalledWith(user.organizationId);
  });

  it('scopes configuration updates to the current company', async () => {
    const input = {
      host: 'smtp.example.com',
      port: 587,
      username: 'mailer@example.com',
      password: 'app-password',
      encryption: 'STARTTLS' as const,
      fromEmail: 'mailer@example.com',
      senderName: 'Example ERP',
      isActive: true,
    };
    service.updateCurrent.mockResolvedValue({ ...input, hasPassword: true });

    await controller.updateCurrent(user, input);

    expect(service.updateCurrent).toHaveBeenCalledWith(
      user.organizationId,
      input,
    );
  });

  it('tests only the current company transport', async () => {
    service.testCurrent.mockResolvedValue({
      success: true,
      message: 'verified',
    });

    await controller.testCurrent(user);

    expect(service.testCurrent).toHaveBeenCalledWith(user.organizationId);
  });
});
