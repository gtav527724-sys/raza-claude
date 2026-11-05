import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazy connection: importing this module never throws, so `next build`
 * and Vercel static analysis work even before DATABASE_URL is configured.
 * The first real query creates the pool.
 */
const g = globalThis as typeof globalThis & {
  __sonaraPool?: Pool;
  __sonaraDb?: NodePgDatabase;
};

export function getPool(): Pool {
  if (g.__sonaraPool) return g.__sonaraPool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const isLocal = /(localhost|127\.0\.0\.1|::1)/.test(url);
  const pool = new Pool({
    connectionString: url,
    // Hosted Postgres (Neon / Supabase / Vercel) needs TLS; local does not.
    ssl: isLocal || /sslmode=disable/i.test(url) ? undefined : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX ?? 8),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", () => {
    /* idle client errors must never crash the server */
  });
  g.__sonaraPool = pool;
  return pool;
}

function getDb(): NodePgDatabase {
  if (!g.__sonaraDb) g.__sonaraDb = drizzle(getPool());
  return g.__sonaraDb;
}

function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_t, prop) {
      const real = get() as unknown as Record<string | symbol, unknown>;
      const value = real[prop];
      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(real)
        : value;
    },
  });
}

export const db = lazy(getDb);
export const pool = lazy(getPool);
