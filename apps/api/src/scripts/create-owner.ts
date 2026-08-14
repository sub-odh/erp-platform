import { hash } from 'bcrypt';
import dotenv from 'dotenv';
import { and, eq, inArray, sql } from 'drizzle-orm';
import path from 'node:path';

import { DEFAULT_ROLE_PERMISSIONS } from '../modules/auth/permissions/permission.constants';

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

function getRequiredVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required variable: ${name}`);
  }

  return value;
}

async function createOwner(): Promise<void> {
  const organizationName = getRequiredVariable('OWNER_ORG_NAME');
  const organizationCode = getRequiredVariable('OWNER_ORG_CODE').toUpperCase();

  const email = getRequiredVariable('OWNER_EMAIL').toLowerCase();
  const password = getRequiredVariable('OWNER_PASSWORD');
  const firstName = getRequiredVariable('OWNER_FIRST_NAME');
  const lastName = getRequiredVariable('OWNER_LAST_NAME');

  if (password.length < 12) {
    throw new Error('OWNER_PASSWORD must contain at least 12 characters');
  }

  // Import after dotenv has loaded the database environment variables.
  const {
    client,
    db,
    organizations,
    permissions,
    rolePermissions,
    users,
  } = await import('@erp/db');

  try {
    const passwordHash = await hash(password, 12);

    const result = await db.transaction(async (transaction) => {
      let [organization] = await transaction
        .select({
          id: organizations.id,
          name: organizations.name,
          code: organizations.code,
        })
        .from(organizations)
        .where(eq(organizations.code, organizationCode))
        .limit(1);

      if (!organization) {
        [organization] = await transaction
          .insert(organizations)
          .values({
            name: organizationName,
            code: organizationCode,
          })
          .returning({
            id: organizations.id,
            name: organizations.name,
            code: organizations.code,
          });
      }

      await transaction.execute(
        sql`select set_config('app.local_tenant_id', ${organization.id}, true)`,
      );

      const permissionCodes = [...new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flat())];
      const availablePermissions = await transaction
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions)
        .where(inArray(permissions.code, permissionCodes));
      const permissionIds = new Map(
        availablePermissions.map((permission) => [
          permission.code,
          permission.id,
        ]),
      );
      const assignments = Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(
        ([role, codes]) =>
          codes.map((code) => ({
            organizationId: organization.id,
            role: role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF',
            permissionId: permissionIds.get(code),
          })),
      );

      if (assignments.some(({ permissionId }) => !permissionId)) {
        throw new Error('Permission catalog is incomplete; run migrations first');
      }

      await transaction
        .insert(rolePermissions)
        .values(
          assignments.map((assignment) => ({
            ...assignment,
            permissionId: assignment.permissionId!,
          })),
        )
        .onConflictDoNothing();

      const [existingUser] = await transaction
        .select({
          id: users.id,
        })
        .from(users)
        .where(
          and(
            eq(users.organizationId, organization.id),
            eq(users.email, email),
          ),
        )
        .limit(1);

      if (existingUser) {
        throw new Error(
          `A user with email ${email} already exists in ${organizationCode}`,
        );
      }

      const [owner] = await transaction
        .insert(users)
        .values({
          organizationId: organization.id,
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'OWNER',
          isActive: true,
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
        });

      return {
        organization,
        owner,
      };
    });

    console.log('Organization owner created successfully.');
    console.log({
      organizationCode: result.organization.code,
      email: result.owner.email,
      role: result.owner.role,
    });
  } finally {
    await client.end();
  }
}

createOwner().catch((error: unknown) => {
  console.error('Failed to create organization owner.');

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
