import type { PlaceCategory } from './categories.js';
import { importPhotonCategory } from './photonImport.js';
import { upsertPlace } from './placesRepo.js';
import { bboxSpanMeters, inferTurkeyCityEn } from './coordIntegrity.js';
import { collectImageMetadata } from './placeImages.js';

const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const FILTERS: Record<string, string[]> = {
  pharmacies: ['amenity=pharmacy', 'shop=chemist'],
  hospitals: ['amenity=hospital', 'amenity=clinic'],
  hotels: ['tourism=hotel', 'tourism=resort', 'tourism=guest_house'],
  restaurants: ['amenity=restaurant', 'amenity=cafe'],
  markets: ['shop=supermarket', 'shop=mall', 'shop=convenience', 'shop=department_store', 'shop=marketplace', 'amenity=marketplace'],
  attractions: ['tourism=museum', 'tourism=attraction'],
  exchange: ['amenity=bank', 'amenity=bureau_de_change', 'amenity=atm'],
  mosques: ['amenity=mosque'],
  transport: ['amenity=car_rental', 'shop=rental', 'amenity=bus_station', 'amenity=ferry_terminal', 'railway=station', 'public_transport=station'],
  embassy: ['amenity=embassy'],
  police: ['amenity=police'],
  telecom: ['shop=mobile_phone', 'office=telecommunication', 'shop=telecommunication'],
  nightlife: ['amenity=bar', 'amenity=nightclub'],
  salons: ['shop=hairdresser'],
  fuel: ['amenity=fuel'],
  bakeries: ['shop=bakery', 'shop=pastry', 'shop=supermarket', 'shop=convenience', 'shop=greengrocer'],
};

interface OsmElement {
  id: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  bounds?: { minlat?: number; minlon?: number; maxlat?: number; maxlon?: number };
  tags?: Record<string, string>;
}

function buildQuery(filters: string[], lat: number, lon: number, radius: number, limit: number): string {
  const around = `(around:${Math.round(radius)},${lat.toFixed(5)},${lon.toFixed(5)})`;
  const clause = filters.map((filter) => {
    const [key, val] = filter.split('=');
    return `node["${key}"="${val}"]${around};way["${key}"="${val}"]${around};`;
  }).join('');
  return `[out:json][timeout:28];(${clause});out center bb ${limit};`;
}

async function postOverpass(query: string): Promise<OsmElement[]> {
  let lastError: unknown = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(26_000),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue;
      }
      const json = await res.json() as { elements?: OsmElement[] };
      return Array.isArray(json.elements) ? json.elements : [];
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Overpass request failed');
}

export async function importOsmCategory(opts: {
  category: PlaceCategory;
  lat: number;
  lng: number;
  radiusMeters?: number;
  limit?: number;
  city?: string;
  country?: string;
  countryCode?: string;
}): Promise<{ fetched: number; inserted: number; updated: number }> {
  const filters = FILTERS[opts.category];
  if (!filters?.length) return { fetched: 0, inserted: 0, updated: 0 };
  const limit = Math.min(Math.max(opts.limit ?? 80, 50), 400);
  const radius = opts.radiusMeters ?? 22000;
  let elements: OsmElement[] = [];
  try {
    elements = await postOverpass(buildQuery(filters, opts.lat, opts.lng, radius, limit));
  } catch {
    elements = [];
  }
  let inserted = 0;
  let updated = 0;
  const seen = new Set<string>();

  for (const el of elements) {
    const lat = Number(el.lat ?? el.center?.lat);
    const lng = Number(el.lon ?? el.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const tags = el.tags ?? {};
    if (tags.natural === 'water' || tags.natural === 'bay' || tags.waterway || tags.place === 'sea') continue;
    const nameRaw = String(tags['name:ar'] || tags.name || tags['name:en'] || tags.brand || tags.operator || '').trim();
    const amenity = String(tags.amenity || '');
    const name = nameRaw.length >= 3
      ? nameRaw
      : amenity === 'atm'
        ? (tags.brand || tags.operator || 'ATM')
        : amenity === 'bureau_de_change'
          ? (tags.brand || 'Döviz')
          : nameRaw;
    if (name.length < 3) continue;
    if (opts.category === 'fuel' && /hastane|hospital|acil|shemall|avm|\bmall\b|clinic|مستشفى|طوارئ|عيادة/i.test(name)) continue;
    if (opts.category === 'fuel' && (amenity === 'hospital' || amenity === 'clinic' || tags.shop === 'mall')) continue;
    const sourceId = `osm-${el.type || 'n'}-${el.id}`;
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);
    const shop = String(tags.shop || '');
    const tourism = String(tags.tourism || '');
    const office = String(tags.office || '');
    const subcategory = opts.category === 'hotels'
      ? (tourism === 'resort' ? 'resort' : tourism || 'hotel')
      : opts.category === 'telecom'
        ? (shop === 'mobile_phone' ? 'mobile' : office === 'telecommunication' || shop === 'telecommunication' ? 'telecommunication' : shop || 'mobile')
      : opts.category === 'exchange'
        ? (amenity === 'atm' ? 'atm' : amenity === 'bank' ? 'bank' : 'exchange')
      : shop === 'mall' || /avm|mall|shopping/i.test(name)
        ? 'mall'
        : shop === 'marketplace' || tags.amenity === 'marketplace'
          ? 'marketplace'
          : shop || opts.category;
    const photos = collectImageMetadata({ name, tags });
    const result = await upsertPlace({
      name,
      localName: tags['name:ar'] || tags['name:tr'] || null,
      country: opts.country || 'Turkey',
      countryCode: (opts.countryCode || 'TR').slice(0, 2),
      city: inferTurkeyCityEn(lat, lng, opts.city || tags['addr:city'] || ''),
      category: opts.category,
      subcategory,
      latitude: lat,
      longitude: lng,
      address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(' ') || null,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || null,
      openingHours: tags.opening_hours || null,
      source: 'OpenStreetMap',
      sourceId,
      metadata: {
        imported: true,
        shop: shop || tags.amenity || null,
        brand: tags.brand || tags.operator || null,
        image_url: photos.image_url,
        images: photos.images,
        wikimedia_commons: tags.wikimedia_commons || null,
      },
      osmType: el.type || null,
      bboxSpanMeters: bboxSpanMeters(el.bounds),
      precisionHint: el.type === 'node' || tourism === 'hotel' || tourism === 'resort' || shop === 'mall' || (el.lat != null && el.lon != null) ? 'rooftop' : 'venue',
    });
    if (result === 'inserted') inserted += 1;
    if (result === 'updated') updated += 1;
  }

  const enough = opts.category === 'markets' ? 200
    : opts.category === 'hotels' ? 100
    : opts.category === 'telecom' ? 70
    : opts.category === 'exchange' ? 200
    : opts.category === 'transport' ? 80
    : opts.category === 'fuel' ? 70
    : opts.category === 'bakeries' ? 100
    : opts.category === 'hospitals' ? 50
    : opts.category === 'police' ? 50
    : 50;
  if (seen.size >= enough) {
    return { fetched: seen.size, inserted, updated };
  }

  const photon = await importPhotonCategory(opts);
  return {
    fetched: seen.size + photon.fetched,
    inserted: inserted + photon.inserted,
    updated: updated + photon.updated,
  };
}

const ISTANBUL_SHOPPING_HUBS = [
  { lat: 41.0082, lng: 28.9784 },
  { lat: 41.0600, lng: 28.9870 },
  { lat: 40.9908, lng: 29.0245 },
  { lat: 41.0805, lng: 29.0138 },
  { lat: 40.9815, lng: 28.8722 },
  { lat: 41.0235, lng: 29.0150 },
];

export async function importIstanbulMarkets(): Promise<{ fetched: number; inserted: number; updated: number }> {
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  for (const hub of ISTANBUL_SHOPPING_HUBS) {
    const result = await importOsmCategory({
      category: 'markets',
      lat: hub.lat,
      lng: hub.lng,
      radiusMeters: 16000,
      limit: 250,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    });
    fetched += result.fetched;
    inserted += result.inserted;
    updated += result.updated;
  }
  return { fetched, inserted, updated };
}

export async function importIstanbulHotels(): Promise<{ fetched: number; inserted: number; updated: number }> {
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  for (const hub of ISTANBUL_SHOPPING_HUBS) {
    const result = await importOsmCategory({
      category: 'hotels',
      lat: hub.lat,
      lng: hub.lng,
      radiusMeters: 16000,
      limit: 200,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    });
    fetched += result.fetched;
    inserted += result.inserted;
    updated += result.updated;
  }
  return { fetched, inserted, updated };
}

export async function importIstanbulTelecom(): Promise<{ fetched: number; inserted: number; updated: number }> {
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  for (const hub of ISTANBUL_SHOPPING_HUBS) {
    const result = await importOsmCategory({
      category: 'telecom',
      lat: hub.lat,
      lng: hub.lng,
      radiusMeters: 16000,
      limit: 250,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    });
    fetched += result.fetched;
    inserted += result.inserted;
    updated += result.updated;
  }
  return { fetched, inserted, updated };
}

export async function importIstanbulExchange(): Promise<{ fetched: number; inserted: number; updated: number }> {
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  for (const hub of ISTANBUL_SHOPPING_HUBS) {
    const result = await importOsmCategory({
      category: 'exchange',
      lat: hub.lat,
      lng: hub.lng,
      radiusMeters: 16000,
      limit: 250,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    });
    fetched += result.fetched;
    inserted += result.inserted;
    updated += result.updated;
  }
  return { fetched, inserted, updated };
}

export async function importIstanbulTransport(): Promise<{ fetched: number; inserted: number; updated: number }> {
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  for (const hub of ISTANBUL_SHOPPING_HUBS) {
    const result = await importOsmCategory({
      category: 'transport',
      lat: hub.lat,
      lng: hub.lng,
      radiusMeters: 16000,
      limit: 250,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    });
    fetched += result.fetched;
    inserted += result.inserted;
    updated += result.updated;
  }
  return { fetched, inserted, updated };
}

async function importIstanbulHubs(category: PlaceCategory, limit: number) {
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  for (const hub of ISTANBUL_SHOPPING_HUBS) {
    const result = await importOsmCategory({
      category,
      lat: hub.lat,
      lng: hub.lng,
      radiusMeters: 16000,
      limit,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    });
    fetched += result.fetched;
    inserted += result.inserted;
    updated += result.updated;
  }
  return { fetched, inserted, updated };
}

export function importIstanbulHospitals() {
  return importIstanbulHubs('hospitals', 180);
}

export function importIstanbulPolice() {
  return importIstanbulHubs('police', 180);
}

export function importIstanbulFuel() {
  return importIstanbulHubs('fuel', 250);
}

export function importIstanbulBakeries() {
  return importIstanbulHubs('bakeries', 300);
}
