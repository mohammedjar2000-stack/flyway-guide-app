import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ISTANBUL_DATASET_VERSION } from '../lib/datasetVersion.ts';
import { collectVerifiedPoiRows, istanbulPoiRows, type PoiSeedRow } from '../lib/poiExport.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

function sqlLiteral(value: string | number | boolean | null): string {
  if (value == null) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${value.replace(/'/g, "''")}'`;
}

function rowValues(row: PoiSeedRow): string {
  return `(
    ${sqlLiteral(row.identity_key)},
    ${sqlLiteral(row.name)},
    ${sqlLiteral(row.local_name)},
    ${sqlLiteral(row.name_ar)},
    ${sqlLiteral(row.description)},
    ${sqlLiteral(row.description_ar)},
    ${sqlLiteral(row.country)},
    ${sqlLiteral(row.country_code)},
    ${sqlLiteral(row.city)},
    ${sqlLiteral(row.city_ar)},
    ${sqlLiteral(row.province)},
    ${sqlLiteral(row.district)},
    ${sqlLiteral(row.district_ar)},
    ${sqlLiteral(row.street_name)},
    ${sqlLiteral(row.category)},
    ${sqlLiteral(row.subcategory)},
    ${row.latitude},
    ${row.longitude},
    ${sqlLiteral(row.address)},
    ${sqlLiteral(row.address_ar)},
    ${sqlLiteral(row.phone)},
    ${sqlLiteral(row.website)},
    ${sqlLiteral(row.opening_hours)},
    ${sqlLiteral(row.rating)},
    ${row.review_count},
    ${sqlLiteral(row.image_url)},
    ${sqlLiteral(row.is_24_7)},
    ${sqlLiteral(row.is_emergency)},
    ${sqlLiteral(row.is_active)},
    ${sqlLiteral(row.verified)},
    ${sqlLiteral(row.source)},
    ${sqlLiteral(row.source_id)},
    ${sqlLiteral(row.source_url)},
    ${sqlLiteral(JSON.stringify(row.metadata))}::jsonb
  )`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const all = collectVerifiedPoiRows();
  const istanbul = istanbulPoiRows();
  const jsonPath = resolve(root, 'data/verified-pois.json');
  const sqlPath = resolve(root, 'supabase/seed.sql');
  await mkdir(dirname(jsonPath), { recursive: true });

  const payload = {
    dataset: ISTANBUL_DATASET_VERSION,
    generatedAt: new Date().toISOString(),
    total: all.length,
    istanbul: istanbul.length,
    places: all,
  };
  await writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  const statements = [
    '-- Reproducible Flyway Guide verified POI seed. Safe to re-run (upsert by identity_key).',
    "INSERT INTO dataset_meta (key, version, city, notes)",
    `VALUES ('ISTANBUL_DATASET_VERSION', ${ISTANBUL_DATASET_VERSION}, 'Istanbul', 'Verified Flyway Guide catalog')`,
    'ON CONFLICT (key) DO UPDATE SET version = EXCLUDED.version, updated_at = now();',
    '',
  ];

  for (const group of chunk(all, 80)) {
    statements.push(`INSERT INTO places (
      identity_key, name, local_name, name_ar, description, description_ar,
      country, country_code, city, city_ar, province, district, district_ar, street_name,
      category, subcategory, latitude, longitude, address, address_ar, phone, website,
      opening_hours, rating, review_count, image_url, is_24_7, is_emergency, is_active,
      verified, source, source_id, source_url, metadata
    ) VALUES
${group.map(rowValues).join(',\n')}
ON CONFLICT (identity_key) DO UPDATE SET
  name = EXCLUDED.name,
  local_name = COALESCE(EXCLUDED.local_name, places.local_name),
  name_ar = COALESCE(EXCLUDED.name_ar, places.name_ar),
  description = COALESCE(EXCLUDED.description, places.description),
  city = EXCLUDED.city,
  city_ar = COALESCE(EXCLUDED.city_ar, places.city_ar),
  district = COALESCE(EXCLUDED.district, places.district),
  district_ar = COALESCE(EXCLUDED.district_ar, places.district_ar),
  category = EXCLUDED.category,
  subcategory = COALESCE(EXCLUDED.subcategory, places.subcategory),
  latitude = CASE WHEN places.coord_locked THEN places.latitude ELSE EXCLUDED.latitude END,
  longitude = CASE WHEN places.coord_locked THEN places.longitude ELSE EXCLUDED.longitude END,
  address = COALESCE(EXCLUDED.address, places.address),
  phone = COALESCE(EXCLUDED.phone, places.phone),
  website = COALESCE(EXCLUDED.website, places.website),
  opening_hours = COALESCE(EXCLUDED.opening_hours, places.opening_hours),
  rating = COALESCE(EXCLUDED.rating, places.rating),
  image_url = COALESCE(EXCLUDED.image_url, places.image_url),
  is_24_7 = EXCLUDED.is_24_7,
  is_emergency = EXCLUDED.is_emergency,
  is_active = EXCLUDED.is_active,
  verified = EXCLUDED.verified,
  source_url = COALESCE(EXCLUDED.source_url, places.source_url),
  metadata = places.metadata || EXCLUDED.metadata,
  updated_at = now();`);
    statements.push('');
  }

  await writeFile(sqlPath, `${statements.join('\n')}\n`, 'utf8');
  const byCat = all.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    wrote: { jsonPath, sqlPath },
    total: all.length,
    istanbul: istanbul.length,
    byCategory: byCat,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
