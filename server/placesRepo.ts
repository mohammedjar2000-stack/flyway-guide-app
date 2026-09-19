import { getPool } from './db.js';
import { hasDatabase } from './db.js';
import type { PlaceCategory } from './categories.js';
import {
  fileCountByCategory,
  fileFindNearby,
  fileListPlaces,
  fileUpsert,
} from './fileStore.js';
import { applyCoordPolicy } from './coordLocks.js';
import type { CoordPrecision } from './coordIntegrity.js';

export interface PlaceRow {
  id: string;
  name: string;
  local_name: string | null;
  country: string;
  country_code: string;
  city: string;
  category: string;
  subcategory: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  source: string;
  source_id: string | null;
  last_updated: string;
  metadata: Record<string, unknown>;
  distance_m?: number;
}

export interface HotelNearMetroRow extends PlaceRow {
  metro_id: string | null;
  metro_name: string | null;
  metro_local_name: string | null;
  metro_latitude: number | null;
  metro_longitude: number | null;
  metro_distance_m: number | null;
  metro_walk_minutes: number | null;
}

export interface UpsertPlaceInput {
  name: string;
  localName?: string | null;
  country: string;
  countryCode: string;
  city: string;
  category: PlaceCategory;
  subcategory?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: string | null;
  source: string;
  sourceId: string;
  metadata?: Record<string, unknown>;
  precisionHint?: CoordPrecision | null;
  bboxSpanMeters?: number | null;
  osmType?: string | null;
  resultType?: string | null;
  confidence?: number | null;
}

const PLACE_COLUMNS = `
  id, name, local_name, country, country_code, city, category, subcategory,
  latitude, longitude, address, phone, website, opening_hours, source, source_id,
  last_updated, metadata
`;

const COORD_DEDUP_METERS = 45;
const HOTEL_DEDUP_METERS = 18;
const TELECOM_DEDUP_METERS = 18;
const EXCHANGE_DEDUP_METERS = 18;

function categoryDedupMeters(category: string): number {
  if (category === 'hotels') return HOTEL_DEDUP_METERS;
  if (category === 'telecom') return TELECOM_DEDUP_METERS;
  if (category === 'exchange' || category === 'transport' || category === 'fuel' || category === 'bakeries') return EXCHANGE_DEDUP_METERS;
  return COORD_DEDUP_METERS;
}

function walkMinutes(meters: number | null | undefined): number | null {
  if (meters == null || !Number.isFinite(meters)) return null;
  return Math.max(1, Math.round(meters / 80));
}

export async function upsertPlace(input: UpsertPlaceInput): Promise<'inserted' | 'updated' | 'skipped'> {
  const policy = applyCoordPolicy({
    name: input.name,
    localName: input.localName,
    city: input.city,
    country: input.country,
    category: input.category,
    address: input.address,
    sourceId: input.sourceId,
    latitude: input.latitude,
    longitude: input.longitude,
    precisionHint: input.precisionHint,
    bboxSpanMeters: input.bboxSpanMeters,
    osmType: input.osmType,
    resultType: input.resultType,
    confidence: input.confidence,
  });
  if (!policy) return 'skipped';
  const next: UpsertPlaceInput = {
    ...input,
    latitude: policy.latitude,
    longitude: policy.longitude,
    metadata: {
      ...(input.metadata ?? {}),
      coord_verified: policy.verified,
      coord_locked: policy.locked,
      coord_precision: policy.precision,
      coord_reasons: policy.reasons,
    },
  };
  if (!hasDatabase()) return fileUpsert(next);
  const pool = getPool();
  const existingBySource = await pool.query<{ id: string; latitude: number; longitude: number; metadata: Record<string, unknown> }>(
    `SELECT id, latitude, longitude, metadata FROM places WHERE source = $1 AND source_id = $2 LIMIT 1`,
    [next.source, next.sourceId],
  );
  if ((existingBySource.rowCount ?? 0) > 0) {
    const row = existingBySource.rows[0];
    const locked = Boolean(row.metadata?.coord_locked) || policy.locked;
    const lat = locked ? row.latitude : next.latitude;
    const lng = locked ? row.longitude : next.longitude;
    await pool.query(
      `UPDATE places SET
        name = $3,
        local_name = COALESCE($4, local_name),
        country = $5,
        country_code = $6,
        city = $7,
        category = $8,
        subcategory = $9,
        latitude = $10,
        longitude = $11,
        address = COALESCE($12, address),
        phone = COALESCE($13, phone),
        website = COALESCE($14, website),
        opening_hours = COALESCE($15, opening_hours),
        metadata = metadata || $16::jsonb
      WHERE source = $1 AND source_id = $2`,
      [
        next.source,
        next.sourceId,
        next.name,
        next.localName ?? null,
        next.country,
        next.countryCode,
        next.city,
        next.category,
        next.subcategory ?? null,
        lat,
        lng,
        next.address ?? null,
        next.phone ?? null,
        next.website ?? null,
        next.openingHours ?? null,
        JSON.stringify({ ...next.metadata, coord_locked: locked }),
      ],
    );
    return 'updated';
  }

  const nearby = await pool.query<{ id: string }>(
    `SELECT id FROM places
     WHERE category = $1
       AND ST_DWithin(
         geom,
         ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
         $4
       )
     LIMIT 1`,
    [next.category, next.latitude, next.longitude, categoryDedupMeters(next.category)],
  );
  if ((nearby.rowCount ?? 0) > 0) return 'skipped';

  await pool.query(
    `INSERT INTO places (
      name, local_name, country, country_code, city, category, subcategory,
      latitude, longitude, address, phone, website, opening_hours, source, source_id, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)`,
    [
      next.name,
      next.localName ?? null,
      next.country,
      next.countryCode,
      next.city,
      next.category,
      next.subcategory ?? null,
      next.latitude,
      next.longitude,
      next.address ?? null,
      next.phone ?? null,
      next.website ?? null,
      next.openingHours ?? null,
      next.source,
      next.sourceId,
      JSON.stringify(next.metadata ?? {}),
    ],
  );
  return 'inserted';
}

export async function findNearby(opts: {
  lat: number;
  lng: number;
  radiusMeters: number;
  category?: PlaceCategory;
  city?: string;
  limit: number;
}): Promise<PlaceRow[]> {
  if (!hasDatabase()) return fileFindNearby(opts);
  const pool = getPool();
  const params: unknown[] = [opts.lat, opts.lng, opts.radiusMeters, opts.limit];
  let sql = `
    SELECT ${PLACE_COLUMNS},
           ST_Distance(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_m
    FROM places
    WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
  `;
  if (opts.category) {
    params.push(opts.category);
    sql += ` AND category = $${params.length}`;
  }
  if (opts.city) {
    params.push(opts.city);
    sql += ` AND city ILIKE $${params.length}`;
  }
  sql += ` ORDER BY distance_m ASC LIMIT $4`;
  const result = await pool.query<PlaceRow>(sql, params);
  return result.rows;
}

export async function listPlaces(opts: {
  category?: PlaceCategory;
  city?: string;
  limit: number;
}): Promise<PlaceRow[]> {
  if (!hasDatabase()) return fileListPlaces(opts);
  const pool = getPool();
  const params: unknown[] = [opts.limit];
  let sql = `SELECT ${PLACE_COLUMNS} FROM places WHERE 1=1`;
  if (opts.category) {
    params.push(opts.category);
    sql += ` AND category = $${params.length}`;
  }
  if (opts.city) {
    params.push(opts.city);
    sql += ` AND city ILIKE $${params.length}`;
  }
  sql += ` ORDER BY last_updated DESC LIMIT $1`;
  const result = await pool.query<PlaceRow>(sql, params);
  return result.rows;
}

export async function countByCategory(opts?: { city?: string }): Promise<Record<string, number>> {
  if (!hasDatabase()) return fileCountByCategory(opts);
  const pool = getPool();
  const params: unknown[] = [];
  let sql = `SELECT category, COUNT(*)::int AS n FROM places`;
  if (opts?.city) {
    params.push(opts.city);
    sql += ` WHERE city ILIKE $1`;
  }
  sql += ` GROUP BY category`;
  const result = await pool.query<{ category: string; n: number }>(sql, params);
  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    counts[row.category] = Number(row.n) || 0;
  }
  return counts;
}

export async function findHotelsNearMetro(opts: {
  lat?: number;
  lng?: number;
  radiusMeters: number;
  city?: string;
  limit: number;
}): Promise<HotelNearMetroRow[]> {
  if (!hasDatabase()) return [];
  const pool = getPool();
  const hasOrigin = Number.isFinite(opts.lat) && Number.isFinite(opts.lng);
  const lat = hasOrigin ? opts.lat! : 41.0082;
  const lng = hasOrigin ? opts.lng! : 28.9784;
  const params: unknown[] = [lat, lng, opts.radiusMeters, opts.limit];
  let cityClause = '';
  if (opts.city) {
    params.push(opts.city);
    cityClause = ` AND h.city ILIKE $${params.length}`;
  }

  const sql = `
    SELECT ${PLACE_COLUMNS.split(',').map((col) => `h.${col.trim()}`).join(', ')},
           ST_Distance(h.geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_m,
           m.id AS metro_id,
           m.name AS metro_name,
           m.local_name AS metro_local_name,
           m.latitude AS metro_latitude,
           m.longitude AS metro_longitude,
           ST_Distance(h.geom, m.geom) AS metro_distance_m
    FROM places h
    LEFT JOIN LATERAL (
      SELECT p.id, p.name, p.local_name, p.latitude, p.longitude, p.geom
      FROM places p
      WHERE p.category = 'transport'
        AND p.subcategory IN ('metro', 'subway')
      ORDER BY ST_Distance(p.geom, h.geom) ASC
      LIMIT 1
    ) m ON true
    WHERE h.category = 'hotels'
      AND ST_DWithin(h.geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
      ${cityClause}
    ORDER BY ${hasOrigin ? 'distance_m' : 'metro_distance_m NULLS LAST'} ASC
    LIMIT $4
  `;
  const result = await pool.query<Omit<HotelNearMetroRow, 'metro_walk_minutes'>>(sql, params);
  return result.rows.map((row) => ({
    ...row,
    metro_walk_minutes: walkMinutes(row.metro_distance_m),
  }));
}

export async function pingDb(): Promise<boolean> {
  try {
    const result = await getPool().query<{ ok: number }>('SELECT 1 AS ok');
    return Number(result.rows[0]?.ok) === 1;
  } catch {
    return false;
  }
}
