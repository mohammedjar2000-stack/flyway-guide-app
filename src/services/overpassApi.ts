import type { DirectoryListing } from '@/types';
import { sanitizeBounds, type MapBounds } from '@/lib/geo';
import { isAuthenticVenueName } from '@/lib/placeAuthenticity';
import { isCampusBlob, isPreciseVenuePin, listingMatchesCategory, normalizeFuelBakeryListing, osmTagsMatchCategory, sanitizePin } from '@/lib/placePrecision';
import { bboxSpanMeters, inferTurkeyCityEn, validateCoordinates } from '@/lib/coordIntegrity';
import { lookupCity } from '@/lib/cityCoordinates';
import { placeGallery, placeKindLabel, resolvePlaceKind } from '@/lib/placeImagery';
import { financialKind, financialLabel } from '@/lib/financialKind';
import { osmMediaUrls, transportGalleryFor } from '@/lib/transportPhotos';
import { normalizeTurkeyEmergencyPhone } from '@/lib/turkeyEmergency';

const PRIMARY_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const FALLBACK_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const DEFAULT_RADIUS_METERS = 22000;
const TIMEOUT_SECONDS = 16;
const CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_CACHE_ENTRIES = 80;
const MIN_PER_CATEGORY = 150;
const FETCH_CONCURRENCY = 3;

const PER_CATEGORY_LIMIT: Record<string, number> = {
  pharmacies: 400,
  hospitals: 280,
  police: 250,
  hotels: 400,
  restaurants: 350,
  markets: 400,
  attractions: 200,
  exchange: 400,
  mosques: 250,
  transport: 280,
  embassy: 80,
  telecom: 300,
  nightlife: 180,
  salons: 220,
  fuel: 300,
  bakeries: 400,
};

export class OverpassError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'OverpassError';
    this.status = status;
  }
}

export interface OverpassCategoryDef {
  category_key: string;
  category_label: string;
  filters: string[];
}

const CATEGORY_TO_OSM: Record<string, OverpassCategoryDef> = {
  hotels: { category_key: 'hotels', category_label: 'فندق', filters: ['tourism=hotel', 'tourism=guest_house', 'tourism=apartment', 'tourism=hostel', 'tourism=resort'] },
  restaurants: { category_key: 'restaurants', category_label: 'مطعم', filters: ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food'] },
  pharmacies: { category_key: 'pharmacies', category_label: 'صيدلية', filters: ['amenity=pharmacy', 'shop=chemist'] },
  hospitals: { category_key: 'hospitals', category_label: 'مستشفى', filters: ['amenity=hospital', 'amenity=clinic', 'healthcare=hospital'] },
  markets: { category_key: 'markets', category_label: 'سوق', filters: ['shop=supermarket', 'shop=mall', 'shop=convenience', 'shop=department_store', 'shop=marketplace', 'amenity=marketplace'] },
  attractions: { category_key: 'attractions', category_label: 'معلم سياحي', filters: ['tourism=museum', 'tourism=gallery', 'historic=monument', 'historic=castle'] },
  exchange: { category_key: 'exchange', category_label: 'صرافة ومالية', filters: ['amenity=bank', 'amenity=bureau_de_change', 'amenity=atm'] },
  mosques: { category_key: 'mosques', category_label: 'مسجد', filters: ['amenity=mosque'] },
  transport: { category_key: 'transport', category_label: 'نقل', filters: ['amenity=bus_station', 'amenity=taxi', 'amenity=car_rental', 'amenity=subway_entrance', 'railway=station'] },
  embassy: { category_key: 'embassy', category_label: 'سفارة', filters: ['amenity=embassy'] },
  police: { category_key: 'police', category_label: 'شرطة', filters: ['amenity=police'] },
  telecom: { category_key: 'telecom', category_label: 'اتصالات و eSIM', filters: ['shop=mobile_phone', 'office=telecommunication', 'shop=telecommunication'] },
  nightlife: { category_key: 'nightlife', category_label: 'نادي ليلي', filters: ['amenity=nightclub', 'amenity=bar', 'amenity=pub', 'amenity=biergarten'] },
  salons: { category_key: 'salons', category_label: 'صالون', filters: ['shop=hairdresser', 'shop=beauty'] },
  fuel: { category_key: 'fuel', category_label: 'وقود', filters: ['amenity=fuel'] },
  bakeries: { category_key: 'bakeries', category_label: 'مخابز وسوبر ماركت', filters: ['shop=bakery', 'shop=pastry', 'shop=supermarket', 'shop=convenience', 'shop=greengrocer'] },
};

const FILTER_LABELS: Record<string, string> = {
  'amenity=restaurant': 'مطعم',
  'amenity=cafe': 'مقهى',
  'amenity=fast_food': 'وجبات سريعة',
  'amenity=pharmacy': 'صيدلية',
  'shop=chemist': 'صيدلية',
  'amenity=hospital': 'مستشفى',
  'amenity=clinic': 'عيادة',
  'healthcare=hospital': 'مستشفى',
  'amenity=doctors': 'عيادة طبية',
  'amenity=dentist': 'عيادة أسنان',
  'tourism=hotel': 'فندق',
  'tourism=guest_house': 'نزل',
  'tourism=apartment': 'شقة فندقية',
  'tourism=hostel': 'بيت شباب',
  'tourism=resort': 'منتجع',
  'shop=supermarket': 'سوبر ماركت',
  'shop=mall': 'مركز تسوق',
  'shop=convenience': 'بقالة',
  'shop=department_store': 'متجر متعدد الأقسام',
  'shop=marketplace': 'سوق شعبي',
  'amenity=marketplace': 'سوق شعبي',
  'tourism=museum': 'متحف',
  'tourism=gallery': 'معرض فني',
  'tourism=viewpoint': 'نقطة مشاهدة',
  'tourism=artwork': 'عمل فني',
  'tourism=attraction': 'معلم سياحي',
  'historic=monument': 'نصب تذكاري',
  'historic=castle': 'قلعة',
  'amenity=bank': 'مصرف',
  'amenity=bureau_de_change': 'صرافة',
  'amenity=atm': 'صراف آلي',
  'amenity=place_of_worship': 'مصلى',
  'amenity=mosque': 'مسجد',
  'amenity=bus_station': 'محطة حافلات',
  'amenity=taxi': 'محطة تاكسي',
  'amenity=car_rental': 'تأجير سيارات',
  'amenity=subway_entrance': 'مدخل مترو',
  'railway=station': 'محطة قطار',
  'amenity=fuel': 'محطة وقود',
  'amenity=embassy': 'سفارة',
  'amenity=police': 'مركز شرطة',
  'shop=mobile_phone': 'متجر شرائح SIM',
  'shop=electronics': 'إلكترونيات',
  'office=telecommunication': 'اتصالات',
  'shop=telecommunication': 'اتصالات و eSIM',
  'amenity=nightclub': 'نادي ليلي',
  'amenity=bar': 'بار',
  'amenity=pub': 'حانة',
  'amenity=biergarten': 'حديقة بيرة',
  'shop=hairdresser': 'صالون حلاقة',
  'shop=beauty': 'صالون تجميل',
  'shop=bakery': 'مخبز',
  'shop=pastry': 'حلويات',
  'shop=greengrocer': 'خضار وفواكه',
};

interface FilterMatch {
  cat: OverpassCategoryDef;
  label: string;
}

const FILTER_TO_CATEGORY: Record<string, FilterMatch> = {};
for (const cat of Object.values(CATEGORY_TO_OSM)) {
  for (const filter of cat.filters) {
    FILTER_TO_CATEGORY[filter] = {
      cat,
      label: FILTER_LABELS[filter] || cat.category_label,
    };
  }
}
if (CATEGORY_TO_OSM.markets) {
  FILTER_TO_CATEGORY['shop=supermarket'] = { cat: CATEGORY_TO_OSM.markets, label: 'سوبر ماركت' };
}
if (CATEGORY_TO_OSM.bakeries) {
  FILTER_TO_CATEGORY['shop=bakery'] = { cat: CATEGORY_TO_OSM.bakeries, label: 'مخبز' };
  FILTER_TO_CATEGORY['shop=pastry'] = { cat: CATEGORY_TO_OSM.bakeries, label: 'حلويات' };
}

interface OsmElement {
  id: number;
  type?: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  bounds?: { minlat?: number; minlon?: number; maxlat?: number; maxlon?: number };
  tags?: Record<string, string>;
}

interface OsmResponse {
  elements?: OsmElement[];
}

interface CacheEntry {
  at: number;
  data: DirectoryListing[];
}

const memoryCache = new Map<string, CacheEntry>();

function cacheGet(key: string): DirectoryListing[] | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key: string, data: DirectoryListing[]) {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, { at: Date.now(), data });
}

function roundCoord(n: number, digits = 3) {
  return Number(n.toFixed(digits));
}

function cacheKey(parts: Record<string, string | number | undefined>) {
  return Object.entries(parts)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('|');
}

const PRIMARY_FILTER: Record<string, string[]> = {
  hotels: ['tourism=hotel', 'tourism=resort'],
  restaurants: ['amenity=restaurant', 'amenity=cafe'],
  pharmacies: ['amenity=pharmacy', 'shop=chemist'],
  hospitals: ['amenity=hospital', 'amenity=clinic', 'healthcare=hospital'],
  markets: ['shop=supermarket', 'shop=mall', 'shop=convenience', 'shop=department_store', 'shop=marketplace', 'amenity=marketplace'],
  attractions: ['tourism=museum', 'historic=monument', 'tourism=attraction'],
  exchange: ['amenity=bank', 'amenity=bureau_de_change', 'amenity=atm'],
  mosques: ['amenity=mosque'],
  transport: ['amenity=car_rental', 'railway=station', 'amenity=bus_station'],
  embassy: ['amenity=embassy'],
  police: ['amenity=police'],
  telecom: ['shop=mobile_phone', 'office=telecommunication', 'shop=telecommunication'],
  nightlife: ['amenity=nightclub', 'amenity=cafe'],
  salons: ['shop=hairdresser'],
  fuel: ['amenity=fuel'],
  bakeries: ['shop=bakery', 'shop=supermarket', 'shop=convenience'],
};

function compactFiltersFor(categories: string[]): string[] {
  const unique = Array.from(new Set(categories));
  const filters: string[] = [];
  for (const key of unique) {
    const primary = PRIMARY_FILTER[key] ?? CATEGORY_TO_OSM[key]?.filters.slice(0, 2);
    if (primary) filters.push(...primary);
  }
  return Array.from(new Set(filters));
}

type QueryArea =
  | { kind: 'around'; lat: number; lon: number; radius: number }
  | { kind: 'bbox'; bounds: MapBounds };

function areaClause(area: QueryArea): string {
  if (area.kind === 'around') {
    return `(around:${Math.round(area.radius)},${area.lat.toFixed(5)},${area.lon.toFixed(5)})`;
  }
  const b = area.bounds;
  return `(${b.south.toFixed(5)},${b.west.toFixed(5)},${b.north.toFixed(5)},${b.east.toFixed(5)})`;
}

function buildSelector(filter: string, area: QueryArea) {
  const [key, val] = filter.split('=');
  const a = areaClause(area);
  return `node["${key}"="${val}"]${a};way["${key}"="${val}"]${a};`;
}

function buildQuery(options: {
  filters: string[];
  area: QueryArea;
  maxResults?: number;
}) {
  const clause = options.filters.map((f) => buildSelector(f, options.area)).join('');
  const limit = options.maxResults ? ` ${options.maxResults}` : '';
  return `[out:json][timeout:${TIMEOUT_SECONDS}];(${clause});out center bb${limit};`;
}

function resolveName(tags: Record<string, string> | undefined): string {
  if (!tags) return '';
  const named = tags['name:ar'] || tags.name || tags['name:en'] || tags.int_name || tags.brand || tags.operator || '';
  if (named.trim()) return named;
  if (tags.amenity === 'atm') return tags.brand || tags.operator || 'ATM';
  if (tags.amenity === 'bureau_de_change') return tags.brand || 'Döviz';
  if (tags.amenity === 'bank') return tags.brand || tags.operator || 'Bank';
  return '';
}

function resolveNameEn(tags: Record<string, string> | undefined): string {
  if (!tags) return '';
  return tags['name:en'] || tags.int_name || tags.name || tags.brand || '';
}

function resolveTags(tags: Record<string, string> | undefined): string[] {
  if (!tags) return [];
  const result: string[] = [];
  if (tags.cuisine) result.push(tags.cuisine);
  if (tags['diet:halal'] === 'yes') result.push('حلال');
  if (tags.wifi === 'yes' || tags['internet_access'] === 'wlan') result.push('واي فاي');
  if (tags['addr:street']) result.push(tags['addr:street']);
  if (tags.wheelchair === 'yes') result.push('دخول كراسي متحركة');
  return result.slice(0, 5);
}

function parseHours(hours: string): string {
  if (!hours) return '';
  if (hours.toLowerCase().includes('24/7') || hours === 'Mo-Su 00:00-24:00') return '24/7';
  return hours;
}

function getLatLon(el: OsmElement): { lat: number; lon: number } | null {
  if (el.type === 'relation') return null;
  const tags = el.tags || {};
  if (tags.natural === 'water' || tags.natural === 'bay' || tags.waterway || tags.place === 'sea') return null;
  const span = bboxSpanMeters(el.bounds);
  const largeFootprint = Boolean(tags.shop)
    || tags.amenity === 'marketplace'
    || tags.amenity === 'bank'
    || tags.office === 'telecommunication'
    || tags.tourism === 'hotel'
    || tags.tourism === 'resort'
    || tags.tourism === 'guest_house';
  if (span != null && span > (largeFootprint ? 900 : 280) && el.type !== 'node') return null;
  if (el.lat != null && el.lon != null) {
    const pin = sanitizePin(el.lat, el.lon);
    return pin ? { lat: pin.lat, lon: pin.lng } : null;
  }
  if (el.type === 'way' && el.center?.lat != null && el.center?.lon != null) {
    const pin = sanitizePin(el.center.lat, el.center.lon);
    return pin ? { lat: pin.lat, lon: pin.lng } : null;
  }
  return null;
}

function matchCategory(tags: Record<string, string> | undefined): FilterMatch | null {
  if (!tags) return null;
  const priority = [
    'amenity=hospital', 'amenity=pharmacy', 'tourism=hotel', 'tourism=resort', 'amenity=clinic',
    'amenity=restaurant', 'amenity=mosque', 'amenity=police', 'amenity=fuel',
    'shop=supermarket', 'tourism=museum', 'amenity=bank',
  ];
  for (const filter of priority) {
    const [key, val] = filter.split('=');
    if (tags[key] === val && FILTER_TO_CATEGORY[filter]) return FILTER_TO_CATEGORY[filter];
  }
  for (const [key, val] of Object.entries(tags)) {
    const hit = FILTER_TO_CATEGORY[`${key}=${val}`];
    if (hit) return hit;
  }
  return null;
}

function toListing(el: OsmElement, catDef: OverpassCategoryDef, label?: string): DirectoryListing | null {
  if (isCampusBlob(el) || !isPreciseVenuePin(el, catDef.category_key)) return null;
  const coord = getLatLon(el);
  if (!coord) return null;
  if (!osmTagsMatchCategory(el.tags, catDef.category_key)) return null;
  const leisure = el.tags?.leisure;
  if (leisure === 'park' || leisure === 'garden' || leisure === 'playground' || leisure === 'pitch') return null;
  const amenity = el.tags?.amenity;
  if (amenity === 'car_rental' && catDef.category_key !== 'transport') return null;
  if ((amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors' || el.tags?.healthcare === 'hospital') && catDef.category_key !== 'hospitals') return null;
  if ((el.tags?.shop === 'mall' || el.tags?.building === 'hospital' || el.tags?.building === 'retail') && catDef.category_key === 'fuel') return null;
  if (amenity === 'pharmacy' && catDef.category_key !== 'pharmacies') return null;
  if (el.tags?.tourism === 'hotel' && catDef.category_key !== 'hotels') return null;
  if (el.tags?.tourism === 'resort' && catDef.category_key !== 'hotels') return null;
  if (el.tags?.tourism === 'museum' || el.tags?.tourism === 'gallery') return null;
  const name = resolveName(el.tags);
  const nameEn = resolveNameEn(el.tags);
  if (!isAuthenticVenueName(name, catDef.category_key) && !isAuthenticVenueName(nameEn, catDef.category_key)) return null;
  if (!listingMatchesCategory({ category_key: catDef.category_key, name, description: el.tags?.description || '', name_en: nameEn }, catDef.category_key)) {
    return null;
  }

  const hours = parseHours(el.tags?.opening_hours || '');
  const rawPhone = el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['contact:mobile'] || '';
  const addrParts = [
    el.tags?.['addr:street'],
    el.tags?.['addr:housenumber'],
    el.tags?.['addr:city'],
    el.tags?.['addr:district'],
  ].filter(Boolean);
  const addrCity = el.tags?.['addr:city'] || '';
  const address = addrParts.join(' ');
  const verdict = validateCoordinates({
    lat: coord.lat,
    lng: coord.lon,
    city: addrCity,
    address,
    osmType: el.type,
    bboxSpanMeters: bboxSpanMeters(el.bounds),
    precisionHint: el.type === 'node' ? 'rooftop' : 'venue',
  });
  if (!verdict.ok) return null;
  const cityEn = inferTurkeyCityEn(verdict.lat, verdict.lng, addrCity);
  const stamped = lookupCity(cityEn) || lookupCity(addrCity);
  const city = stamped?.name || cityEn || addrCity;
  const phone = normalizeTurkeyEmergencyPhone(
    rawPhone,
    el.tags?.['addr:country'] || stamped?.country || '',
    city,
    catDef.category_key,
    address,
  );

  const media = osmMediaUrls(el.tags);
  const kind = catDef.category_key === 'hotels'
    ? resolvePlaceKind({
      category_key: 'hotels',
      name,
      description: nameEn,
      category_label: label,
      place_kind: el.tags?.tourism === 'resort' ? 'resort' : undefined,
    })
    : undefined;
  const finance = catDef.category_key === 'exchange'
    ? financialKind({
      subcategory: el.tags?.amenity,
      category_label: label,
      name,
      description: nameEn,
    })
    : null;
  const listing: DirectoryListing = {
    id: `osm-${el.type || 'n'}-${el.id}`,
    category_key: catDef.category_key,
    category_label: finance
      ? financialLabel(finance)
      : (kind ? placeKindLabel(kind) : (label || catDef.category_label)),
    name,
    description: nameEn && nameEn !== name ? nameEn : (el.tags?.description || ''),
    country_name: stamped?.country || el.tags?.['addr:country'] || '',
    city,
    address,
    image: media[0] || '',
    images: media,
    place_kind: kind,
    rating: 0,
    price_level: '',
    tags: [
      ...resolveTags(el.tags),
      ...(finance ? [financialLabel(finance)] : []),
    ].slice(0, 6),
    proximity_note: '',
    phone,
    hours,
    is_featured: false,
    sort_order: 0,
    lat: verdict.lat,
    lng: verdict.lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: `${verdict.lat.toFixed(7)},${verdict.lng.toFixed(7)}`,
  };
  listing.images = catDef.category_key === 'transport' ? transportGalleryFor(listing) : placeGallery(listing);
  listing.image = listing.images[0] || '';
  return normalizeFuelBakeryListing(listing);
}

function parseElements(elements: OsmElement[], forcedCat?: OverpassCategoryDef): DirectoryListing[] {
  const seenCoord = new Set<string>();
  const seenName = new Set<string>();
  const results: DirectoryListing[] = [];

  const ranked = [...elements].sort((a, b) => {
    const score = (el: OsmElement) => {
      if (el.type === 'relation' || isCampusBlob(el)) return 9;
      if (el.type === 'node' || (el.lat != null && el.lon != null && !el.center)) return 0;
      if (el.tags?.building === 'hospital' || el.tags?.building === 'clinic') return 1;
      if (el.tags?.building === 'yes' || el.tags?.building === 'civic') return 2;
      if (el.type === 'way') return 3;
      return 8;
    };
    return score(a) - score(b);
  });

  for (const el of ranked) {
    const coord = getLatLon(el);
    if (!coord) continue;
    const coordKey = `${coord.lat.toFixed(5)},${coord.lon.toFixed(5)}`;
    if (seenCoord.has(coordKey)) continue;

    const listing = forcedCat
      ? toListing(el, forcedCat)
      : (() => {
          const matched = matchCategory(el.tags);
          return matched ? toListing(el, matched.cat, matched.label) : null;
        })();
    if (!listing) continue;

    const nameKey = listing.category_key === 'telecom' || listing.category_key === 'exchange'
      ? `${listing.category_key}:${listing.name.toLowerCase()}:${listing.lat.toFixed(4)}:${listing.lng.toFixed(4)}`
      : `${listing.category_key}:${listing.name.toLowerCase()}`;
    if (seenName.has(nameKey)) continue;

    seenCoord.add(coordKey);
    seenName.add(nameKey);
    results.push(listing);
  }

  return results;
}

async function postOverpass(
  endpoint: string,
  query: string,
  timeoutMs: number,
  external?: AbortSignal,
): Promise<OsmElement[]> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  external?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (res.status === 429 || res.status === 504 || res.status >= 500) {
      throw new OverpassError('الخادم مشغول حالياً، حاول مرة أخرى', res.status);
    }
    if (!res.ok) {
      throw new OverpassError('تعذر جلب الأماكن من الخريطة', res.status);
    }
    const json = (await res.json()) as OsmResponse;
    return json.elements ?? [];
  } catch (err) {
    if (err instanceof OverpassError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new OverpassError('انتهت مهلة الاتصال بالخريطة', 408);
    }
    throw new OverpassError('تعذر الاتصال بخدمة الخريطة');
  } finally {
    window.clearTimeout(timer);
    external?.removeEventListener('abort', onAbort);
  }
}

async function runOverpass(query: string): Promise<OsmElement[]> {
  const timeoutMs = TIMEOUT_SECONDS * 1000;
  const endpoints = [PRIMARY_ENDPOINT, ...FALLBACK_ENDPOINTS];
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      return await postOverpass(endpoint, query, timeoutMs);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new OverpassError('تعذر الاتصال بخدمة الخريطة');
}

async function queryAndParse(
  key: string,
  query: string,
  forcedCat?: OverpassCategoryDef,
): Promise<DirectoryListing[]> {
  const cached = cacheGet(key);
  if (cached) return cached;
  const elements = await runOverpass(query);
  const parsed = parseElements(elements, forcedCat);
  if (parsed.length > 0) cacheSet(key, parsed);
  return parsed;
}

function areaCacheParts(area: QueryArea): Record<string, string | number | undefined> {
  if (area.kind === 'around') {
    return {
      mode: 'around',
      lat: roundCoord(area.lat),
      lon: roundCoord(area.lon),
      r: Math.round(area.radius / 250) * 250,
    };
  }
  return {
    mode: 'bbox',
    s: roundCoord(area.bounds.south),
    w: roundCoord(area.bounds.west),
    n: roundCoord(area.bounds.north),
    e: roundCoord(area.bounds.east),
  };
}

function keepRequested(place: DirectoryListing, uniqueCats: string[]) {
  if (uniqueCats.includes(place.category_key)) return true;
  if (place.category_key === 'police' && uniqueCats.includes('embassy')) return true;
  return false;
}

async function fetchCombined(
  area: QueryArea,
  categories: string[],
  maxResults: number,
): Promise<DirectoryListing[]> {
  const uniqueCats = Array.from(new Set(categories)).filter((key) => CATEGORY_TO_OSM[key]);
  if (uniqueCats.length === 0) return [];
  const filters = compactFiltersFor(uniqueCats);
  if (filters.length === 0) return [];
  const key = cacheKey({ ...areaCacheParts(area), cats: uniqueCats.slice().sort().join(','), combined: 1, pin: 3 });
  try {
    const query = buildQuery({ filters, area, maxResults });
    const parsed = await queryAndParse(key, query);
    return parsed.filter((place) => keepRequested(place, uniqueCats));
  } catch {
    return [];
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function fetchByArea(
  area: QueryArea,
  categories: string[],
  maxResults = 250,
): Promise<DirectoryListing[]> {
  const uniqueCats = Array.from(new Set(categories)).filter((key) => CATEGORY_TO_OSM[key]);
  if (uniqueCats.length === 0) return [];
  if (uniqueCats.length === 1) {
    const cat = uniqueCats[0];
    const cap = Math.max(maxResults, PER_CATEGORY_LIMIT[cat] ?? MIN_PER_CATEGORY);
    return fetchCombined(area, uniqueCats, cap);
  }
  const batches = await mapPool(uniqueCats, FETCH_CONCURRENCY, async (cat) => {
    const cap = Math.max(PER_CATEGORY_LIMIT[cat] ?? MIN_PER_CATEGORY, MIN_PER_CATEGORY);
    return fetchCombined(area, [cat], cap);
  });
  const merged: DirectoryListing[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const place of batch) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      merged.push(place);
    }
  }
  return merged;
}

export async function fetchPlacesFromOverpass(
  lat: number,
  lon: number,
  category: string,
  radiusMeters: number = DEFAULT_RADIUS_METERS,
): Promise<DirectoryListing[]> {
  return fetchByArea({ kind: 'around', lat, lon, radius: radiusMeters }, [category], PER_CATEGORY_LIMIT[category] ?? 120);
}

export async function fetchAllCategoriesFromOverpass(
  lat: number,
  lon: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS,
): Promise<DirectoryListing[]> {
  return fetchByArea(
    { kind: 'around', lat, lon, radius: radiusMeters },
    Object.keys(CATEGORY_TO_OSM).slice(0, 6),
    120,
  );
}

export async function fetchPlacesInBounds(
  bounds: MapBounds,
  categories: string[],
  maxResults = 500,
): Promise<DirectoryListing[]> {
  const clean = sanitizeBounds(bounds);
  if (!clean) return [];
  return fetchByArea({ kind: 'bbox', bounds: clean }, categories, maxResults);
}

export async function fetchPlacesForMap(options: {
  bounds?: MapBounds | null;
  origin?: { lat: number; lng: number } | null;
  categories: string[];
  radiusMeters?: number;
}): Promise<DirectoryListing[]> {
  const requested = Array.from(new Set(options.categories)).filter((key) => CATEGORY_TO_OSM[key]);
  if (requested.includes('embassy') && !requested.includes('police')) requested.push('police');
  const cats = requested.slice(0, 16).sort((a, b) => {
    const rank = (key: string) => (
      key === 'pharmacies' ? 0
        : key === 'hospitals' ? 1
          : key === 'hotels' ? 2
            : key === 'restaurants' ? 3
              : key === 'telecom' ? 4
              : key === 'exchange' ? 5
              : 8
    );
    return rank(a) - rank(b);
  });
  if (cats.length === 0) return [];

  const origin = options.origin && Number.isFinite(options.origin.lat) && Number.isFinite(options.origin.lng)
    ? options.origin
    : null;
  const bounds = sanitizeBounds(options.bounds ?? null);
  const radius = options.radiusMeters ?? DEFAULT_RADIUS_METERS;

  const merged: DirectoryListing[] = [];
  const seen = new Set<string>();
  const push = (places: DirectoryListing[]) => {
    for (const place of places) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      merged.push(place);
    }
  };

  if (origin) {
    push(await fetchByArea({ kind: 'around', lat: origin.lat, lon: origin.lng, radius }, cats));
  }
  if (bounds) {
    push(await fetchByArea({ kind: 'bbox', bounds }, cats));
  }
  return merged;
}

export const OVERPASS_CATEGORIES = Object.keys(CATEGORY_TO_OSM);
export { CATEGORY_TO_OSM, DEFAULT_RADIUS_METERS };
