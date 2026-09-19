import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { closePool, getPool } from '../db.js';
import { requireDatabaseUrl } from '../env.js';

async function migrate() {
  requireDatabaseUrl();
  const sqlPath = resolve(process.cwd(), 'server/db/schema.sql');
  const sql = await readFile(sqlPath, 'utf8');
  const pool = getPool();
  await pool.query(sql);
  console.log('Applied GIS schema from server/db/schema.sql');
}

migrate()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
