import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { closePool, getPool } from '../db.js';
import { requireDatabaseUrl } from '../env.js';

async function seedVerifiedCatalog() {
  requireDatabaseUrl();
  const schemaPath = resolve(process.cwd(), 'server/db/schema.sql');
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260920213000_places_poi_production_layer.sql');
  const seedPath = resolve(process.cwd(), 'supabase/seed.sql');
  const pool = getPool();
  await pool.query(await readFile(schemaPath, 'utf8'));
  await pool.query(await readFile(migrationPath, 'utf8'));
  await pool.query(await readFile(seedPath, 'utf8'));
  const counts = await pool.query<{ category: string; n: string }>(
    `SELECT category, COUNT(*)::text AS n FROM places WHERE source = 'flyway-verified' GROUP BY category ORDER BY category`,
  );
  const total = await pool.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM places WHERE source = 'flyway-verified'`);
  console.log('Verified catalog seed complete', {
    total: Number(total.rows[0]?.n || 0),
    byCategory: Object.fromEntries(counts.rows.map((row) => [row.category, Number(row.n)])),
  });
}

seedVerifiedCatalog()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
