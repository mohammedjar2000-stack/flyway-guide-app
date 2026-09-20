import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { closePool, getPool } from '../db.js';
import { requireDatabaseUrl } from '../env.js';

async function migrate() {
  requireDatabaseUrl();
  const pool = getPool();
  const schemaPath = resolve(process.cwd(), 'server/db/schema.sql');
  const extraPath = resolve(process.cwd(), 'supabase/migrations/20260920213000_places_poi_production_layer.sql');
  await pool.query(await readFile(schemaPath, 'utf8'));
  await pool.query(await readFile(extraPath, 'utf8'));
  console.log('Applied GIS schema from server/db/schema.sql and POI production layer');
}

migrate()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
