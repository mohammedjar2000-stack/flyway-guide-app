/**
 * Browser helper for the Flyway GIS API (Vite proxies /api → 127.0.0.1:8787).
 * The Geoapify key never leaves the server.
 */
import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';
import { lookupCity } from '@/lib/cityCoordinates';
import { inferTurkeyCityEn } from '@/lib/coordIntegrity';
import { placeGallery } from '@/lib/placeImagery';
import { pinListing } from '@/lib/placePrecision';
import { isMallPlace, shoppingLabel } from '@/lib/shoppingKind';
import { financialKind, financialLabel } from '@/lib/financialKind';

const GIS_BASE = '/api/places';
export const PLACES_UPDATED_EVENT = 'flyway:places-updated';

export interface GisPlace {
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

export interface HotelNearMetro extends GisPlace {
  metro_id: string | null;
  metro_name: string | null;
  metro_local_name: string | null;
  metro_latitude: number | null;
  metro_longitude: number | null;
  metro_distance_m: number | null;
  metro_walk_minutes: number | null;
}

export interface CategoryCountsResponse {
  database: boolean;
  counts: Record<string, number>;
  total: number;
}

function notifyPlacesUpdated(counts?: Record<string, number>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PLACES_UPDATED_EVENT, { detail: { counts } }));
}

async function getJson<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T | null> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  try {
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

async function postJson<T>(path: string, body: unknown, params: Record<string, string | number | undefined> = {}): Promise<T | null> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export function gisPlaceToListing(place: GisPlace): DirectoryListing | null {
  const cat = CATEGORIES.find((item) => item.key === place.category);
  const inferredEn = inferTurkeyCityEn(place.latitude, place.longitude, place.city);
  const knownCity = lookupCity(inferredEn) || lookupCity(place.city) || lookupCity(place.country);
  const mall = place.category === 'markets' && isMallPlace({
    category_key: place.category,
    subcategory: place.subcategory,
    name: place.name,
    description: place.local_name || place.name,
  });
  const finance = place.category === 'exchange'
    ? financialKind({
      subcategory: place.subcategory,
      name: place.name,
      description: place.local_name || place.name,
    })
    : null;
  const storedImages = [
    ...(Array.isArray(place.metadata?.images) ? place.metadata.images.filter((url): url is string => typeof url === 'string') : []),
    typeof place.metadata?.image_url === 'string' ? place.metadata.image_url : '',
  ].filter((url) => /^https?:\/\//i.test(url));
  const listing: DirectoryListing = {
    id: `gis-${place.id}`,
    category_key: place.category,
    category_label: place.category === 'markets'
      ? shoppingLabel({
        category_key: place.category,
        subcategory: place.subcategory,
        category_label: mall ? 'مركز تسوق' : cat?.shortLabel,
        name: place.name,
        description: place.local_name || '',
      })
      : finance
        ? financialLabel(finance)
        : (cat?.shortLabel || place.subcategory || place.category),
    name: place.local_name || place.name,
    description: place.local_name && place.local_name !== place.name ? place.name : place.name,
    country_name: knownCity?.country || place.country,
    city: knownCity?.name || place.city,
    address: place.address || '',
    image: storedImages[0] || '',
    images: storedImages,
    place_kind: place.category === 'hotels'
      ? (place.subcategory === 'resort' ? 'resort' : 'hotel')
      : undefined,
    rating: 0,
    price_level: '',
    tags: [
      ...(place.opening_hours === '24/7' ? ['24/7'] : []),
      ...(place.category === 'markets' ? [mall ? 'مول' : 'سوق'] : []),
      ...(place.category === 'telecom' ? ['شريحة SIM', 'eSIM'] : []),
      ...(finance ? [financialLabel(finance)] : []),
    ],
    proximity_note: '',
    phone: place.phone || '',
    hours: place.opening_hours || '',
    is_featured: place.category === 'embassy',
    sort_order: 0,
    lat: place.latitude,
    lng: place.longitude,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: place.last_updated || '',
    nav_query: `${place.latitude.toFixed(7)},${place.longitude.toFixed(7)}`,
    website: place.website || undefined,
  };
  listing.images = placeGallery(listing);
  listing.image = listing.images[0] || '';
  return pinListing(listing);
}

export function gisPlacesToListings(places: GisPlace[]): DirectoryListing[] {
  const out: DirectoryListing[] = [];
  for (const place of places) {
    const row = gisPlaceToListing(place);
    if (row) out.push(row);
  }
  return out;
}

export async function fetchNearbyPlaces(opts: {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  city?: string;
  limit?: number;
}): Promise<GisPlace[]> {
  const data = await getJson<{ places?: GisPlace[] }>(`${GIS_BASE}/nearby`, {
    lat: opts.lat,
    lng: opts.lng,
    radius: opts.radius,
    category: opts.category,
    city: opts.city,
    limit: opts.limit,
  });
  return data?.places ?? [];
}

export async function fetchPlaceCatalog(opts: {
  category?: string;
  city?: string;
  limit?: number;
} = {}): Promise<GisPlace[]> {
  const data = await getJson<{ places?: GisPlace[] }>(`${GIS_BASE}/catalog`, {
    category: opts.category,
    city: opts.city,
    limit: opts.limit,
  });
  return data?.places ?? [];
}

export async function fetchCategoryCounts(city?: string): Promise<CategoryCountsResponse> {
  const data = await getJson<CategoryCountsResponse>(`${GIS_BASE}/counts`, { city });
  return data ?? { database: false, counts: {}, total: 0 };
}

export async function syncNearbyCategory(opts: {
  lat: number;
  lng: number;
  category: string;
  city?: string;
  country?: string;
  limit?: number;
  radius?: number;
}): Promise<Record<string, number> | null> {
  const data = await postJson<{ counts?: Record<string, number> }>(`${GIS_BASE}/sync`, {
    lat: opts.lat,
    lng: opts.lng,
    category: opts.category,
    city: opts.city,
    country: opts.country,
    limit: opts.limit,
    radius: opts.radius,
  }, {
    lat: opts.lat,
    lng: opts.lng,
    category: opts.category,
    city: opts.city,
    limit: opts.limit,
    radius: opts.radius,
  });
  if (data?.counts) notifyPlacesUpdated(data.counts);
  return data?.counts ?? null;
}

export async function syncOsmCategory(opts: {
  lat: number;
  lng: number;
  category: string;
  city?: string;
  country?: string;
  limit?: number;
  radius?: number;
}): Promise<Record<string, number> | null> {
  const data = await postJson<{ counts?: Record<string, number> }>(`${GIS_BASE}/sync-osm`, {
    lat: opts.lat,
    lng: opts.lng,
    category: opts.category,
    city: opts.city,
    country: opts.country,
    limit: opts.limit,
    radius: opts.radius,
  }, {
    lat: opts.lat,
    lng: opts.lng,
    category: opts.category,
    city: opts.city,
    limit: opts.limit,
    radius: opts.radius,
  });
  if (data?.counts) notifyPlacesUpdated(data.counts);
  return data?.counts ?? null;
}

export async function ingestMappedPlaces(places: DirectoryListing[]): Promise<Record<string, number> | null> {
  if (places.length === 0) return null;
  const payload = places.map((place) => {
    const inferredEn = inferTurkeyCityEn(place.lat, place.lng, place.city);
    const known = lookupCity(inferredEn) || lookupCity(place.city) || lookupCity(place.country_name);
    const gallery = place.category_key === 'transport' ? placeGallery(place) : (place.images || []);
    return {
      id: place.id,
      sourceId: place.id,
      name: place.name,
      localName: place.description || null,
      category: place.category_key,
      lat: place.lat,
      lng: place.lng,
      address: place.address,
      phone: place.phone,
      hours: place.hours,
      city: known?.en || inferredEn || place.city || '',
      country: known?.countryEn || place.country_name || 'Turkey',
      countryCode: known?.countryCode || 'TR',
      source: place.id.startsWith('hotel-api-')
        ? 'HotelAPI'
        : place.id.startsWith('osm-') || place.id.startsWith('gis-') ? 'OpenStreetMap' : 'Flyway',
      image: gallery[0] || place.image,
      images: gallery.length ? gallery : place.images,
      website: place.website,
    };
  });
  let lastCounts: Record<string, number> | null = null;
  for (let i = 0; i < payload.length; i += 150) {
    const data = await postJson<{ counts?: Record<string, number> }>(`${GIS_BASE}/ingest`, {
      places: payload.slice(i, i + 150),
    });
    if (data?.counts) lastCounts = data.counts;
  }
  if (lastCounts) notifyPlacesUpdated(lastCounts);
  return lastCounts;
}

export async function fetchHotelsNearMetro(opts: {
  lat?: number;
  lng?: number;
  radius?: number;
  city?: string;
  limit?: number;
} = {}): Promise<HotelNearMetro[]> {
  const data = await getJson<{ hotels?: HotelNearMetro[] }>(`${GIS_BASE}/hotels-near-metro`, {
    lat: opts.lat,
    lng: opts.lng,
    radius: opts.radius,
    city: opts.city ?? '',
    limit: opts.limit,
  });
  return data?.hotels ?? [];
}
