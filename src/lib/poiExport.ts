import { lookupCity } from '@/lib/cityCoordinates';
import { ISTANBUL_DATASET_VERSION } from '@/lib/datasetVersion';
import {
  inferDistrictFromAddress,
  isEmergencyFacility,
  isInIstanbulBbox,
  isNearDuplicatePoi,
  isPlaceCategory,
  isTwentyFourSeven,
  isValidLatLng,
  listingCityEn,
  makeIdentityKey,
} from '@/lib/poiIdentity';
import { isAuthenticVenueName, isGenericSeedName } from '@/lib/placeAuthenticity';
import { turkeyAirportListings } from '@/lib/turkeyAirports';
import { getAllVerifiedPlaces, listVerifiedSeedsByCity, toVerifiedListing } from '@/lib/verifiedPlaces';
import type { DirectoryListing } from '@/types';

export interface PoiSeedRow {
  identity_key: string;
  name: string;
  local_name: string | null;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  country: string;
  country_code: string;
  city: string;
  city_ar: string | null;
  province: string | null;
  district: string | null;
  district_ar: string | null;
  street_name: string | null;
  category: string;
  subcategory: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  address_ar: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  rating: number | null;
  review_count: number;
  image_url: string | null;
  is_24_7: boolean;
  is_emergency: boolean;
  is_active: boolean;
  verified: boolean;
  source: string;
  source_id: string;
  source_url: string | null;
  metadata: Record<string, unknown>;
}

function streetFromAddress(address: string): string | null {
  const first = address.split(',')[0]?.trim();
  return first && first.length >= 3 ? first : null;
}

function realImageUrl(url?: string | null): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (/placehold|unsplash\.com\/photo-|lorem|dummy|fake/i.test(url)) return null;
  return url;
}

function fromListing(item: DirectoryListing, extras?: { verified?: boolean; sourceId?: string }): PoiSeedRow | null {
  if (!isPlaceCategory(item.category_key)) return null;
  if (!isValidLatLng(item.lat, item.lng)) return null;
  if (isGenericSeedName(item.description || '', item.name)) return null;
  if (!isAuthenticVenueName(item.name, item.category_key) && !isAuthenticVenueName(item.description || '', item.category_key)) {
    return null;
  }
  const cityHit = lookupCity(item.city) || lookupCity(item.country_name);
  const cityEn = cityHit?.en || listingCityEn(item) || 'Istanbul';
  const district = inferDistrictFromAddress(item.address || '', cityEn);
  const identity = makeIdentityKey({
    category: item.category_key,
    lat: item.lat,
    lng: item.lng,
    name: item.description || item.name,
    sourceId: extras?.sourceId || item.id,
  });
  const hours = item.hours || null;
  const is247 = isTwentyFourSeven(hours, item.tags);
  return {
    identity_key: identity,
    name: item.description || item.name,
    local_name: item.name,
    name_ar: item.name,
    description: item.description || null,
    description_ar: item.name,
    country: cityHit?.countryEn || 'Turkey',
    country_code: cityHit?.countryCode || 'TR',
    city: cityEn,
    city_ar: cityHit?.name || item.city || null,
    province: cityEn,
    district: district?.en || null,
    district_ar: district?.ar || null,
    street_name: streetFromAddress(item.address || ''),
    category: item.category_key,
    subcategory: item.place_kind || null,
    latitude: Number(item.lat.toFixed(7)),
    longitude: Number(item.lng.toFixed(7)),
    address: item.address || null,
    address_ar: item.address || null,
    phone: item.phone || null,
    website: item.website || null,
    opening_hours: hours,
    rating: item.rating > 0 ? Number(item.rating) : null,
    review_count: Number(item.review_count) || 0,
    image_url: realImageUrl(item.images?.[0] || item.image),
    is_24_7: is247,
    is_emergency: isEmergencyFacility(item.category_key, `${item.name} ${item.description || ''}`, hours),
    is_active: true,
    verified: extras?.verified !== false,
    source: 'flyway-verified',
    source_id: extras?.sourceId || item.id,
    source_url: item.website || null,
    metadata: {
      dataset: ISTANBUL_DATASET_VERSION,
      tags: item.tags || [],
      place_kind: item.place_kind || null,
    },
  };
}

export function collectVerifiedPoiRows(): PoiSeedRow[] {
  const accepted: PoiSeedRow[] = [];
  const seen = new Set<string>();

  const push = (row: PoiSeedRow | null) => {
    if (!row) return;
    if (seen.has(row.identity_key) || seen.has(row.source_id)) return;
    if (accepted.some((existing) => isNearDuplicatePoi(
      { category: existing.category, lat: existing.latitude, lng: existing.longitude, name: existing.name },
      { category: row.category, lat: row.latitude, lng: row.longitude, name: row.name },
    ))) return;
    seen.add(row.identity_key);
    seen.add(row.source_id);
    accepted.push(row);
  };

  let index = 0;
  for (const { cityKey, seed } of listVerifiedSeedsByCity()) {
    const cityHit = lookupCity(cityKey);
    const listing = toVerifiedListing(seed, cityHit?.name || cityKey, cityHit?.country || '', index);
    index += 1;
    if (!listing) continue;
    listing.images = seed.images?.filter((url) => /^https?:\/\//i.test(url)) || [];
    listing.image = listing.images[0] || '';
    listing.website = seed.website;
    push(fromListing(listing, {
      sourceId: seed.slug
        ? `${cityKey}-${seed.category_key}-${seed.slug}`
        : `${cityKey}-${seed.category_key}-${seed.lat.toFixed(5)}-${seed.lng.toFixed(5)}`,
    }));
  }

  for (const airport of turkeyAirportListings()) {
    airport.images = [];
    airport.image = '';
    push(fromListing(airport, { sourceId: airport.id }));
  }

  return accepted;
}

export function istanbulPoiRows(): PoiSeedRow[] {
  return collectVerifiedPoiRows().filter((row) => (
    row.country_code === 'TR'
    && (row.city.toLowerCase() === 'istanbul' || isInIstanbulBbox(row.latitude, row.longitude))
  ));
}

export function catalogFallbackListings(): DirectoryListing[] {
  return getAllVerifiedPlaces();
}
