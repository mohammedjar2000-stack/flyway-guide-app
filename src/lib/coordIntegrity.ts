/** Shared POI coordinate validation — no app aliases; imported by the GIS server too. */

export type CoordPrecision = 'rooftop' | 'venue' | 'street' | 'locality' | 'unknown';

export interface GeoBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface CoordInput {
  lat: number;
  lng: number;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  precisionHint?: CoordPrecision | null;
  bboxSpanMeters?: number | null;
  osmType?: string | null;
  resultType?: string | null;
  confidence?: number | null;
}

export interface CoordVerdict {
  ok: boolean;
  lat: number;
  lng: number;
  precision: CoordPrecision;
  verified: boolean;
  reasons: string[];
}

type WaterBox = GeoBounds;

const CITY_LAND: Record<string, { center: { lat: number; lng: number }; bbox: GeoBounds }> = {
  istanbul: {
    center: { lat: 41.0082, lng: 28.9784 },
    bbox: { south: 40.80, west: 28.00, north: 41.36, east: 29.70 },
  },
  ankara: {
    center: { lat: 39.9334, lng: 32.8597 },
    bbox: { south: 39.72, west: 32.48, north: 40.22, east: 33.08 },
  },
  izmir: {
    center: { lat: 38.4237, lng: 27.1428 },
    bbox: { south: 38.32, west: 26.88, north: 38.58, east: 27.32 },
  },
  antalya: {
    center: { lat: 36.8969, lng: 30.7133 },
    bbox: { south: 36.72, west: 30.40, north: 37.06, east: 31.45 },
  },
  dubai: {
    center: { lat: 25.2048, lng: 55.2708 },
    bbox: { south: 24.85, west: 54.9, north: 25.4, east: 55.6 },
  },
  trabzon: {
    center: { lat: 41.0027, lng: 39.7168 },
    bbox: { south: 40.55, west: 39.20, north: 41.12, east: 40.42 },
  },
  bursa: {
    center: { lat: 40.1885, lng: 29.061 },
    bbox: { south: 40.10, west: 28.78, north: 40.38, east: 29.28 },
  },
  bodrum: {
    center: { lat: 37.0344, lng: 27.4305 },
    bbox: { south: 36.98, west: 27.25, north: 37.28, east: 27.80 },
  },
  nevsehir: {
    center: { lat: 38.6244, lng: 34.7239 },
    bbox: { south: 38.50, west: 34.50, north: 38.80, east: 35.02 },
  },
  gaziantep: {
    center: { lat: 37.0662, lng: 37.3781 },
    bbox: { south: 36.95, west: 37.22, north: 37.16, east: 37.52 },
  },
  adana: {
    center: { lat: 37.0, lng: 35.3213 },
    bbox: { south: 36.90, west: 35.20, north: 37.10, east: 35.48 },
  },
  konya: {
    center: { lat: 37.8746, lng: 32.4932 },
    bbox: { south: 37.78, west: 32.36, north: 38.00, east: 32.64 },
  },
  alanya: {
    center: { lat: 36.5444, lng: 31.9954 },
    bbox: { south: 36.50, west: 31.90, north: 36.62, east: 32.10 },
  },
  samsun: {
    center: { lat: 41.2867, lng: 36.33 },
    bbox: { south: 41.22, west: 36.22, north: 41.36, east: 36.48 },
  },
  mersin: {
    center: { lat: 36.8121, lng: 34.6415 },
    bbox: { south: 36.72, west: 34.50, north: 36.88, east: 34.76 },
  },
  kayseri: {
    center: { lat: 38.7312, lng: 35.4787 },
    bbox: { south: 38.64, west: 35.36, north: 38.82, east: 35.60 },
  },
  eskisehir: {
    center: { lat: 39.7767, lng: 30.5206 },
    bbox: { south: 39.70, west: 30.42, north: 39.86, east: 30.64 },
  },
  van: {
    center: { lat: 38.4891, lng: 43.4089 },
    bbox: { south: 38.42, west: 43.28, north: 38.58, east: 43.48 },
  },
  diyarbakir: {
    center: { lat: 37.9144, lng: 40.2306 },
    bbox: { south: 37.85, west: 40.10, north: 37.98, east: 40.32 },
  },
  fethiye: {
    center: { lat: 36.6592, lng: 29.127 },
    bbox: { south: 36.62, west: 28.74, north: 36.78, east: 29.22 },
  },
  mugla: {
    center: { lat: 37.2153, lng: 28.3636 },
    bbox: { south: 37.02, west: 27.25, north: 37.30, east: 28.50 },
  },
  hatay: {
    center: { lat: 36.2023, lng: 36.1613 },
    bbox: { south: 36.14, west: 36.08, north: 36.28, east: 36.24 },
  },
  malatya: {
    center: { lat: 38.3552, lng: 38.3095 },
    bbox: { south: 38.28, west: 38.22, north: 38.42, east: 38.40 },
  },
  edirne: {
    center: { lat: 41.6771, lng: 26.5557 },
    bbox: { south: 41.64, west: 26.48, north: 41.72, east: 26.64 },
  },
  denizli: {
    center: { lat: 37.7765, lng: 29.0864 },
    bbox: { south: 37.72, west: 29.02, north: 37.84, east: 29.18 },
  },
};

const CITY_ALIASES: Record<string, string> = {
  istanbul: 'istanbul',
  i̇stanbul: 'istanbul',
  إسطنبول: 'istanbul',
  konstantiniyye: 'istanbul',
  ankara: 'ankara',
  أنقرة: 'ankara',
  izmir: 'izmir',
  إزمير: 'izmir',
  antalya: 'antalya',
  أنطاليا: 'antalya',
  dubai: 'dubai',
  دبي: 'dubai',
  trabzon: 'trabzon',
  ترابزون: 'trabzon',
  طرابزون: 'trabzon',
  bursa: 'bursa',
  بورصة: 'bursa',
  bodrum: 'bodrum',
  بودروم: 'bodrum',
  nevsehir: 'nevsehir',
  nevşehir: 'nevsehir',
  نوشهر: 'nevsehir',
  cappadocia: 'nevsehir',
  kapadokya: 'nevsehir',
  كبادوكيا: 'nevsehir',
  goreme: 'nevsehir',
  gaziantep: 'gaziantep',
  غازيعنتاب: 'gaziantep',
  adana: 'adana',
  أضنة: 'adana',
  konya: 'konya',
  قونية: 'konya',
  alanya: 'alanya',
  ألانية: 'alanya',
  samsun: 'samsun',
  سامسون: 'samsun',
  mersin: 'mersin',
  مرسين: 'mersin',
  kayseri: 'kayseri',
  قيصري: 'kayseri',
  eskisehir: 'eskisehir',
  van: 'van',
  وان: 'van',
  diyarbakir: 'diyarbakir',
  fethiye: 'fethiye',
  فتحية: 'fethiye',
  mugla: 'mugla',
  muğla: 'mugla',
  موغلا: 'mugla',
  hatay: 'hatay',
  هاتاي: 'hatay',
  malatya: 'malatya',
  ملطية: 'malatya',
  edirne: 'edirne',
  أدرنة: 'edirne',
  denizli: 'denizli',
  دنيزلي: 'denizli',
  konak: 'izmir',
  bornova: 'izmir',
  karsiyaka: 'izmir',
  karşıyaka: 'izmir',
  buca: 'izmir',
  cigli: 'izmir',
  çiğli: 'izmir',
  bayrakli: 'izmir',
  gaziemir: 'izmir',
  balcova: 'izmir',
  narlidere: 'izmir',
  karabaglar: 'izmir',
  alsancak: 'izmir',
  kepez: 'antalya',
  muratpasa: 'antalya',
  muratpaşa: 'antalya',
  konyaalti: 'antalya',
  konyaaltı: 'antalya',
  lara: 'antalya',
  kaleici: 'antalya',
  kaleiçi: 'antalya',
  aksu: 'antalya',
  dosemealti: 'antalya',
  dösemealtı: 'antalya',
  ortahisar: 'trabzon',
  akcaabat: 'trabzon',
  akçaabat: 'trabzon',
  yomra: 'trabzon',
  kizilay: 'ankara',
  kızılay: 'ankara',
  cankaya: 'ankara',
  çankaya: 'ankara',
  kecioren: 'ankara',
  keçiören: 'ankara',
  yenimahalle: 'ankara',
  mamak: 'ankara',
  altindag: 'ankara',
  altındağ: 'ankara',
  etimesgut: 'ankara',
  sincan: 'ankara',
  golbasi: 'ankara',
  gölbaşı: 'ankara',
  pursaklar: 'ankara',
  batikent: 'ankara',
  osmangazi: 'bursa',
  nilufer: 'bursa',
  nilüfer: 'bursa',
  yildirim: 'bursa',
  yıldırım: 'bursa',
  mudanya: 'bursa',
  gursu: 'bursa',
};

const CITY_EN_LABEL: Record<string, string> = {
  istanbul: 'Istanbul',
  ankara: 'Ankara',
  izmir: 'Izmir',
  antalya: 'Antalya',
  trabzon: 'Trabzon',
  bursa: 'Bursa',
  dubai: 'Dubai',
  bodrum: 'Bodrum',
  nevsehir: 'Nevsehir',
  gaziantep: 'Gaziantep',
  adana: 'Adana',
  konya: 'Konya',
  alanya: 'Alanya',
  samsun: 'Samsun',
  mersin: 'Mersin',
  kayseri: 'Kayseri',
  eskisehir: 'Eskisehir',
  van: 'Van',
  diyarbakir: 'Diyarbakir',
  fethiye: 'Fethiye',
  mugla: 'Mugla',
  hatay: 'Hatay',
  malatya: 'Malatya',
  edirne: 'Edirne',
  denizli: 'Denizli',
};

/** Conservative interiors of Istanbul water — inset from the shores so waterfront venues stay valid. */
const ISTANBUL_WATER: WaterBox[] = [
  { south: 41.17, west: 29.068, north: 41.235, east: 29.105 },
  { south: 41.12, west: 29.055, north: 41.17, east: 29.092 },
  { south: 41.082, west: 29.042, north: 41.12, east: 29.078 },
  { south: 41.056, west: 29.03, north: 41.082, east: 29.06 },
  { south: 41.04, west: 29.02, north: 41.056, east: 29.048 },
  { south: 41.018, west: 29.0088, north: 41.038, east: 29.0136 },
  { south: 41.0194, west: 29.0032, north: 41.0228, east: 29.0084 },
  { south: 40.99, west: 29.005, north: 41.017, east: 29.016 },
  { south: 41.022, west: 28.936, north: 41.055, east: 28.971 },
  { south: 40.80, west: 28.52, north: 40.875, east: 29.10 },
  { south: 40.945, west: 28.9, north: 40.997, east: 28.985 },
  { south: 40.9, west: 29.02, north: 40.961, east: 29.16 },
];

const DUBAI_WATER: WaterBox[] = [
  { south: 25.22, west: 55.27, north: 25.3, east: 55.34 },
  { south: 25.08, west: 54.9, north: 25.18, east: 55.08 },
];

const IZMIR_WATER: WaterBox[] = [
  { south: 38.400, west: 27.100, north: 38.422, east: 27.128 },
];

const ANTALYA_WATER: WaterBox[] = [
  { south: 36.820, west: 30.600, north: 36.868, east: 30.700 },
];

const TRABZON_WATER: WaterBox[] = [
  { south: 41.018, west: 39.620, north: 41.080, east: 39.860 },
];

const BODRUM_WATER: WaterBox[] = [
  { south: 36.990, west: 27.380, north: 37.020, east: 27.460 },
];

const VAN_WATER: WaterBox[] = [
  { south: 38.300, west: 42.700, north: 38.900, east: 43.260 },
];

const WATER_BY_CITY: Record<string, WaterBox[]> = {
  istanbul: ISTANBUL_WATER,
  dubai: DUBAI_WATER,
  izmir: IZMIR_WATER,
  antalya: ANTALYA_WATER,
  trabzon: TRABZON_WATER,
  bodrum: BODRUM_WATER,
  van: VAN_WATER,
};

const LOCALITY_TYPES = new Set([
  'suburb', 'city', 'county', 'state', 'country', 'postcode', 'district', 'neighbourhood', 'neighborhood', 'locality',
]);

const GENERIC_CENTER_METERS = 12;
const STREET_MAX_SPAN_M = 160;
const LOCALITY_SPAN_M = 280;
const VENUE_FOOTPRINT_M = 900;

function normalizeKey(value?: string | null): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '')
    .trim();
}

export function cityIntegrityKey(city?: string | null, country?: string | null): string | null {
  const cityKey = CITY_ALIASES[normalizeKey(city)] || CITY_ALIASES[normalizeKey(country || '')];
  if (cityKey) return cityKey;
  const raw = normalizeKey(city);
  if (raw && CITY_LAND[raw]) return raw;
  return null;
}

export function cityLandBbox(cityKey: string): GeoBounds | null {
  const land = CITY_LAND[cityKey];
  return land ? { ...land.bbox } : null;
}

export function coordsInCityLand(lat: number, lng: number, cityKey: string): boolean {
  const land = CITY_LAND[cityKey];
  if (!land) return false;
  if (!inBox(lat, lng, land.bbox)) return false;
  if (isOpenWater(lat, lng, cityKey)) return false;
  return true;
}

export function inferCityLandKey(lat: number, lng: number): string | null {
  for (const [key, land] of Object.entries(CITY_LAND)) {
    if (inBox(lat, lng, land.bbox) && !isOpenWater(lat, lng, key)) return key;
  }
  return null;
}

/** English metro name from coordinates. Never defaults to Istanbul unless the pin is inside Istanbul land. */
export function inferTurkeyCityEn(lat: number, lng: number, tagged?: string | null): string {
  const landKey = inferCityLandKey(lat, lng);
  if (landKey) return CITY_EN_LABEL[landKey] || landKey;
  const taggedKey = cityIntegrityKey(tagged);
  if (taggedKey && CITY_EN_LABEL[taggedKey]) return CITY_EN_LABEL[taggedKey];
  return String(tagged || '').trim();
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bboxSpanMeters(bounds?: { minlat?: number; minlon?: number; maxlat?: number; maxlon?: number } | null): number | null {
  if (!bounds) return null;
  const south = Number(bounds.minlat);
  const west = Number(bounds.minlon);
  const north = Number(bounds.maxlat);
  const east = Number(bounds.maxlon);
  if (![south, west, north, east].every(Number.isFinite)) return null;
  return haversineMeters(south, west, north, east);
}

function inBox(lat: number, lng: number, box: GeoBounds): boolean {
  return lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east;
}

function decimalPlaces(value: number): number {
  const text = String(value);
  const idx = text.indexOf('.');
  if (idx < 0) return 0;
  return text.length - idx - 1;
}

function inferPrecision(input: CoordInput): CoordPrecision {
  if (input.precisionHint) return input.precisionHint;
  if (input.osmType === 'node') return 'rooftop';
  if (input.resultType === 'amenity' || input.resultType === 'building') return 'rooftop';
  if (input.resultType && LOCALITY_TYPES.has(input.resultType)) return 'locality';
  const span = input.bboxSpanMeters;
  if (span != null) {
    if (span <= 55) return 'rooftop';
    if (span <= STREET_MAX_SPAN_M) return 'venue';
    if (span <= LOCALITY_SPAN_M) return 'street';
    return 'locality';
  }
  const places = Math.min(decimalPlaces(input.lat), decimalPlaces(input.lng));
  if (places >= 5) return 'venue';
  if (places >= 3) return 'street';
  return 'locality';
}

function hasStreetAddress(address?: string | null): boolean {
  const text = String(address || '').trim();
  if (text.length < 8) return false;
  return /\d/.test(text) || /cadde|sokak|street|road|avenue|شارع|جادة/i.test(text);
}

export function isOpenWater(lat: number, lng: number, cityKey?: string | null): boolean {
  const key = cityKey || null;
  const boxes = key ? WATER_BY_CITY[key] : undefined;
  if (boxes?.some((box) => inBox(lat, lng, box))) return true;
  return false;
}

export function validateCoordinates(input: CoordInput): CoordVerdict {
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const reasons: string[] = [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, lat, lng, precision: 'unknown', verified: false, reasons: ['non-finite'] };
  }
  if (lat === 0 && lng === 0) {
    return { ok: false, lat, lng, precision: 'unknown', verified: false, reasons: ['null-island'] };
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, lat, lng, precision: 'unknown', verified: false, reasons: ['out-of-range'] };
  }

  const rounded = { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  let cityKey = cityIntegrityKey(input.city, input.country);
  if (!cityKey) {
    for (const [key, land] of Object.entries(CITY_LAND)) {
      if (inBox(rounded.lat, rounded.lng, land.bbox)) {
        cityKey = key;
        break;
      }
    }
  }
  const land = cityKey ? CITY_LAND[cityKey] : null;
  if (land && !inBox(rounded.lat, rounded.lng, land.bbox)) {
    reasons.push('outside-city-bbox');
  }
  if (land && haversineMeters(rounded.lat, rounded.lng, land.center.lat, land.center.lng) < GENERIC_CENTER_METERS) {
    if (!hasStreetAddress(input.address)) reasons.push('generic-city-centroid');
  }
  if (isOpenWater(rounded.lat, rounded.lng, cityKey)) {
    reasons.push('open-water');
  }
  if (input.resultType && LOCALITY_TYPES.has(String(input.resultType))) {
    reasons.push('locality-geometry');
  }
  if (input.confidence != null && Number.isFinite(input.confidence) && input.confidence < 0.4) {
    reasons.push('low-confidence');
  }
  const spanCap = (input.precisionHint === 'rooftop' || input.precisionHint === 'venue')
    ? VENUE_FOOTPRINT_M
    : LOCALITY_SPAN_M;
  if (input.bboxSpanMeters != null && input.bboxSpanMeters > spanCap) {
    reasons.push('polygon-centroid');
  }
  if (input.osmType === 'relation') {
    reasons.push('relation-centroid');
  }

  const precision = inferPrecision({ ...input, lat: rounded.lat, lng: rounded.lng });
  if (precision === 'locality') reasons.push('imprecise-locality');

  const fatal = reasons.some((reason) => (
    reason === 'outside-city-bbox'
    || reason === 'generic-city-centroid'
    || reason === 'open-water'
    || reason === 'locality-geometry'
    || reason === 'polygon-centroid'
    || reason === 'relation-centroid'
    || reason === 'imprecise-locality'
  ));

  const verified = !fatal && (precision === 'rooftop' || precision === 'venue');
  return {
    ok: !fatal,
    lat: rounded.lat,
    lng: rounded.lng,
    precision,
    verified,
    reasons,
  };
}

export function roundPin(lat: number, lng: number): { lat: number; lng: number } | null {
  const verdict = validateCoordinates({ lat, lng });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
  return { lat: verdict.lat, lng: verdict.lng };
}
