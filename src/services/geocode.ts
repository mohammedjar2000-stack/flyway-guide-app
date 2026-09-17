import { bboxAround, fitCityBbox, isValidCoord } from '@/lib/cityCoordinates';
import type { MapBounds } from '@/lib/geo';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface GeoHit {
  displayName: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  bbox: MapBounds;
}

interface NominatimItem {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  boundingbox?: string[];
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
}

interface CacheEntry {
  at: number;
  hits: GeoHit[];
}

const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): GeoHit[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.hits;
}

function cacheSet(key: string, hits: GeoHit[]) {
  if (cache.size > 120) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { at: Date.now(), hits });
}

function parseNominatimBbox(raw?: string[], lat?: number, lng?: number): MapBounds | null {
  if (!raw || raw.length < 4) return null;
  const south = Number(raw[0]);
  const north = Number(raw[1]);
  const west = Number(raw[2]);
  const east = Number(raw[3]);
  if (![south, north, west, east].every(Number.isFinite)) return null;
  if (south >= north) return null;
  return fitCityBbox({ south, west, north, east }, lat, lng);
}

function toHit(item: NominatimItem): GeoHit | null {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!isValidCoord(lat, lng)) return null;
  const address = item.address;
  const name = item.name || item.display_name?.split(',')[0]?.trim() || '';
  if (!name) return null;
  const bbox = parseNominatimBbox(item.boundingbox, lat, lng) ?? bboxAround(lat, lng, 18);
  return {
    displayName: item.display_name || name,
    name,
    lat,
    lng,
    city: address?.city || address?.town || address?.village || address?.municipality || name,
    country: address?.country,
    bbox,
  };
}

async function nominatimGet(path: string): Promise<unknown> {
  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('geocode failed');
  return res.json();
}

export async function geocodePlace(
  query: string,
  options?: { country?: string; feature?: 'city' | 'country' | 'settlement' },
): Promise<GeoHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = `${options?.feature ?? 'q'}|${options?.country ?? ''}|${q.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    'accept-language': 'ar,en',
    q: options?.country ? `${q}, ${options.country}` : q,
  });
  if (options?.feature === 'city' || options?.feature === 'settlement') {
    params.set('featureType', 'settlement');
  }
  if (options?.feature === 'country') {
    params.set('featureType', 'country');
  }

  try {
    const data = await nominatimGet(`/search?${params.toString()}`);
    const hits = (Array.isArray(data) ? data : [])
      .map((item) => toHit(item as NominatimItem))
      .filter((hit): hit is GeoHit => Boolean(hit));
    cacheSet(key, hits);
    return hits;
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoHit | null> {
  if (!isValidCoord(lat, lng)) return null;
  const key = `rev|${lat.toFixed(4)}|${lng.toFixed(4)}`;
  const cached = cacheGet(key);
  if (cached?.[0]) return cached[0];

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '14',
    addressdetails: '1',
    'accept-language': 'ar,en',
  });
  try {
    const data = (await nominatimGet(`/reverse?${params.toString()}`)) as NominatimItem;
    const hit = toHit({ ...data, lat: String(lat), lon: String(lng) });
    if (hit) cacheSet(key, [hit]);
    return hit;
  } catch {
    return null;
  }
}
