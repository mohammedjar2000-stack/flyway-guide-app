import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { validateCoordinates, haversineMeters, type CoordPrecision } from './coordIntegrity.js';
import type { StoredPlace } from './fileStore.js';

export interface CoordLock {
  sourceId?: string;
  name: string;
  aliases?: string[];
  city: string;
  category: string;
  lat: number;
  lng: number;
  note?: string;
}

const LOCKS_PATH = resolve(process.cwd(), 'server', 'seed', 'coordLocks.json');
const RUNTIME_LOCKS_PATH = resolve(process.cwd(), 'server', 'data', 'coordLocks.json');

let bundled: CoordLock[] | null = null;
let runtime: CoordLock[] | null = null;

function readLocks(path: string): CoordLock[] {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as CoordLock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
}

function namesOverlap(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = shorter === left ? right : left;
  return shorter.length >= 10 && longer.includes(shorter);
}

export function lockMatchesPlace(lock: CoordLock, opts: {
  name: string;
  localName?: string | null;
  city?: string | null;
  category?: string | null;
  sourceId?: string | null;
}): boolean {
  const sourceId = String(opts.sourceId || '').trim();
  if (sourceId && lock.sourceId && lock.sourceId === sourceId) return true;
  const placeNames = [opts.name, opts.localName].filter(Boolean) as string[];
  const lockNames = [lock.name, ...(lock.aliases ?? [])];
  if (!lockNames.some((lockName) => placeNames.some((placeName) => namesOverlap(lockName, placeName)))) {
    return false;
  }
  const category = normalize(opts.category || '');
  if (category && normalize(lock.category) !== category) return false;
  const city = normalize(opts.city || '');
  if (city && normalize(lock.city) !== city) return false;
  return true;
}

export function loadCoordLocks(): CoordLock[] {
  if (!bundled) bundled = readLocks(LOCKS_PATH);
  if (!runtime) runtime = readLocks(RUNTIME_LOCKS_PATH);
  return [...bundled, ...runtime];
}

export function saveRuntimeLock(lock: CoordLock) {
  runtime = readLocks(RUNTIME_LOCKS_PATH);
  const key = `${normalize(lock.category)}:${normalize(lock.name)}:${normalize(lock.city)}`;
  runtime = runtime.filter((item) => `${normalize(item.category)}:${normalize(item.name)}:${normalize(item.city)}` !== key);
  runtime.push(lock);
  mkdirSync(dirname(RUNTIME_LOCKS_PATH), { recursive: true });
  writeFileSync(RUNTIME_LOCKS_PATH, JSON.stringify(runtime, null, 2), 'utf8');
}

export function matchCoordLock(opts: {
  name: string;
  localName?: string | null;
  city?: string | null;
  category?: string | null;
  sourceId?: string | null;
}): CoordLock | null {
  return loadCoordLocks().find((item) => lockMatchesPlace(item, opts)) ?? null;
}

export function applyCoordPolicy(input: {
  name: string;
  localName?: string | null;
  city?: string | null;
  country?: string | null;
  category?: string | null;
  address?: string | null;
  sourceId?: string | null;
  latitude: number;
  longitude: number;
  precisionHint?: CoordPrecision | null;
  bboxSpanMeters?: number | null;
  osmType?: string | null;
  resultType?: string | null;
  confidence?: number | null;
  existingLocked?: boolean;
  existingLat?: number;
  existingLng?: number;
}): {
  ok: boolean;
  latitude: number;
  longitude: number;
  precision: CoordPrecision;
  verified: boolean;
  locked: boolean;
  reasons: string[];
} | null {
  if (input.existingLocked && Number.isFinite(input.existingLat) && Number.isFinite(input.existingLng)) {
    return {
      ok: true,
      latitude: input.existingLat!,
      longitude: input.existingLng!,
      precision: 'rooftop',
      verified: true,
      locked: true,
      reasons: ['coord-locked'],
    };
  }

  const lock = matchCoordLock({
    name: input.name,
    localName: input.localName,
    city: input.city,
    category: input.category,
    sourceId: input.sourceId,
  });
  if (lock) {
    return {
      ok: true,
      latitude: Number(lock.lat.toFixed(7)),
      longitude: Number(lock.lng.toFixed(7)),
      precision: 'rooftop',
      verified: true,
      locked: true,
      reasons: ['manual-lock'],
    };
  }

  const verdict = validateCoordinates({
    lat: input.latitude,
    lng: input.longitude,
    city: input.city,
    country: input.country,
    address: input.address,
    precisionHint: input.precisionHint,
    bboxSpanMeters: input.bboxSpanMeters,
    osmType: input.osmType,
    resultType: input.resultType,
    confidence: input.confidence,
  });
  if (!verdict.ok) return null;
  return {
    ok: true,
    latitude: verdict.lat,
    longitude: verdict.lng,
    precision: verdict.precision,
    verified: verdict.verified,
    locked: false,
    reasons: verdict.reasons,
  };
}

export function isSamePin(lat1: number, lng1: number, lat2: number, lng2: number): boolean {
  return haversineMeters(lat1, lng1, lat2, lng2) < 4;
}

export function scrubStoredPlaces(places: StoredPlace[]): { kept: StoredPlace[]; removed: number; locked: number } {
  const kept: StoredPlace[] = [];
  let removed = 0;
  let locked = 0;
  for (const place of places) {
    const policy = applyCoordPolicy({
      name: place.name,
      localName: place.local_name,
      city: place.city,
      country: place.country,
      category: place.category,
      address: place.address,
      sourceId: place.source_id,
      latitude: place.latitude,
      longitude: place.longitude,
      existingLocked: Boolean(place.metadata?.coord_locked),
      existingLat: place.latitude,
      existingLng: place.longitude,
    });
    if (!policy) {
      removed += 1;
      continue;
    }
    if (policy.locked) locked += 1;
    kept.push({
      ...place,
      latitude: policy.latitude,
      longitude: policy.longitude,
      metadata: {
        ...place.metadata,
        coord_verified: policy.verified,
        coord_locked: policy.locked,
        coord_precision: policy.precision,
        coord_reasons: policy.reasons,
      },
    });
  }
  return { kept, removed, locked };
}
