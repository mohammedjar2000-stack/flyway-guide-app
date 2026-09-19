import { requireGeoapifyKey } from './env.js';
import type { CategoryImportSpec } from './categories.js';
import { bboxSpanMeters, validateCoordinates } from './coordIntegrity.js';
import { collectImageMetadata } from './placeImages.js';

const PLACES_URL = 'https://api.geoapify.com/v2/places';

export interface GeoapifyPlace {
  sourceId: string;
  name: string;
  localName: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  categories: string[];
  resultType: string | null;
  confidence: number | null;
  osmType: string | null;
  bboxSpanMeters: number | null;
  imageUrl: string | null;
  images: string[];
  raw: Record<string, unknown>;
}

interface GeoapifyFeature {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    lat?: number;
    lon?: number;
    country?: string;
    country_code?: string;
    city?: string;
    suburb?: string;
    district?: string;
    website?: string;
    opening_hours?: string;
    result_type?: string;
    bbox?: number[];
    rank?: { confidence?: number; confidence_city?: number; match_type?: string };
    contact?: { phone?: string; website?: string };
    categories?: string[];
    datasource?: { raw?: Record<string, unknown>; sourcename?: string };
    name_international?: Record<string, string>;
    [key: string]: unknown;
  };
  geometry?: { type?: string; coordinates?: unknown };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function pointFromGeometry(geometry?: { type?: string; coordinates?: unknown }): { lat: number; lng: number } | null {
  if (!geometry) return null;
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    const lng = Number(geometry.coordinates[0]);
    const lat = Number(geometry.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

function spanFromBbox(bbox?: number[]): number | null {
  if (!Array.isArray(bbox) || bbox.length < 4) return null;
  const west = Number(bbox[0]);
  const south = Number(bbox[1]);
  const east = Number(bbox[2]);
  const north = Number(bbox[3]);
  return bboxSpanMeters({ minlat: south, minlon: west, maxlat: north, maxlon: east });
}

interface ExtractedFeature {
  sourceId: string;
  name: string;
  localName: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  categories: string[];
  resultType: string | null;
  confidence: number | null;
  osmType: string | null;
  bboxSpanMeters: number | null;
  rooftop: boolean;
  imageUrl: string | null;
  images: string[];
  raw: Record<string, unknown>;
}

function extractFeature(feature: GeoapifyFeature): ExtractedFeature | null {
  const props = feature.properties;
  if (!props) return null;
  const rooftop = pointFromGeometry(feature.geometry);
  const lon = Number(rooftop?.lng ?? props.lon);
  const lat = Number(rooftop?.lat ?? props.lat);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const sourceId = String(props.place_id ?? '').trim();
  if (!sourceId) return null;

  const intl = props.name_international ?? {};
  const name = String(props.name || intl.en || props.formatted || '').trim();
  if (!name) return null;

  const osmRaw = asRecord(props.datasource?.raw) ?? {};
  const photos = collectImageMetadata({ name, raw: osmRaw });
  const span = spanFromBbox(props.bbox) ?? (rooftop ? 0 : null);
  const city = props.city || props.district || props.suburb ? String(props.city || props.district || props.suburb) : null;
  return {
    sourceId,
    name,
    localName: String(intl.tr || intl.ar || '').trim() || null,
    latitude: lat,
    longitude: lon,
    address: String(props.formatted || [props.address_line1, props.address_line2].filter(Boolean).join(', ')).trim() || null,
    phone: String(props.contact?.phone || osmRaw.phone || osmRaw['contact:phone'] || '').trim() || null,
    website: String(props.website || props.contact?.website || osmRaw.website || '').trim() || null,
    openingHours: String(props.opening_hours || osmRaw.opening_hours || '').trim() || null,
    country: props.country ? String(props.country) : null,
    countryCode: props.country_code ? String(props.country_code).toUpperCase() : null,
    city,
    categories: Array.isArray(props.categories) ? props.categories.map(String) : [],
    resultType: props.result_type ? String(props.result_type) : null,
    confidence: Number.isFinite(Number(props.rank?.confidence)) ? Number(props.rank?.confidence) : null,
    osmType: osmRaw.osm_type ? String(osmRaw.osm_type) : null,
    bboxSpanMeters: span,
    rooftop: Boolean(rooftop),
    imageUrl: photos.image_url,
    images: photos.images,
    raw: { ...props, datasource: undefined },
  };
}

function toGeoapifyPlace(extracted: ExtractedFeature, lat: number, lng: number): GeoapifyPlace {
  return {
    sourceId: extracted.sourceId,
    name: extracted.name,
    localName: extracted.localName,
    latitude: lat,
    longitude: lng,
    address: extracted.address,
    phone: extracted.phone,
    website: extracted.website,
    openingHours: extracted.openingHours,
    country: extracted.country,
    countryCode: extracted.countryCode,
    city: extracted.city,
    categories: extracted.categories,
    resultType: extracted.resultType,
    confidence: extracted.confidence,
    osmType: extracted.osmType,
    bboxSpanMeters: extracted.bboxSpanMeters,
    imageUrl: extracted.imageUrl,
    images: extracted.images,
    raw: extracted.raw,
  };
}

export async function geocodeVenue(opts: {
  name: string;
  city?: string;
  country?: string;
  lat: number;
  lon: number;
}): Promise<{ lat: number; lng: number; confidence: number | null; resultType: string | null } | null> {
  const apiKey = requireGeoapifyKey();
  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', [opts.name, opts.city, opts.country].filter(Boolean).join(', '));
  url.searchParams.set('filter', `circle:${opts.lon},${opts.lat},12000`);
  url.searchParams.set('bias', `proximity:${opts.lon},${opts.lat}`);
  url.searchParams.set('type', 'amenity');
  url.searchParams.set('limit', '1');
  url.searchParams.set('format', 'json');
  url.searchParams.set('apiKey', apiKey);
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const json = await res.json() as { results?: Array<{ lat?: number; lon?: number; result_type?: string; rank?: { confidence?: number } }> };
  const hit = json.results?.[0];
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const verdict = validateCoordinates({
    lat,
    lng,
    city: opts.city,
    country: opts.country,
    resultType: hit?.result_type,
    confidence: hit?.rank?.confidence ?? null,
    precisionHint: 'rooftop',
  });
  if (!verdict.ok) return null;
  return {
    lat: verdict.lat,
    lng: verdict.lng,
    confidence: hit?.rank?.confidence ?? null,
    resultType: hit?.result_type ?? null,
  };
}

export async function fetchGeoapifyPlaces(spec: CategoryImportSpec, opts: {
  lon: number;
  lat: number;
  radiusMeters: number;
  limit: number;
}): Promise<GeoapifyPlace[]> {
  const apiKey = requireGeoapifyKey();
  const target = Math.min(Math.max(opts.limit, 1), 400);
  const pageSize = Math.min(target, 50);
  const mapped: GeoapifyPlace[] = [];
  const seen = new Set<string>();
  let geocodeAttempts = 0;

  for (let offset = 0; mapped.length < target && offset < 400; offset += pageSize) {
    const url = new URL(PLACES_URL);
    url.searchParams.set('categories', spec.geoapify);
    url.searchParams.set('filter', `circle:${opts.lon},${opts.lat},${opts.radiusMeters}`);
    url.searchParams.set('bias', `proximity:${opts.lon},${opts.lat}`);
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('lang', 'en');
    url.searchParams.set('apiKey', apiKey);

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Geoapify Places request failed (${res.status}) for ${spec.category}`);
    }
    const json = await res.json() as { features?: GeoapifyFeature[] };
    const features = Array.isArray(json.features) ? json.features : [];
    if (features.length === 0) break;
    for (const feature of features) {
      const extracted = extractFeature(feature);
      if (!extracted || seen.has(extracted.sourceId)) continue;
      const verdict = validateCoordinates({
        lat: extracted.latitude,
        lng: extracted.longitude,
        city: extracted.city,
        country: extracted.country,
        address: extracted.address,
        resultType: extracted.resultType,
        confidence: extracted.confidence,
        osmType: extracted.osmType,
        bboxSpanMeters: extracted.bboxSpanMeters,
        precisionHint: extracted.rooftop ? 'rooftop' : null,
      });
      let lat = verdict.lat;
      let lng = verdict.lng;
      if (!verdict.ok) {
        if (geocodeAttempts >= 8) continue;
        geocodeAttempts += 1;
        const refined = await geocodeVenue({
          name: extracted.name,
          city: extracted.city || undefined,
          country: extracted.country || undefined,
          lat: extracted.latitude,
          lon: extracted.longitude,
        }).catch(() => null);
        if (!refined) continue;
        lat = refined.lat;
        lng = refined.lng;
        extracted.resultType = refined.resultType;
        extracted.confidence = refined.confidence;
        extracted.bboxSpanMeters = 0;
      }
      seen.add(extracted.sourceId);
      mapped.push(toGeoapifyPlace(extracted, lat, lng));
      if (mapped.length >= target) break;
    }
    if (features.length < pageSize) break;
  }
  return mapped;
}
