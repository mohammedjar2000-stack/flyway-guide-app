import { env } from './env.js';
import { ISTANBUL_IMPORT_SPECS } from './categories.js';
import { fetchGeoapifyPlaces, type GeoapifyPlace } from './geoapify.js';
import { inferTurkeyCityEn, validateCoordinates } from './coordIntegrity.js';

export interface TurkeyHotelRecord {
  id: string;
  category_key: 'hotels';
  category_label: string;
  name: string;
  description: string;
  country_name: string;
  city: string;
  address: string;
  image: string;
  images: string[];
  place_kind: 'hotel' | 'resort';
  rating: number;
  price_level: string;
  tags: string[];
  proximity_note: string;
  phone: string;
  hours: string;
  is_featured: boolean;
  sort_order: number;
  lat: number;
  lng: number;
  metro_station_name: string;
  metro_walk_minutes: number;
  review_count: number;
  created_at: string;
  nav_query: string;
  website: string;
}

interface HotelHub {
  en: string;
  lat: number;
  lng: number;
  radius: number;
  limit: number;
  priority?: boolean;
}

const HUBS: HotelHub[] = [
  { en: 'Istanbul', lat: 41.0082, lng: 28.9784, radius: 22000, limit: 200, priority: true },
  { en: 'Istanbul', lat: 41.0369, lng: 28.985, radius: 14000, limit: 120, priority: true },
  { en: 'Istanbul', lat: 40.9881, lng: 29.025, radius: 16000, limit: 120, priority: true },
  { en: 'Antalya', lat: 36.8969, lng: 30.7133, radius: 22000, limit: 180, priority: true },
  { en: 'Antalya', lat: 36.855, lng: 30.736, radius: 12000, limit: 80, priority: true },
  { en: 'Alanya', lat: 36.5444, lng: 31.9954, radius: 16000, limit: 100, priority: true },
  { en: 'Trabzon', lat: 41.0027, lng: 39.7168, radius: 16000, limit: 100, priority: true },
  { en: 'Trabzon', lat: 40.6186, lng: 40.2947, radius: 8000, limit: 40, priority: true },
  { en: 'Nevsehir', lat: 38.6431, lng: 34.8289, radius: 18000, limit: 120, priority: true },
  { en: 'Ankara', lat: 39.9334, lng: 32.8597, radius: 18000, limit: 120, priority: true },
  { en: 'Izmir', lat: 38.4237, lng: 27.1428, radius: 18000, limit: 120, priority: true },
  { en: 'Bodrum', lat: 37.0344, lng: 27.4305, radius: 16000, limit: 100, priority: true },
  { en: 'Fethiye', lat: 36.6592, lng: 29.127, radius: 14000, limit: 80 },
  { en: 'Mugla', lat: 36.8549, lng: 28.2705, radius: 12000, limit: 70 },
  { en: 'Bursa', lat: 40.1885, lng: 29.061, radius: 14000, limit: 80 },
  { en: 'Antalya', lat: 36.8625, lng: 31.0556, radius: 10000, limit: 70 },
  { en: 'Antalya', lat: 36.7667, lng: 31.3889, radius: 10000, limit: 70 },
  { en: 'Antalya', lat: 36.5978, lng: 30.5606, radius: 12000, limit: 70 },
  { en: 'Gaziantep', lat: 37.0662, lng: 37.3781, radius: 12000, limit: 60 },
  { en: 'Mersin', lat: 36.8121, lng: 34.6415, radius: 12000, limit: 60 },
];

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const TURKEY_BBOX = { south: 35.82, west: 25.66, north: 42.32, east: 44.82 };
const SOURCE_TAG = 'live-hotel-api';

interface OsmElement {
  id: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function inTurkey(lat: number, lng: number): boolean {
  return lat >= TURKEY_BBOX.south && lat <= TURKEY_BBOX.north
    && lng >= TURKEY_BBOX.west && lng <= TURKEY_BBOX.east;
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const clean = String(url || '').trim();
    if (!clean || !/^https?:\/\//i.test(clean) || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

function wikiFile(file: string): string {
  const name = file.replace(/^File:/i, '').split(';')[0].trim();
  if (!name || /^Category:/i.test(name)) return '';
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1600`;
}

function osmMedia(tags: Record<string, string>): string[] {
  const urls: string[] = [];
  for (const key of ['image', 'image:0', 'contact:image']) {
    const value = String(tags[key] || '').trim();
    if (/^https?:\/\//i.test(value)) urls.push(value.split(/\s+/)[0]);
  }
  const commons = String(tags.wikimedia_commons || tags['wiki:commons'] || '').trim();
  if (commons) {
    const file = wikiFile(commons);
    if (file) urls.push(file);
  }
  return uniqueUrls(urls);
}

function authenticName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  return !/^(hotel|unnamed|toilet|wc|test|dummy|placeholder|example|sample)$/i.test(trimmed);
}

function toRecord(opts: {
  id: string;
  name: string;
  description?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  lat: number;
  lng: number;
  rating?: number;
  images?: string[];
  isResort?: boolean;
  extraTags?: string[];
}): TurkeyHotelRecord | null {
  if (!authenticName(opts.name)) return null;
  const verdict = validateCoordinates({
    lat: opts.lat,
    lng: opts.lng,
    city: opts.city,
    country: 'Turkey',
    address: opts.address,
    precisionHint: 'venue',
  });
  if (!verdict.ok || !inTurkey(verdict.lat, verdict.lng)) return null;
  const city = inferTurkeyCityEn(verdict.lat, verdict.lng, opts.city);
  const images = uniqueUrls(opts.images || []);
  const isResort = Boolean(opts.isResort);
  return {
    id: opts.id.startsWith('hotel-api-') ? opts.id : `hotel-api-${opts.id}`,
    category_key: 'hotels',
    category_label: isResort ? 'منتجع' : 'فندق',
    name: opts.name,
    description: opts.description || '',
    country_name: 'تركيا',
    city,
    address: opts.address || '',
    image: images[0] || '',
    images,
    place_kind: isResort ? 'resort' : 'hotel',
    rating: opts.rating && opts.rating > 0 ? opts.rating : 0,
    price_level: '',
    tags: Array.from(new Set([SOURCE_TAG, ...(opts.extraTags || [])])).slice(0, 8),
    proximity_note: '',
    phone: opts.phone || '',
    hours: opts.hours || '',
    is_featured: false,
    sort_order: 0,
    lat: verdict.lat,
    lng: verdict.lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: `${verdict.lat.toFixed(7)},${verdict.lng.toFixed(7)}`,
    website: opts.website || '',
  };
}

async function postOverpass(query: string): Promise<OsmElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(24_000),
      });
      if (!res.ok) continue;
      const json = await res.json() as { elements?: OsmElement[] };
      return Array.isArray(json.elements) ? json.elements : [];
    } catch {
      /* try next mirror */
    }
  }
  return [];
}

function osmToRecord(el: OsmElement): TurkeyHotelRecord | null {
  if (el.type === 'relation') return null;
  const tags = el.tags || {};
  const tourism = tags.tourism || '';
  if (tourism !== 'hotel' && tourism !== 'resort' && tourism !== 'guest_house') return null;
  const lat = Number(el.lat ?? el.center?.lat);
  const lng = Number(el.lon ?? el.center?.lon);
  const name = String(tags['name:ar'] || tags.name || tags['name:en'] || tags.brand || '').trim();
  const nameEn = String(tags['name:en'] || tags.name || '').trim();
  return toRecord({
    id: `osm-${el.type || 'n'}-${el.id}`,
    name,
    description: nameEn && nameEn !== name ? nameEn : (tags.description || ''),
    city: tags['addr:city'] || '',
    address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(' '),
    phone: tags.phone || tags['contact:phone'] || '',
    website: tags.website || tags['contact:website'] || '',
    hours: tags.opening_hours || '',
    lat,
    lng,
    rating: Number(tags.stars) || 0,
    images: osmMedia(tags),
    isResort: tourism === 'resort',
  });
}

async function fetchOverpassHub(hub: HotelHub): Promise<TurkeyHotelRecord[]> {
  const around = `(around:${Math.round(hub.radius)},${hub.lat.toFixed(5)},${hub.lng.toFixed(5)})`;
  const query = `[out:json][timeout:28];(`
    + `node["tourism"="hotel"]${around};way["tourism"="hotel"]${around};`
    + `node["tourism"="resort"]${around};way["tourism"="resort"]${around};`
    + `);out center ${hub.limit};`;
  const elements = await postOverpass(query);
  return elements.map(osmToRecord).filter((row): row is TurkeyHotelRecord => Boolean(row));
}

function geoapifyToRecord(place: GeoapifyPlace): TurkeyHotelRecord | null {
  const raw = place.raw || {};
  const tourism = String(raw.tourism || '');
  return toRecord({
    id: `geo-${place.sourceId}`,
    name: place.localName || place.name,
    description: place.name !== place.localName ? place.name : '',
    city: place.city || '',
    address: place.address || '',
    phone: place.phone || '',
    website: place.website || '',
    hours: place.openingHours || '',
    lat: place.latitude,
    lng: place.longitude,
    images: uniqueUrls([place.imageUrl || '', ...place.images]),
    isResort: tourism === 'resort' || place.categories.some((cat) => /resort/i.test(cat)),
  });
}

async function fetchGeoapifyHub(hub: HotelHub): Promise<TurkeyHotelRecord[]> {
  if (!env.geoapifyApiKey) return [];
  const spec = ISTANBUL_IMPORT_SPECS.find((item) => item.category === 'hotels');
  if (!spec) return [];
  try {
    const places = await fetchGeoapifyPlaces(spec, {
      lon: hub.lng,
      lat: hub.lat,
      radiusMeters: hub.radius,
      limit: Math.min(hub.limit, 80),
    });
    return places.map(geoapifyToRecord).filter((row): row is TurkeyHotelRecord => Boolean(row));
  } catch {
    return [];
  }
}

interface GoogleNearbyResult {
  place_id?: string;
  name?: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat?: number; lng?: number } };
  photos?: Array<{ photo_reference?: string }>;
  types?: string[];
}

function googlePhotoUrl(ref: string): string {
  return `/api/hotels/photo?ref=${encodeURIComponent(ref)}`;
}

async function fetchGoogleHub(hub: HotelHub): Promise<TurkeyHotelRecord[]> {
  const key = env.googlePlacesApiKey;
  if (!key) return [];
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${hub.lat},${hub.lng}`);
    url.searchParams.set('radius', String(Math.min(hub.radius, 50000)));
    url.searchParams.set('type', 'lodging');
    url.searchParams.set('key', key);
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];
    const json = await res.json() as { results?: GoogleNearbyResult[]; status?: string };
    if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') return [];
    const out: TurkeyHotelRecord[] = [];
    for (const place of json.results || []) {
      const lat = Number(place.geometry?.location?.lat);
      const lng = Number(place.geometry?.location?.lng);
      const photos = (place.photos || [])
        .map((photo) => photo.photo_reference)
        .filter((ref): ref is string => Boolean(ref))
        .slice(0, 3)
        .map(googlePhotoUrl);
      const row = toRecord({
        id: `ggl-${place.place_id || `${lat}-${lng}`}`,
        name: String(place.name || '').trim(),
        description: place.vicinity || '',
        city: hub.en,
        address: place.vicinity || '',
        lat,
        lng,
        rating: Number(place.rating) || 0,
        images: photos,
        isResort: (place.types || []).includes('resort'),
      });
      if (row) {
        row.review_count = Number(place.user_ratings_total) || 0;
        out.push(row);
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function dedupe(rows: TurkeyHotelRecord[]): TurkeyHotelRecord[] {
  const seen = new Set<string>();
  const out: TurkeyHotelRecord[] = [];
  for (const row of rows) {
    const key = `${row.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')}:${row.lat.toFixed(4)}:${row.lng.toFixed(4)}`;
    if (seen.has(key) || seen.has(row.id)) continue;
    seen.add(key);
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export async function fetchTurkeyHotelCatalog(opts?: { priorityOnly?: boolean }): Promise<{
  hotels: TurkeyHotelRecord[];
  sources: string[];
}> {
  const hubs = opts?.priorityOnly ? HUBS.filter((hub) => hub.priority) : HUBS;
  const sources: string[] = ['overpass'];
  if (env.geoapifyApiKey) sources.push('geoapify');
  if (env.googlePlacesApiKey) sources.push('google-places');

  const batches = await mapPool(hubs, 3, async (hub) => {
    const [osm, geo, google] = await Promise.all([
      fetchOverpassHub(hub),
      fetchGeoapifyHub(hub),
      fetchGoogleHub(hub),
    ]);
    return [...osm, ...geo, ...google];
  });

  return { hotels: dedupe(batches.flat()), sources };
}

export async function proxyGoogleHotelPhoto(ref: string): Promise<{ contentType: string; body: ArrayBuffer } | null> {
  const key = env.googlePlacesApiKey;
  if (!key || !ref) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '1600');
  url.searchParams.set('photo_reference', ref);
  url.searchParams.set('key', key);
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return null;
  return {
    contentType: res.headers.get('content-type') || 'image/jpeg',
    body: await res.arrayBuffer(),
  };
}
