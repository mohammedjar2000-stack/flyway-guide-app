import { Router } from 'express';
import { env } from '../env.js';
import { hasDatabase } from '../db.js';
import { ISTANBUL_IMPORT_SPECS, isPlaceCategory, type PlaceCategory } from '../categories.js';
import { fetchGeoapifyPlaces } from '../geoapify.js';
import { importOsmCategory } from '../osmImport.js';
import {
  countByCategory,
  findHotelsNearMetro,
  findNearby,
  listPlaces,
  pingDb,
  upsertPlace,
} from '../placesRepo.js';
import { inferTurkeyCityEn, validateCoordinates } from '../coordIntegrity.js';
import { collectImageMetadata } from '../placeImages.js';
import { loadCoordLocks, lockMatchesPlace, saveRuntimeLock } from '../coordLocks.js';
import { fileAllPlaces, fileReplacePlaces } from '../fileStore.js';

export const placesRouter = Router();

const syncLock = new Map<string, number>();
const SYNC_COOLDOWN_MS = 45_000;

function parseCoord(value: unknown, name: string, required: boolean): number | undefined {
  if (value == null || value === '') {
    if (required) throw new Error(`${name} is required`);
    return undefined;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return n;
}

function parsePositive(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.round(n), max);
}

function specFor(category: PlaceCategory) {
  return ISTANBUL_IMPORT_SPECS.find((item) => item.category === category);
}

placesRouter.get('/health', async (_req, res) => {
  const db = hasDatabase() ? await pingDb() : false;
  res.json({
    ok: true,
    database: db,
    geoapifyConfigured: Boolean(env.geoapifyApiKey),
  });
});

placesRouter.get('/counts', async (req, res) => {
  try {
    const city = String(req.query.city ?? '').trim() || undefined;
    const counts = await countByCategory({ city });
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    res.json({
      database: hasDatabase() || total > 0,
      store: hasDatabase() ? 'postgis' : 'local',
      counts,
      total,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.get('/catalog', async (req, res) => {
  try {
    const categoryRaw = String(req.query.category ?? '').trim();
    const category = categoryRaw && isPlaceCategory(categoryRaw) ? categoryRaw : undefined;
    if (categoryRaw && !category) {
      res.status(400).json({ error: 'unsupported category' });
      return;
    }
    const rows = await listPlaces({
      category,
      city: String(req.query.city ?? '').trim() || undefined,
      limit: parsePositive(req.query.limit, 5000, 8000),
    });
    res.json({ count: rows.length, places: rows });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.get('/nearby', async (req, res) => {
  try {
    const lat = parseCoord(req.query.lat, 'lat', true)!;
    const lng = parseCoord(req.query.lng, 'lng', true)!;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'lat/lng out of range' });
      return;
    }
    const categoryRaw = String(req.query.category ?? '').trim();
    const category = categoryRaw && isPlaceCategory(categoryRaw) ? categoryRaw : undefined;
    if (categoryRaw && !category) {
      res.status(400).json({ error: 'unsupported category' });
      return;
    }
    const rows = await findNearby({
      lat,
      lng,
      radiusMeters: parsePositive(req.query.radius, 25000, 40000),
      category,
      city: String(req.query.city ?? '').trim() || undefined,
      limit: parsePositive(req.query.limit, 2500, 5000),
    });
    res.json({ count: rows.length, places: rows });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.post('/sync', async (req, res) => {
  try {
    if (!hasDatabase()) {
      res.status(503).json({ error: 'DATABASE_URL is not configured' });
      return;
    }
    if (!env.geoapifyApiKey) {
      res.status(503).json({ error: 'GEOAPIFY_API_KEY is not configured' });
      return;
    }
    const lat = parseCoord(req.query.lat ?? req.body?.lat, 'lat', true)!;
    const lng = parseCoord(req.query.lng ?? req.body?.lng, 'lng', true)!;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'lat/lng out of range' });
      return;
    }
    const categoryRaw = String(req.query.category ?? req.body?.category ?? 'pharmacies').trim();
    if (!isPlaceCategory(categoryRaw)) {
      res.status(400).json({ error: 'unsupported category' });
      return;
    }
    const spec = specFor(categoryRaw);
    if (!spec) {
      res.status(400).json({ error: 'no import spec for category' });
      return;
    }
    const cell = `${categoryRaw}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const last = syncLock.get(cell) ?? 0;
    if (Date.now() - last < SYNC_COOLDOWN_MS) {
      const counts = await countByCategory();
      res.json({ ok: true, skipped: true, inserted: 0, updated: 0, counts });
      return;
    }
    syncLock.set(cell, Date.now());

    const city = inferTurkeyCityEn(lat, lng, String(req.query.city ?? req.body?.city ?? '').trim());
    const country = String(req.query.country ?? req.body?.country ?? 'Turkey').trim() || 'Turkey';
    const countryCode = String(req.query.countryCode ?? req.body?.countryCode ?? 'TR').trim().slice(0, 2) || 'TR';
    const limit = parsePositive(req.query.limit ?? req.body?.limit, 200, 400);
    const radiusMeters = parsePositive(req.query.radius ?? req.body?.radius, 25000, 40000);

    const places = await fetchGeoapifyPlaces(spec, { lon: lng, lat, radiusMeters, limit });
    let inserted = 0;
    let updated = 0;
    for (const place of places) {
      const result = await upsertPlace({
        name: place.name,
        localName: place.localName,
        country: place.country || country,
        countryCode: (place.countryCode || countryCode).slice(0, 2),
        city: city,
        category: spec.category,
        subcategory: spec.subcategory,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        phone: place.phone,
        website: place.website,
        openingHours: place.openingHours,
        source: 'Geoapify',
        sourceId: place.sourceId,
        metadata: {
          labelAr: spec.labelAr,
          geoapifyCategories: place.categories,
          image_url: place.imageUrl,
          images: place.images,
        },
        precisionHint: place.osmType === 'node' || place.osmType === 'n' || place.bboxSpanMeters === 0 ? 'rooftop' : 'venue',
        bboxSpanMeters: place.bboxSpanMeters,
        osmType: place.osmType,
        resultType: place.resultType,
        confidence: place.confidence,
      });
      if (result === 'inserted') inserted += 1;
      if (result === 'updated') updated += 1;
    }
    const counts = await countByCategory();
    res.json({
      ok: true,
      skipped: false,
      fetched: places.length,
      inserted,
      updated,
      counts,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.post('/ingest', async (req, res) => {
  try {
    const incoming = Array.isArray(req.body?.places) ? req.body.places as unknown[] : [];
    if (incoming.length === 0) {
      res.json({ ok: true, inserted: 0, updated: 0 });
      return;
    }
    const slice = incoming.slice(0, 400);
    let inserted = 0;
    let updated = 0;
    for (const raw of slice) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const category = String(item.category ?? '').trim();
      if (!isPlaceCategory(category)) continue;
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const name = String(item.name ?? '').trim();
      const sourceId = String(item.sourceId ?? item.id ?? '').trim();
      if (!name || !sourceId) continue;
      const result = await upsertPlace({
        name,
        localName: String(item.localName ?? '').trim() || null,
        country: String(item.country ?? 'Turkey').trim() || 'Turkey',
        countryCode: String(item.countryCode ?? 'TR').trim().slice(0, 2) || 'TR',
        city: inferTurkeyCityEn(lat, lng, String(item.city ?? '').trim()),
        category,
        subcategory: String(item.subcategory ?? category).trim() || category,
        latitude: lat,
        longitude: lng,
        address: String(item.address ?? '').trim() || null,
        phone: String(item.phone ?? '').trim() || null,
        website: String(item.website ?? '').trim() || null,
        openingHours: String(item.hours ?? item.openingHours ?? '').trim() || null,
        source: String(item.source ?? 'OpenStreetMap').trim() || 'OpenStreetMap',
        sourceId,
        metadata: {
          ingested: true,
          ...collectImageMetadata({
            name,
            extra: [
              ...(Array.isArray(item.images) ? item.images.filter((url): url is string => typeof url === 'string') : []),
              typeof item.image === 'string' ? item.image : '',
            ],
          }),
        },
      });
      if (result === 'inserted') inserted += 1;
      if (result === 'updated') updated += 1;
    }
    const counts = await countByCategory();
    res.json({ ok: true, inserted, updated, counts });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.post('/sync-osm', async (req, res) => {
  try {
    const lat = parseCoord(req.query.lat ?? req.body?.lat, 'lat', true)!;
    const lng = parseCoord(req.query.lng ?? req.body?.lng, 'lng', true)!;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'lat/lng out of range' });
      return;
    }
    const categoryRaw = String(req.query.category ?? req.body?.category ?? 'pharmacies').trim();
    if (!isPlaceCategory(categoryRaw)) {
      res.status(400).json({ error: 'unsupported category' });
      return;
    }
    const cell = `osm:${categoryRaw}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const last = syncLock.get(cell) ?? 0;
    if (Date.now() - last < SYNC_COOLDOWN_MS) {
      const counts = await countByCategory();
      res.json({ ok: true, skipped: true, inserted: 0, updated: 0, counts });
      return;
    }
    syncLock.set(cell, Date.now());
    const result = await importOsmCategory({
      category: categoryRaw,
      lat,
      lng,
      radiusMeters: parsePositive(req.query.radius ?? req.body?.radius, 25000, 40000),
      limit: parsePositive(req.query.limit ?? req.body?.limit, 250, 400),
      city: inferTurkeyCityEn(lat, lng, String(req.query.city ?? req.body?.city ?? '').trim()),
      country: String(req.query.country ?? req.body?.country ?? 'Turkey').trim() || 'Turkey',
      countryCode: String(req.query.countryCode ?? req.body?.countryCode ?? 'TR').trim().slice(0, 2) || 'TR',
    });
    const counts = await countByCategory();
    res.json({ ok: true, skipped: false, ...result, counts });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.get('/locks', (_req, res) => {
  res.json({ locks: loadCoordLocks() });
});

placesRouter.post('/lock-coord', async (req, res) => {
  try {
    const lat = parseCoord(req.body?.lat, 'lat', true)!;
    const lng = parseCoord(req.body?.lng, 'lng', true)!;
    const name = String(req.body?.name ?? '').trim();
    const city = inferTurkeyCityEn(lat, lng, String(req.body?.city ?? '').trim());
    const category = String(req.body?.category ?? '').trim();
    if (!name || !isPlaceCategory(category)) {
      res.status(400).json({ error: 'name and supported category are required' });
      return;
    }
    const verdict = validateCoordinates({
      lat,
      lng,
      city,
      country: String(req.body?.country ?? 'Turkey'),
      address: String(req.body?.address ?? name),
      precisionHint: 'rooftop',
    });
    if (!verdict.ok && !req.body?.force) {
      res.status(400).json({ error: 'coordinates failed integrity checks', reasons: verdict.reasons });
      return;
    }
    const lock = {
      sourceId: String(req.body?.sourceId ?? '').trim() || undefined,
      name,
      city,
      category,
      lat: verdict.lat,
      lng: verdict.lng,
      note: String(req.body?.note ?? 'manual rooftop lock').trim(),
    };
    saveRuntimeLock(lock);
    const places = fileAllPlaces();
    let updated = 0;
    const next = places.map((place) => {
      const hit = lockMatchesPlace(lock, {
        name: place.name,
        localName: place.local_name,
        city: place.city,
        category: place.category,
        sourceId: place.source_id,
      });
      if (!hit) return place;
      updated += 1;
      return {
        ...place,
        latitude: lock.lat,
        longitude: lock.lng,
        metadata: {
          ...place.metadata,
          coord_locked: true,
          coord_verified: true,
          coord_precision: 'rooftop',
          coord_reasons: ['manual-lock'],
        },
      };
    });
    fileReplacePlaces(next);
    res.json({ ok: true, lock, updated });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});

placesRouter.get('/hotels-near-metro', async (req, res) => {
  try {
    if (!hasDatabase()) {
      res.status(503).json({ error: 'DATABASE_URL is not configured' });
      return;
    }
    const lat = parseCoord(req.query.lat, 'lat', false);
    const lng = parseCoord(req.query.lng, 'lng', false);
    if ((lat == null) !== (lng == null)) {
      res.status(400).json({ error: 'lat and lng must be provided together' });
      return;
    }
    if (lat != null && lng != null && (lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
      res.status(400).json({ error: 'lat/lng out of range' });
      return;
    }
    const rows = await findHotelsNearMetro({
      lat,
      lng,
      radiusMeters: parsePositive(req.query.radius, 3000, 12000),
      city: inferTurkeyCityEn(lat ?? 0, lng ?? 0, String(req.query.city ?? '').trim()) || String(req.query.city ?? '').trim(),
      limit: parsePositive(req.query.limit, 40, 120),
    });
    res.json({ count: rows.length, hotels: rows });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid request' });
  }
});
