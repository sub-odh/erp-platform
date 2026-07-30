import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { db, organizations, users, type User } from '@erp/db';

@Injectable()
export class UsersService {
  async findByOrganizationAndEmail(
    organizationCode: string,
    email: string,
  ): Promise<User | undefined> {
    const normalizedOrganizationCode = organizationCode.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        passwordHash: users.passwordHash,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(
        and(
          eq(organizations.code, normalizedOrganizationCode),
          eq(users.email, normalizedEmail),
        ),
      )
      .limit(1);

    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
