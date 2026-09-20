import { closePool, getPool } from '../db.js';
import { requireDatabaseUrl } from '../env.js';

async function validatePlaces() {
  requireDatabaseUrl();
  const pool = getPool();
  const totals = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM places WHERE COALESCE(is_active, true)`);
  const byCat = await pool.query<{ category: string; n: number }>(
    `SELECT category, COUNT(*)::int AS n FROM places WHERE COALESCE(is_active, true) GROUP BY category ORDER BY category`,
  );
  const invalid = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM places WHERE latitude NOT BETWEEN -90 AND 90 OR longitude NOT BETWEEN -180 AND 180`,
  );
  const missingName = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM places WHERE btrim(name) = ''`);
  const missingCat = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM places WHERE btrim(category) = ''`);
  const dupes = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM (
      SELECT identity_key FROM places WHERE identity_key IS NOT NULL GROUP BY identity_key HAVING COUNT(*) > 1
    ) d`,
  );
  const istanbulOutside = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM places
     WHERE country_code = 'TR' AND city ILIKE 'Istanbul' AND category <> 'airports'
       AND NOT (latitude BETWEEN 40.80 AND 41.40 AND longitude BETWEEN 28.15 AND 29.75)`,
  );
  console.log(`Total POIs: ${totals.rows[0]?.n ?? 0}`);
  console.log('');
  for (const row of byCat.rows) console.log(`${row.category}: ${row.n}`);
  console.log('');
  console.log(`Invalid coordinates: ${invalid.rows[0]?.n ?? 0}`);
  console.log(`Duplicate records: ${dupes.rows[0]?.n ?? 0}`);
  console.log(`Missing categories: ${missingCat.rows[0]?.n ?? 0}`);
  console.log(`Missing names: ${missingName.rows[0]?.n ?? 0}`);
  console.log(`Records outside Istanbul: ${istanbulOutside.rows[0]?.n ?? 0}`);
}

validatePlaces()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
