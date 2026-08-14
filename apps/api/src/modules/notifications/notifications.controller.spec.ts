import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { NotificationsController } from './notifications.controller';
import type { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'user@example.com',
    role: 'STAFF',
    tokenVersion: 0,
  };
  const service = {
    list: jest.fn(),
    unreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  };
  const controller = new NotificationsController(
    service as unknown as NotificationsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('always scopes list requests to the current user and tenant', async () => {
    const query = { page: 1, limit: 20, unreadOnly: false };
    service.list.mockResolvedValue({ data: [] });
    await controller.list(user, query);
    expect(service.list).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      query,
    );
  });

  it('scopes unread counts to the current user and tenant', async () => {
    service.unreadCount.mockResolvedValue({ count: 2 });
    await controller.unreadCount(user);
    expect(service.unreadCount).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
    );
  });

  it('cannot mark another user notification by omitting identity scope', async () => {
    const id = '33333333-3333-4333-8333-333333333333';
    service.markRead.mockResolvedValue({ id });
    await controller.markRead(user, id);
    expect(service.markRead).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      id,
    );
  });

  it('scopes mark-all-read to the current user and tenant', async () => {
    service.markAllRead.mockResolvedValue(undefined);
    await controller.markAllRead(user);
    expect(service.markAllRead).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
    );
  });
});
