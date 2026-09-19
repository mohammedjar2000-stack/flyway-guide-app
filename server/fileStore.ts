import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { PlaceCategory } from './categories.js';

const STORE_PATH = resolve(process.cwd(), 'server', 'data', 'places.json');
const DEDUP_METERS = 45;
const HOTEL_DEDUP_METERS = 18;
const TELECOM_DEDUP_METERS = 18;
const EXCHANGE_DEDUP_METERS = 18;

function categoryDedupMeters(category: string): number {
  if (category === 'hotels') return HOTEL_DEDUP_METERS;
  if (category === 'telecom') return TELECOM_DEDUP_METERS;
  if (category === 'exchange' || category === 'transport' || category === 'fuel' || category === 'bakeries') return EXCHANGE_DEDUP_METERS;
  return DEDUP_METERS;
}

export interface StoredPlace {
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

interface FileDb {
  places: StoredPlace[];
}

let cache: FileDb | null = null;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function load(): FileDb {
  if (cache) return cache;
  try {
    const raw = readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as FileDb;
    cache = { places: Array.isArray(parsed.places) ? parsed.places : [] };
  } catch {
    cache = { places: [] };
  }
  return cache;
}

function save(db: FileDb) {
  cache = db;
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(db), 'utf8');
}

export function filePlaceCount(): number {
  return load().places.length;
}

export function fileAllPlaces(): StoredPlace[] {
  return load().places.slice();
}

export function fileReplacePlaces(places: StoredPlace[]) {
  save({ places });
}

export function fileUpsert(input: {
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
}): 'inserted' | 'updated' | 'skipped' {
  const db = load();
  const now = new Date().toISOString();
  const existing = db.places.find((row) => row.source === input.source && row.source_id === input.sourceId);
  if (existing) {
    const locked = Boolean(existing.metadata?.coord_locked);
    existing.name = input.name;
    existing.local_name = input.localName ?? existing.local_name;
    existing.country = input.country;
    existing.country_code = input.countryCode.slice(0, 2);
    existing.city = input.city;
    existing.category = input.category;
    existing.subcategory = input.subcategory ?? existing.subcategory;
    if (!locked) {
      existing.latitude = input.latitude;
      existing.longitude = input.longitude;
    }
    existing.address = input.address ?? existing.address;
    existing.phone = input.phone ?? existing.phone;
    existing.website = input.website ?? existing.website;
    existing.opening_hours = input.openingHours ?? existing.opening_hours;
    existing.last_updated = now;
    existing.metadata = {
      ...existing.metadata,
      ...(input.metadata ?? {}),
      coord_locked: locked || Boolean(input.metadata?.coord_locked),
    };
    save(db);
    return 'updated';
  }
  const nearby = db.places.some((row) => (
    row.category === input.category
    && haversineM(row.latitude, row.longitude, input.latitude, input.longitude)
      < categoryDedupMeters(input.category)
  ));
  if (nearby) return 'skipped';

  db.places.push({
    id: randomUUID(),
    name: input.name,
    local_name: input.localName ?? null,
    country: input.country,
    country_code: input.countryCode.slice(0, 2),
    city: input.city,
    category: input.category,
    subcategory: input.subcategory ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address ?? null,
    phone: input.phone ?? null,
    website: input.website ?? null,
    opening_hours: input.openingHours ?? null,
    source: input.source,
    source_id: input.sourceId,
    last_updated: now,
    metadata: input.metadata ?? {},
  });
  save(db);
  return 'inserted';
}

export function fileFindNearby(opts: {
  lat: number;
  lng: number;
  radiusMeters: number;
  category?: PlaceCategory;
  city?: string;
  limit: number;
}): StoredPlace[] {
  const rows = load().places
    .map((row) => ({
      ...row,
      distance_m: haversineM(opts.lat, opts.lng, row.latitude, row.longitude),
    }))
    .filter((row) => {
      if (row.distance_m! > opts.radiusMeters) return false;
      if (opts.category && row.category !== opts.category) return false;
      if (opts.city && !row.city.toLowerCase().includes(opts.city.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
  return rows.slice(0, opts.limit);
}

export function fileListPlaces(opts: {
  category?: PlaceCategory;
  city?: string;
  limit: number;
}): StoredPlace[] {
  return load().places
    .filter((row) => {
      if (opts.category && row.category !== opts.category) return false;
      if (opts.city && !row.city.toLowerCase().includes(opts.city.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.last_updated.localeCompare(a.last_updated))
    .slice(0, opts.limit);
}

export function fileCountByCategory(opts?: { city?: string }): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of load().places) {
    if (opts?.city && !row.city.toLowerCase().includes(opts.city.toLowerCase())) continue;
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  return counts;
}
