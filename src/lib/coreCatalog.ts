import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';
import { lookupCity } from '@/lib/cityCoordinates';
import { appendCuratedTurkeyPins, CORE_ID_PREFIX } from '@/lib/turkeyCuratedGuard';
import { pinListing } from '@/lib/placePrecision';
import pharmacies from '@/data/istanbulPharmacies.json';
import { ISTANBUL_MALLS_DATA } from '@/data/istanbulMallsData.js';

interface OsmPharmacy {
  sourceId: string;
  name: string;
  address?: string | null;
  city?: string;
  lat: number;
  lng: number;
}

function categoryLabel(category: string) {
  return CATEGORIES.find((item) => item.key === category)?.shortLabel || category;
}

function buildListing(opts: {
  id: string;
  category_key: string;
  name: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  website?: string;
  rating?: number;
  city?: string;
}): DirectoryListing | null {
  const cityHit = lookupCity(opts.city || 'Istanbul') || lookupCity('Istanbul');
  const id = opts.id.startsWith(CORE_ID_PREFIX) ? opts.id : `${CORE_ID_PREFIX}${opts.id}`;
  return pinListing({
    id,
    category_key: opts.category_key,
    category_label: categoryLabel(opts.category_key),
    name: opts.name,
    description: opts.description || opts.name,
    country_name: cityHit?.country || 'تركيا',
    city: cityHit?.name || 'إسطنبول',
    address: opts.address || '',
    image: '',
    images: [],
    rating: opts.rating || 4.2,
    price_level: '',
    tags: ['flyway-core'],
    proximity_note: '',
    phone: opts.phone || '',
    hours: opts.hours || '',
    is_featured: false,
    sort_order: 0,
    lat: opts.lat,
    lng: opts.lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: `${opts.lat.toFixed(7)},${opts.lng.toFixed(7)}`,
    website: opts.website,
  });
}

export function loadCoreCatalogListings(): DirectoryListing[] {
  const out: DirectoryListing[] = [];
  const pins: Array<{ category_key: string; lat: number; lng: number }> = [];

  for (const row of pharmacies as OsmPharmacy[]) {
    const listing = buildListing({
      id: `pharmacy-${row.sourceId}`,
      category_key: 'pharmacies',
      name: row.name,
      address: row.address || '',
      lat: row.lat,
      lng: row.lng,
      hours: '09:00 - 19:00',
      city: row.city || 'Istanbul',
    });
    if (listing) {
      out.push(listing);
      pins.push({ category_key: 'pharmacies', lat: listing.lat, lng: listing.lng });
    }
  }

  for (const row of ISTANBUL_MALLS_DATA) {
    const listing = buildListing({
      id: `mall-${row.id}`,
      category_key: 'markets',
      name: row.name,
      description: row.nameEn,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      hours: row.hours || '10:00 - 22:00',
      rating: 4.5,
      city: 'Istanbul',
    });
    if (listing) {
      out.push(listing);
      pins.push({ category_key: 'markets', lat: listing.lat, lng: listing.lng });
    }
  }

  appendCuratedTurkeyPins(pins);
  return out;
}
