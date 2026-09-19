import pg from 'pg';
import { env, requireDatabaseUrl } from './env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: requireDatabaseUrl(),
      max: 8,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

export function hasDatabase(): boolean {
  return Boolean(env.databaseUrl);
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
