import { compare } from 'bcrypt';
import dotenv from 'dotenv';
import { and, eq } from 'drizzle-orm';
import path from 'node:path';

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function checkOwnerLogin(): Promise<void> {
  const organizationCode = required('CHECK_ORG_CODE').toUpperCase();
  const email = required('CHECK_EMAIL').toLowerCase();
  const password = required('CHECK_PASSWORD');

  const { client, db, organizations, users } = await import('@erp/db');

  try {
    const [user] = await db
      .select({
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        passwordHash: users.passwordHash,
        organizationCode: organizations.code,
      })
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(
        and(eq(organizations.code, organizationCode), eq(users.email, email)),
      )
      .limit(1);

    if (!user) {
      console.log({
        userExists: false,
        organizationCode,
        email,
      });

      return;
    }

    const passwordMatches = await compare(password, user.passwordHash);

    console.log({
      userExists: true,
      organizationCode: user.organizationCode,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordMatches,
    });
  } finally {
    await client.end();
  }
}

checkOwnerLogin().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
