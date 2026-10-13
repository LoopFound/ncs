import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

export type { Prisma } from "@/generated/prisma/client";

function createClient() {
  const e = env();
  const adapter = new PrismaPg({
    connectionString: e.DATABASE_URL,
    max: e.DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({
    adapter,
    log: e.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

type Client = ReturnType<typeof createClient>;
const globalForDb = globalThis as unknown as { __ncsDb?: Client };

/** Lazily-created singleton (survives Next dev hot reloads). */
export function getDb(): Client {
  if (!globalForDb.__ncsDb) globalForDb.__ncsDb = createClient();
  return globalForDb.__ncsDb;
}

/**
 * Proxy so callers can write `db.product.findMany()` while the client is only
 * constructed (and env validated) on first real use — never at build time.
 */
export const db: Client = new Proxy({} as Client, {
  get(_target, prop, receiver) {
    const client = getDb();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Tx = Parameters<Parameters<Client["$transaction"]>[0]>[0];
