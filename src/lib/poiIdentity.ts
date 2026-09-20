import { lookupCity, lookupDistrict, normalizeName } from '@/lib/cityCoordinates';
import { haversineMeters } from '@/lib/coordIntegrity';
import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';

export const PLACE_CATEGORIES = [
  'hotels',
  'restaurants',
  'hospitals',
  'pharmacies',
  'markets',
  'attractions',
  'exchange',
  'mosques',
  'transport',
  'embassy',
  'police',
  'telecom',
  'nightlife',
  'salons',
  'fuel',
  'bakeries',
  'airports',
] as const;

export type PlaceCategoryKey = (typeof PLACE_CATEGORIES)[number];

export const ISTANBUL_BBOX = {
  south: 40.80,
  west: 28.15,
  north: 41.40,
  east: 29.75,
};

const DEDUPE_METERS: Record<string, number> = {
  hotels: 12,
  restaurants: 25,
  hospitals: 40,
  pharmacies: 25,
  markets: 40,
  attractions: 40,
  exchange: 18,
  mosques: 40,
  transport: 25,
  embassy: 30,
  police: 30,
  telecom: 18,
  nightlife: 30,
  salons: 25,
  fuel: 18,
  bakeries: 18,
  airports: 120,
};

export function isPlaceCategory(value: string): value is PlaceCategoryKey {
  return (PLACE_CATEGORIES as readonly string[]).includes(value);
}

export function normalizeIdentityName(value: string): string {
  return normalizeName(value || '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function makeIdentityKey(input: {
  category: string;
  lat: number;
  lng: number;
  name: string;
  sourceId?: string | null;
}): string {
  if (input.sourceId && input.sourceId.trim()) {
    return `flyway:${input.category}:${normalizeIdentityName(input.sourceId)}`;
  }
  const lat = Number(input.lat).toFixed(5);
  const lng = Number(input.lng).toFixed(5);
  const name = normalizeIdentityName(input.name) || 'place';
  return `flyway:${input.category}:${lat}:${lng}:${name}`;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isInIstanbulBbox(lat: number, lng: number): boolean {
  return lat >= ISTANBUL_BBOX.south && lat <= ISTANBUL_BBOX.north
    && lng >= ISTANBUL_BBOX.west && lng <= ISTANBUL_BBOX.east;
}

export function inferDistrictFromAddress(address: string, cityEn?: string | null): { en: string; ar: string } | null {
  if (!address.trim()) return null;
  const hit = lookupDistrict(address, cityEn || 'Istanbul', cityEn ? undefined : 'تركيا');
  if (!hit) return null;
  return { en: hit.district.en, ar: hit.district.name };
}

export function isTwentyFourSeven(hours?: string | null, tags?: string[] | null): boolean {
  const hay = `${hours || ''} ${(tags || []).join(' ')}`;
  return /24\s*\/\s*7|00:00\s*-\s*24:00|open 24/i.test(hay);
}

export function isEmergencyFacility(category: string, name: string, hours?: string | null): boolean {
  if (category === 'police' || category === 'embassy') return true;
  if (category !== 'hospitals') return false;
  return /طوارئ|\bacil\b|\bemergency\b/i.test(`${name} ${hours || ''}`);
}

export function categoryLabelAr(key: string): string {
  if (key === 'police') return 'شرطة';
  return CATEGORIES.find((item) => item.key === key)?.shortLabel || key;
}

export function listingCountryCode(item: Pick<DirectoryListing, 'country_name'>): string {
  const country = lookupCity(item.country_name);
  return country?.countryCode || (item.country_name === 'تركيا' ? 'TR' : '');
}

export function listingCityEn(item: Pick<DirectoryListing, 'city' | 'country_name'>): string {
  return lookupCity(item.city)?.en || lookupCity(item.country_name)?.en || item.city || '';
}

export function dedupeMetersFor(category: string): number {
  return DEDUPE_METERS[category] || 40;
}

export function isNearDuplicatePoi(
  a: { category: string; lat: number; lng: number; name: string },
  b: { category: string; lat: number; lng: number; name: string },
): boolean {
  if (a.category !== b.category) return false;
  const meters = haversineMeters(a.lat, a.lng, b.lat, b.lng);
  if (meters <= dedupeMetersFor(a.category)) return true;
  return meters <= 80 && normalizeIdentityName(a.name) === normalizeIdentityName(b.name);
}
