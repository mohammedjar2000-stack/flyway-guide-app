import { FLYWAY_URL } from '@/types';
import { sanitizePin } from '@/lib/placePrecision';

export type FlywayProduct = 'hotel' | 'stay' | 'visa' | 'insurance' | 'generic';

export interface FlywayBookingInput {
  product?: FlywayProduct;
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export function isFlywayStay(categoryKey?: string | null): boolean {
  return categoryKey === 'hotels';
}

/** Map POIs that Flyway can actually book (hotels/stays). Pharmacies and other services stay hidden. */
const FLYWAY_BOOKABLE_CATEGORIES = new Set(['hotels']);

export function isFlywayBookable(categoryKey?: string | null): boolean {
  return Boolean(categoryKey && FLYWAY_BOOKABLE_CATEGORIES.has(categoryKey));
}

export const FLYWAY_CTA_LABEL = 'احجز عن طريق Flyway';

export function flywayProductForCategory(categoryKey?: string | null): FlywayProduct {
  if (isFlywayStay(categoryKey)) return 'hotel';
  if (categoryKey === 'transport') return 'generic';
  return 'generic';
}

export function flywayBookingUrlForPlace(place: {
  category_key?: string;
  name?: string;
  city?: string;
  country_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}): string {
  return flywayBookingUrl({
    product: flywayProductForCategory(place.category_key),
    name: place.name,
    city: place.city,
    country: place.country_name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
  });
}

export function flywayBookingUrl(input: FlywayBookingInput = {}): string {
  const url = new URL(FLYWAY_URL);
  url.searchParams.set('ref', 'flywayguide');
  url.searchParams.set('utm_source', 'flywayguide');
  url.searchParams.set('utm_medium', 'app');
  url.searchParams.set('utm_campaign', 'in_app_booking');
  url.searchParams.set('partner', 'flywayguide');
  url.searchParams.set('action', 'book');
  url.searchParams.set('product', input.product ?? 'generic');
  if (input.name) url.searchParams.set('name', input.name);
  if (input.city) url.searchParams.set('city', input.city);
  if (input.country) url.searchParams.set('country', input.country);
  if (input.address) url.searchParams.set('address', input.address);
  if (Number.isFinite(input.lat) && Number.isFinite(input.lng)) {
    const pin = sanitizePin(Number(input.lat), Number(input.lng));
    if (pin) {
      url.searchParams.set('lat', pin.lat.toFixed(6));
      url.searchParams.set('lng', pin.lng.toFixed(6));
    }
  }
  return url.toString();
}
