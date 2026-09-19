import type { PlaceCategory } from './categories.js';
import { collectImageMetadata } from './placeImages.js';
import { upsertPlace } from './placesRepo.js';
import { inferTurkeyCityEn } from './coordIntegrity.js';

const PHOTON_URL = 'https://photon.komoot.io/api/';
const GENERIC_NAME = /^(eczanesi|eczane|pharmacy|hospital|hotel|restaurant|unnamed)$/i;

const QUERY_TERMS: Record<string, string[]> = {
  pharmacies: ['eczanesi', 'pharmacy'],
  hospitals: ['hastane', 'hospital'],
  hotels: ['hotel', 'otel', 'resort'],
  restaurants: ['restaurant', 'restoran'],
  markets: ['supermarket', 'avm', 'mall', 'pazar', 'migros'],
  attractions: ['museum', 'attraction'],
  exchange: ['döviz', 'exchange', 'atm', 'banka', 'garanti', 'ziraat'],
  mosques: ['cami', 'mosque'],
  transport: ['car rental', 'metro', 'station', 'garenta', 'avis'],
  embassy: ['embassy', 'konsolosluk'],
  police: ['polis', 'police'],
  telecom: ['turkcell', 'vodafone', 'telekom', 'cep telefonu', 'tt mobil'],
  nightlife: ['bar', 'nightclub'],
  salons: ['kuaför', 'hairdresser'],
  fuel: ['petrol', 'fuel', 'opet', 'shell', 'bp', 'aytemiz', 'petrol ofisi'],
  bakeries: ['migros', 'bim', 'a101', 'supermarket', 'carrefour', 'bakery', 'fırın', 'firin'],
};

const OSM_VALUES: Record<string, string[]> = {
  pharmacies: ['pharmacy', 'chemist'],
  hospitals: ['hospital', 'clinic'],
  hotels: ['hotel', 'guest_house', 'hostel', 'resort'],
  restaurants: ['restaurant', 'cafe', 'fast_food'],
  markets: ['supermarket', 'mall', 'convenience', 'marketplace', 'department_store'],
  attractions: ['museum', 'attraction', 'gallery'],
  exchange: ['bank', 'bureau_de_change', 'atm'],
  mosques: ['mosque', 'place_of_worship'],
  transport: ['station', 'subway_entrance', 'bus_station'],
  embassy: ['embassy'],
  police: ['police'],
  telecom: ['mobile_phone', 'telecommunication'],
  nightlife: ['bar', 'nightclub', 'pub'],
  salons: ['hairdresser', 'beauty'],
  fuel: ['fuel'],
  bakeries: ['bakery', 'pastry', 'supermarket', 'convenience', 'greengrocer'],
};

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    street?: string;
    district?: string;
    city?: string;
    country?: string;
    countrycode?: string;
  };
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function bboxFor(lat: number, lng: number, radiusMeters: number): string {
  const dLat = radiusMeters / 111_000;
  const dLng = radiusMeters / (111_000 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(5)).join(',');
}

async function fetchPhoton(query: string, lat: number, lng: number, radiusMeters: number): Promise<PhotonFeature[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('limit', '80');
  url.searchParams.set('bbox', bboxFor(lat, lng, radiusMeters));
  url.searchParams.set('location_bias_scale', '0.08');
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'FlywayGuide/1.0' },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const json = await res.json() as { features?: PhotonFeature[] };
  return Array.isArray(json.features) ? json.features : [];
}

export async function importPhotonCategory(opts: {
  category: PlaceCategory;
  lat: number;
  lng: number;
  radiusMeters?: number;
  limit?: number;
  city?: string;
  country?: string;
  countryCode?: string;
}): Promise<{ fetched: number; inserted: number; updated: number }> {
  const terms = QUERY_TERMS[opts.category] ?? ['pharmacy'];
  const allowed = new Set(OSM_VALUES[opts.category] ?? ['pharmacy']);
  const radius = opts.radiusMeters ?? 22000;
  const limit = Math.min(Math.max(opts.limit ?? 80, 50), 400);
  const offsets: Array<[number, number]> = [
    [0, 0],
    [0.04, 0],
    [-0.04, 0],
    [0, 0.05],
    [0, -0.05],
    [0.04, 0.05],
    [-0.04, 0.05],
  ];

  const seen = new Set<string>();
  const hits: Array<{ sourceId: string; name: string; lat: number; lng: number; address: string | null; city: string; osmType: string }> = [];

  for (const [dLat, dLng] of offsets) {
    if (hits.length >= limit) break;
    for (const term of terms) {
      if (hits.length >= limit) break;
      let features: PhotonFeature[] = [];
      try {
        features = await fetchPhoton(term, opts.lat + dLat, opts.lng + dLng, Math.min(radius, 12_000));
      } catch {
        continue;
      }
      for (const feature of features) {
        const props = feature.properties ?? {};
        const value = String(props.osm_value || '');
        const name = String(props.name || '').trim();
        if (!allowed.has(value)) continue;
        if (opts.category === 'fuel' && /hastane|hospital|acil|shemall|avm|\bmall\b|clinic/i.test(name)) continue;
        if (name.length < 3 || GENERIC_NAME.test(name)) continue;
        const coords = feature.geometry?.coordinates;
        const lng = Number(coords?.[0]);
        const lat = Number(coords?.[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (haversineM(opts.lat, opts.lng, lat, lng) > radius) continue;
        const sourceId = `osm-${String(props.osm_type || 'n').toLowerCase()}-${props.osm_id}`;
        if (seen.has(sourceId)) continue;
        seen.add(sourceId);
        hits.push({
          sourceId,
          name,
          lat,
          lng,
          address: [props.street, props.district, props.city].filter(Boolean).join(', ') || null,
          city: inferTurkeyCityEn(lat, lng, opts.city || props.city || ''),
          osmType: String(props.osm_type || 'N'),
        });
        if (hits.length >= limit) break;
      }
    }
  }

  let inserted = 0;
  let updated = 0;
  for (const hit of hits) {
    const result = await upsertPlace({
      name: hit.name,
      localName: null,
      country: opts.country || 'Turkey',
      countryCode: (opts.countryCode || 'TR').slice(0, 2),
      city: hit.city,
      category: opts.category,
      subcategory: opts.category,
      latitude: hit.lat,
      longitude: hit.lng,
      address: hit.address,
      phone: null,
      website: null,
      openingHours: null,
      source: 'OpenStreetMap',
      sourceId: hit.sourceId,
      metadata: { imported: true, provider: 'photon', ...collectImageMetadata({ name: hit.name }) },
      osmType: hit.osmType,
      precisionHint: hit.osmType === 'N' || hit.osmType === 'node' ? 'rooftop' : 'venue',
    });
    if (result === 'inserted') inserted += 1;
    if (result === 'updated') updated += 1;
  }

  return { fetched: hits.length, inserted, updated };
}
