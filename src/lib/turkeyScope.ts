import type { DirectoryListing } from '@/types';
import {
  lookupCity,
  normalizeName,
  type AppLocation,
  type CityCoordinate,
} from '@/lib/cityCoordinates';
import { cityIntegrityKey, coordsInCityLand, inferCityLandKey } from '@/lib/coordIntegrity';

export const ALL_TURKEY_EN = 'All Turkey';
export const ALL_TURKEY_AR = 'عموم تركيا';

export const TURKEY_BBOX = {
  south: 35.82,
  west: 25.66,
  north: 42.32,
  east: 44.82,
};

export const ALL_TURKEY_LOCATION: AppLocation = {
  lat: 39.14,
  lng: 35.17,
  zoom: 6,
  label: ALL_TURKEY_AR,
  city: ALL_TURKEY_AR,
  country: 'تركيا',
  bbox: TURKEY_BBOX,
};

const TURKEY_COUNTRY = new Set(['turkey', 'turkiye', 'tr', 'تركيا', 'turkiye']);

export function isAllTurkeyCity(city?: string | CityCoordinate | null): boolean {
  if (!city) return false;
  if (typeof city === 'object') {
    return city.en === ALL_TURKEY_EN || normalizeName(city.name) === normalizeName(ALL_TURKEY_AR);
  }
  const n = normalizeName(city);
  return n === 'allturkey' || n === 'عمومتركيا' || n === normalizeName(ALL_TURKEY_AR);
}

export function isTurkeyCountry(country?: string | null): boolean {
  return TURKEY_COUNTRY.has(normalizeName(country || ''));
}

export function listingProvinceKey(item: DirectoryListing): string | null {
  const hit = lookupCity(item.city);
  if (hit && hit.countryCode === 'TR' && hit.en !== ALL_TURKEY_EN) return hit.en.toLowerCase();
  return null;
}

const MATCH_CACHE = new Map<string, boolean>();

export function listingMatchesProvince(
  item: DirectoryListing,
  city: CityCoordinate | null,
  allTurkey: boolean,
): boolean {
  const cacheKey = `${item.id}|${item.lat.toFixed(5)}|${item.lng.toFixed(5)}|${city?.en || ''}|${allTurkey ? 1 : 0}`;
  const cached = MATCH_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;
  const matched = matchProvince(item, city, allTurkey);
  if (MATCH_CACHE.size > 80_000) MATCH_CACHE.clear();
  MATCH_CACHE.set(cacheKey, matched);
  return matched;
}

function matchProvince(
  item: DirectoryListing,
  city: CityCoordinate | null,
  allTurkey: boolean,
): boolean {
  const inTurkeyGeo = item.lat >= TURKEY_BBOX.south && item.lat <= TURKEY_BBOX.north
    && item.lng >= TURKEY_BBOX.west && item.lng <= TURKEY_BBOX.east;
  const turkey = isTurkeyCountry(item.country_name) || Boolean(listingProvinceKey(item)) || inTurkeyGeo;
  if (allTurkey) return turkey;
  if (!city || isAllTurkeyCity(city)) return turkey;

  const selectedKey = cityIntegrityKey(city.en, city.countryEn) || cityIntegrityKey(city.name);
  if (selectedKey && coordsInCityLand(item.lat, item.lng, selectedKey)) return true;

  const pinKey = inferCityLandKey(item.lat, item.lng);
  if (pinKey && selectedKey && pinKey !== selectedKey) return false;

  const itemHit = lookupCity(item.city);
  if (itemHit) {
    return normalizeName(itemHit.en) === normalizeName(city.en)
      || normalizeName(itemHit.name) === normalizeName(city.name);
  }
  return normalizeName(item.city) === normalizeName(city.name)
    || normalizeName(item.city) === normalizeName(city.en);
}
