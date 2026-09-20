import type { DirectoryListing } from '@/types';
import { TURKEY_HOTELS_DATA, TURKEY_HOTELS_DATASET_VERSION } from '@/data/turkeyHotelsData';
import { namedHotelPhotosForName } from '@/lib/hotelPhotos';
import { isAuthenticVenueName } from '@/lib/placeAuthenticity';
import { placeKindLabel } from '@/lib/placeImagery';
import { HOTEL_API_ID_PREFIX, HOTEL_API_SOURCE_TAG, appendCuratedTurkeyPins, isTrustedHotelApiListing } from '@/lib/turkeyCuratedGuard';
import { TURKEY_BBOX } from '@/lib/turkeyScope';
import { mergeIntoVault } from '@/lib/placeVault';

export { isTrustedHotelApiListing, HOTEL_API_SOURCE_TAG, HOTEL_API_ID_PREFIX };

export const HOTEL_CACHE_KEY = 'flyway.hotels.turkey.v2';
export const HOTEL_CACHE_VERSION = TURKEY_HOTELS_DATASET_VERSION;
const PLACES_UPDATED_EVENT = 'flyway:places-updated';

interface HotelCachePayload {
  version: number;
  savedAt: number;
  listings: DirectoryListing[];
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

function seedToListing(seed: (typeof TURKEY_HOTELS_DATA)[number]): DirectoryListing | null {
  if (!isAuthenticVenueName(seed.name, 'hotels') && !isAuthenticVenueName(seed.nameEn, 'hotels')) return null;
  if (!Number.isFinite(seed.lat) || !Number.isFinite(seed.lng) || !inTurkey(seed.lat, seed.lng)) return null;
  const images = uniqueUrls([
    ...(seed.images || []),
    ...namedHotelPhotosForName(`${seed.name} ${seed.nameEn}`),
  ]);
  const kind = seed.kind === 'resort' ? 'resort' : 'hotel';
  return {
    id: `${HOTEL_API_ID_PREFIX}${seed.id}`,
    category_key: 'hotels',
    category_label: placeKindLabel(kind),
    name: seed.name,
    description: seed.nameEn,
    country_name: 'تركيا',
    city: seed.cityAr || seed.city,
    address: seed.address || '',
    image: images[0] || '',
    images,
    place_kind: kind,
    rating: seed.rating > 0 ? seed.rating : 0,
    price_level: '',
    tags: [HOTEL_API_SOURCE_TAG, seed.city].filter(Boolean).slice(0, 8),
    proximity_note: '',
    phone: seed.phone || '',
    hours: '24/7',
    is_featured: seed.rating >= 4.7,
    sort_order: 0,
    lat: Number(seed.lat.toFixed(7)),
    lng: Number(seed.lng.toFixed(7)),
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: `${seed.lat.toFixed(7)},${seed.lng.toFixed(7)}`,
  };
}

let seededPins = false;

function localHotelListings(): DirectoryListing[] {
  const listings = TURKEY_HOTELS_DATA.map(seedToListing).filter((row): row is DirectoryListing => Boolean(row));
  if (!seededPins) {
    appendCuratedTurkeyPins(listings.map((row) => ({
      category_key: 'hotels',
      lat: row.lat,
      lng: row.lng,
    })));
    seededPins = true;
  }
  return listings;
}

function readHotelCache(): DirectoryListing[] {
  try {
    const raw = localStorage.getItem(HOTEL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HotelCachePayload;
    if (parsed.version !== HOTEL_CACHE_VERSION || !Array.isArray(parsed.listings)) return [];
    return parsed.listings.filter((row) => (
      row
      && row.category_key === 'hotels'
      && isTrustedHotelApiListing(row)
      && Number.isFinite(row.lat)
      && Number.isFinite(row.lng)
      && inTurkey(row.lat, row.lng)
    ));
  } catch {
    return [];
  }
}

function writeHotelCache(listings: DirectoryListing[]): void {
  if (typeof localStorage === 'undefined' || listings.length === 0) return;
  try {
    const payload: HotelCachePayload = {
      version: HOTEL_CACHE_VERSION,
      savedAt: Date.now(),
      listings,
    };
    localStorage.setItem(HOTEL_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekTurkeyHotelCache(): DirectoryListing[] {
  const cached = readHotelCache();
  if (cached.length > 0) return cached;
  const local = localHotelListings();
  writeHotelCache(local);
  return local;
}

export function isTurkeyHotelCacheFresh(): boolean {
  return peekTurkeyHotelCache().length > 0;
}

/** Instant local Turkey hotels/resorts catalog, persisted in localStorage. */
export async function fetchTurkeyHotels(): Promise<DirectoryListing[]> {
  const listings = peekTurkeyHotelCache();
  const local = localHotelListings();
  const merged = local.length >= listings.length ? local : listings;
  writeHotelCache(merged);
  mergeIntoVault(merged);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PLACES_UPDATED_EVENT, {
      detail: { category: 'hotels', count: merged.length },
    }));
  }
  return merged;
}
