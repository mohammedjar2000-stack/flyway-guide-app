import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { DirectoryListing } from '@/types';
import { lookupCity } from '@/lib/cityCoordinates';
import { DATASET_CACHE_KEY, DATASET_META_KEY, ISTANBUL_DATASET_VERSION } from '@/lib/datasetVersion';
import { categoryLabelAr, isPlaceCategory } from '@/lib/poiIdentity';
import { pinListing } from '@/lib/placePrecision';
import { gisPlaceToListing, type GisPlace } from '@/services/gisApi';

const PLACE_COLUMNS = [
  'id',
  'identity_key',
  'name',
  'local_name',
  'name_ar',
  'description',
  'country',
  'country_code',
  'city',
  'city_ar',
  'district',
  'district_ar',
  'province',
  'category',
  'subcategory',
  'latitude',
  'longitude',
  'address',
  'address_ar',
  'phone',
  'website',
  'opening_hours',
  'rating',
  'review_count',
  'image_url',
  'is_24_7',
  'is_emergency',
  'verified',
  'source',
  'source_id',
  'source_url',
  'last_updated',
  'created_at',
].join(',');

const PAGE_SIZE = 1000;
const HARD_CAP = 8000;

export interface PoiQuery {
  city?: string | null;
  country?: string | null;
  district?: string | null;
  category?: string | null;
  categories?: string[];
  q?: string | null;
  activeOnly?: boolean;
}

export interface NearbyPoiQuery extends PoiQuery {
  lat: number;
  lng: number;
  radiusMeters?: number;
  only24h?: boolean;
  onlyEmergency?: boolean;
  limit?: number;
}

export interface PoiRow {
  id: string;
  identity_key?: string | null;
  name: string;
  local_name?: string | null;
  name_ar?: string | null;
  description?: string | null;
  country?: string | null;
  country_code?: string | null;
  city?: string | null;
  city_ar?: string | null;
  district?: string | null;
  district_ar?: string | null;
  province?: string | null;
  category: string;
  subcategory?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  address_ar?: string | null;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  rating?: number | null;
  review_count?: number | null;
  image_url?: string | null;
  is_24_7?: boolean | null;
  is_emergency?: boolean | null;
  verified?: boolean | null;
  source?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  last_updated?: string | null;
  created_at?: string | null;
  distance_m?: number | null;
}

export function readCachedDatasetVersion(): number | null {
  try {
    const raw = window.localStorage.getItem(DATASET_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number };
    return Number.isFinite(parsed.version) ? Number(parsed.version) : null;
  } catch {
    return null;
  }
}

export function writeCachedDatasetVersion(version: number, count: number): void {
  try {
    window.localStorage.setItem(DATASET_CACHE_KEY, JSON.stringify({
      key: DATASET_META_KEY,
      version,
      count,
      at: Date.now(),
    }));
  } catch {
    /* quota */
  }
}

export async function fetchDatasetVersion(): Promise<number> {
  if (!isSupabaseConfigured()) return ISTANBUL_DATASET_VERSION;
  const rpc = await supabase.rpc('get_dataset_version', { p_key: DATASET_META_KEY });
  if (typeof rpc.data === 'number' && Number.isFinite(rpc.data)) return rpc.data;
  const table = await supabase.from('dataset_meta').select('version').eq('key', DATASET_META_KEY).maybeSingle();
  if (typeof table.data?.version === 'number') return table.data.version;
  return ISTANBUL_DATASET_VERSION;
}

function cityFilter(city?: string | null): { en?: string; ar?: string } {
  if (!city) return {};
  const hit = lookupCity(city);
  return { en: hit?.en || city, ar: hit?.name };
}

function rowToListing(row: PoiRow): DirectoryListing | null {
  if (!isPlaceCategory(row.category)) return null;
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const cityHit = lookupCity(row.city_ar || row.city || '') || lookupCity(row.country || '');
  const tags = [
    ...(row.is_24_7 ? ['24/7'] : []),
    ...(row.is_emergency ? ['طوارئ'] : []),
    ...(row.verified ? ['موقع موثّق'] : []),
    ...(row.district_ar ? [row.district_ar] : []),
  ];
  const listing: DirectoryListing = {
    id: row.identity_key || `sb-${row.id}`,
    category_key: row.category,
    category_label: categoryLabelAr(row.category),
    name: row.name_ar || row.local_name || row.name,
    description: row.description || row.name,
    country_name: cityHit?.country || row.country || '',
    city: cityHit?.name || row.city_ar || row.city || '',
    address: row.address_ar || row.address || '',
    image: row.image_url || '',
    images: row.image_url ? [row.image_url] : [],
    place_kind: row.subcategory === 'resort' || row.subcategory === 'hotel' || row.subcategory === 'cafe' || row.subcategory === 'restaurant'
      ? row.subcategory
      : undefined,
    rating: Number(row.rating) || 0,
    price_level: '',
    tags,
    proximity_note: row.district_ar || '',
    phone: row.phone || '',
    hours: row.opening_hours || '',
    is_featured: Boolean(row.verified),
    sort_order: 0,
    lat,
    lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: Number(row.review_count) || 0,
    created_at: row.created_at || row.last_updated || '',
    nav_query: `${lat.toFixed(7)},${lng.toFixed(7)}`,
    website: row.website || row.source_url || undefined,
  };
  return pinListing(listing);
}

export function poiRowsToListings(rows: PoiRow[]): DirectoryListing[] {
  const out: DirectoryListing[] = [];
  for (const row of rows) {
    const listing = rowToListing(row);
    if (listing) out.push(listing);
  }
  return out;
}

async function paginatePlaces(apply: (from: number, to: number) => unknown): Promise<PoiRow[]> {
  const rows: PoiRow[] = [];
  for (let from = 0; from < HARD_CAP; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE - 1, HARD_CAP - 1);
    const result = await apply(from, to) as { data: PoiRow[] | null; error: { message?: string } | null };
    const { data, error } = result;
    if (error) {
      if (from === 0) throw error;
      break;
    }
    const batch = (data ?? []) as PoiRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function fetchPoiCatalog(query: PoiQuery = {}): Promise<DirectoryListing[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const city = cityFilter(query.city);
    const rows = await paginatePlaces((from, to) => {
      let req = supabase.from('places').select(PLACE_COLUMNS);
      if (query.activeOnly !== false) req = req.eq('is_active', true);
      if (query.category) req = req.eq('category', query.category);
      if (query.country) {
        const code = lookupCity(query.country)?.countryCode;
        if (code) req = req.eq('country_code', code);
      } else if (city.en) {
        const code = lookupCity(city.en)?.countryCode;
        if (code) req = req.eq('country_code', code);
      }
      if (city.en) {
        req = req.ilike('city', city.en);
      }
      if (query.district) {
        req = req.or(`district.ilike.%${query.district}%,district_ar.ilike.%${query.district}%`);
      }
      if (query.q) req = req.or(`name.ilike.%${query.q}%,local_name.ilike.%${query.q}%,address.ilike.%${query.q}%`);
      return req.order('category').range(from, to);
    });
    let listings = poiRowsToListings(rows);
    if (query.categories?.length) {
      listings = listings.filter((item) => (
        query.categories!.includes(item.category_key)
        || (item.category_key === 'police' && query.categories!.includes('embassy'))
      ));
    }
    return listings;
  } catch {
    return [];
  }
}

export async function fetchPoiNearby(query: NearbyPoiQuery): Promise<DirectoryListing[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const city = cityFilter(query.city);
    const { data, error } = await supabase.rpc('places_nearby', {
      p_lat: query.lat,
      p_lng: query.lng,
      p_radius_m: query.radiusMeters ?? 5000,
      p_category: query.category ?? null,
      p_city: city.en ?? null,
      p_district: query.district ?? null,
      p_query: query.q ?? null,
      p_only_24_7: Boolean(query.only24h),
      p_only_emergency: Boolean(query.onlyEmergency),
      p_limit: Math.min(query.limit ?? 2000, 5000),
    });
    if (error) throw error;
    return poiRowsToListings((data ?? []) as PoiRow[]);
  } catch {
    const catalog = await fetchPoiCatalog(query);
    return catalog;
  }
}

export function gisFallbackToListings(places: GisPlace[]): DirectoryListing[] {
  const out: DirectoryListing[] = [];
  for (const place of places) {
    const row = gisPlaceToListing(place);
    if (row) out.push(row);
  }
  return out;
}
