import { AsyncLocalStorage } from "node:async_hooks";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

const client = postgres({
  host: process.env.POSTGRES_HOST ?? "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB!,
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
});

const rootDb = drizzle(client);

type Database = typeof rootDb;
type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

interface TenantDatabaseContext {
  tenantId: string;
  transaction: DatabaseTransaction;
}

const tenantDatabaseContext = new AsyncLocalStorage<TenantDatabaseContext>();

/**
 * Database facade used by application code. Inside `withTenantContext` it
 * transparently resolves to the tenant transaction, so existing repositories
 * cannot accidentally escape the PostgreSQL session context.
 */
export const db = new Proxy(rootDb, {
  get(target, property, receiver) {
    const activeDatabase =
      tenantDatabaseContext.getStore()?.transaction ?? target;
    const value = Reflect.get(activeDatabase, property, activeDatabase);

    return typeof value === "function" ? value.bind(activeDatabase) : value;
  },
}) as Database;

export function getCurrentTenantId(): string | undefined {
  return tenantDatabaseContext.getStore()?.tenantId;
}

export async function withTenantContext<T>(
  tenantId: string,
  callback: () => Promise<T>,
): Promise<T> {
  const currentContext = tenantDatabaseContext.getStore();

  if (currentContext) {
    if (currentContext.tenantId !== tenantId) {
      throw new Error("Cannot switch tenants inside an active transaction");
    }

    return callback();
  }

  return rootDb.transaction(async (transaction) => {
    await transaction.execute(
      sql`select set_config('app.local_tenant_id', ${tenantId}, true)`,
    );

    return tenantDatabaseContext.run(
      {
        tenantId,
        transaction,
      },
      callback,
    );
  });
}

export { client };
