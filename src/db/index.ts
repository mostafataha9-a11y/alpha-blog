import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

/**
 * Unified PostgreSQL Pool Configuration Resolver
 * Ensures application runtime and migration tools share the exact same connection logic,
 * with DATABASE_URL priority, Unix domain socket / Cloud SQL support, and SSL handling.
 */
export const getPostgresPoolConfig = (options?: { isAdmin?: boolean }): PoolConfig => {
  const isSocket = Boolean(process.env.SQL_HOST && process.env.SQL_HOST.startsWith('/'));
  const useSsl =
    process.env.SQL_SSL === 'true' ||
    (process.env.NODE_ENV === 'production' &&
      !isSocket &&
      process.env.SQL_HOST &&
      !process.env.SQL_HOST.includes('localhost'));

  const poolConfig: PoolConfig = {
    max: 10,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  };

  const adminUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const adminPassword = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
    if (useSsl) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  } else {
    poolConfig.host = process.env.SQL_HOST;
    poolConfig.port = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432;
    poolConfig.user = options?.isAdmin ? adminUser : process.env.SQL_USER;
    poolConfig.password = options?.isAdmin ? adminPassword : process.env.SQL_PASSWORD;
    poolConfig.database = process.env.SQL_DB_NAME;
    if (useSsl && !isSocket) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  }

  return poolConfig;
};

export const createPool = () => {
  if (!global._postgresPool) {
    const poolConfig = getPostgresPoolConfig({ isAdmin: false });
    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
