import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres({
  host: process.env.POSTGRES_HOST ?? "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB!,
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
});

export const db = drizzle(client);

export { client };
