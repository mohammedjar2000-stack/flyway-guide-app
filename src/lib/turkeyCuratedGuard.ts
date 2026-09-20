import { haversineMeters } from '@/lib/coordIntegrity';
import { TURKEY_BBOX } from '@/lib/turkeyScope';
import { isCuratedTurkeyFuelPin } from '@/lib/turkeyFuelStations';

export const HOTEL_API_SOURCE_TAG = 'live-hotel-api';
export const HOTEL_API_ID_PREFIX = 'hotel-api-';

export function isTrustedHotelApiListing(item: {
  id?: string;
  category_key?: string;
  tags?: string[] | null;
}): boolean {
  if (item.category_key && item.category_key !== 'hotels') return false;
  if (typeof item.id === 'string' && item.id.startsWith(HOTEL_API_ID_PREFIX)) return true;
  return Array.isArray(item.tags) && item.tags.includes(HOTEL_API_SOURCE_TAG);
}

export function listingPassesTurkeyPinGuard(item: {
  id?: string;
  lat: number;
  lng: number;
  category_key: string;
  name?: string;
  description?: string;
  tags?: string[] | null;
}): boolean {
  if (isTrustedHotelApiListing(item)) return true;
  return isCuratedTurkeyPin(
    item.lat,
    item.lng,
    item.category_key,
    `${item.name || ''} ${item.description || ''}`,
  );
}

/** Bump with hub catalog so vault/query caches drop contaminated rows. */
export const CURATED_CATALOG_VERSION = 2;

const MATCH_METERS = 40;

export interface CuratedPin {
  category_key: string;
  lat: number;
  lng: number;
}

const pins: CuratedPin[] = [];
let ready = false;

export function isTurkeyCatalogCoordinate(lat: number, lng: number): boolean {
  return lat >= TURKEY_BBOX.south && lat <= TURKEY_BBOX.north
    && lng >= TURKEY_BBOX.west && lng <= TURKEY_BBOX.east;
}

export function registerCuratedTurkeyPins(rows: CuratedPin[]): void {
  pins.length = 0;
  appendCuratedTurkeyPins(rows);
}

export function appendCuratedTurkeyPins(rows: CuratedPin[]): void {
  for (const row of rows) {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng) || !row.category_key) continue;
    pins.push({
      category_key: row.category_key,
      lat: Number(row.lat),
      lng: Number(row.lng),
    });
  }
  ready = true;
}

export function isCuratedTurkeyPin(
  lat: number,
  lng: number,
  categoryKey: string,
  nameHay = '',
): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (!isTurkeyCatalogCoordinate(lat, lng)) return true;
  if (categoryKey === 'fuel') return isCuratedTurkeyFuelPin(lat, lng, nameHay);
  if (!ready) return false;
  const key = categoryKey === 'embassy' ? 'embassy' : categoryKey;
  return pins.some((pin) => {
    const same = pin.category_key === key
      || (key === 'embassy' && pin.category_key === 'police')
      || (key === 'police' && pin.category_key === 'embassy');
    if (!same) return false;
    return haversineMeters(lat, lng, pin.lat, pin.lng) <= MATCH_METERS;
  });
}
