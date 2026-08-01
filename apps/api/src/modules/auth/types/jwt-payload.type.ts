import type { User } from '@erp/db';

export interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
  role: User['role'];
  tokenVersion: number;
}
