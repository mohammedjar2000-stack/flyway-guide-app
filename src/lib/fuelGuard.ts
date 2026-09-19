import { haversineMeters } from '@/lib/coordIntegrity';
import { ISTANBUL_HOSPITAL_SEEDS } from '@/lib/istanbulCivicSeeds';
import { TURKEY_PROVINCE_SEEDS } from '@/lib/turkeyProvinceSeeds';

/** Medical, mall, and pedestrian sites that must never appear as وقود. */
export const FORBIDDEN_FUEL_VENUE_RE =
  /hastane|hastanesi|hospital|hastane\b|acil(\s|$)|acil\s*servis|poliklinik|policlinic|clinic|tıbbi|tibbi|medical\s*park|medikal\s*park|memorial|medstar|\bliv\b|anadolu\s*hastane|shemall|şe?mall|\bavm\b|alışveriş|alisveris|\bmall\b|shopping\s*(center|mall)|terra\s*city|markantalya|yaya\s*bölge|pedestrian|karakol|polis\s*merkez|emniyet|مستشفى|عيادة|طوارئ|مول\b|مركز\s*تسوق|كركول|شرطة/i;

const MALL_VENUE_RE = /shemall|şe?mall|\bavm\b|\bmall\b|shopping|terra\s*city|markantalya|مول|مركز\s*تسوق/i;
const MEDICAL_VENUE_RE = /hastane|hospital|acil|poliklinik|clinic|medical\s*park|memorial|medstar|مستشفى|عيادة|طوارئ/i;

interface KeepOut {
  lat: number;
  lng: number;
  radiusM: number;
}

const EXTRA_KEEP_OUT: KeepOut[] = [
  { lat: 36.91090, lng: 30.71360, radiusM: 180 }, // Shemall AVM / Memorial-Acil, Kepez
  { lat: 36.90840, lng: 30.71380, radiusM: 180 }, // Memorial Antalya Hospital
  { lat: 36.88720, lng: 30.70210, radiusM: 140 }, // MarkAntalya AVM
  { lat: 36.86680, lng: 30.72650, radiusM: 120 }, // TerraCity
  { lat: 36.91520, lng: 30.69540, radiusM: 160 }, // Kepez State Hospital
  { lat: 36.85520, lng: 30.73740, radiusM: 150 }, // Medical Park Lara
  { lat: 36.85480, lng: 30.73620, radiusM: 120 }, // Liv Antalya
  { lat: 36.88780, lng: 30.70560, radiusM: 140 }, // Antalya Training Hospital
];

let cachedZones: KeepOut[] | null = null;

function footprints(): KeepOut[] {
  if (cachedZones) return cachedZones;
  const zones: KeepOut[] = EXTRA_KEEP_OUT.slice();
  for (const seed of ISTANBUL_HOSPITAL_SEEDS) {
    zones.push({ lat: seed.lat, lng: seed.lng, radiusM: 150 });
  }
  for (const list of Object.values(TURKEY_PROVINCE_SEEDS)) {
    for (const seed of list) {
      if (seed.category_key === 'hospitals') zones.push({ lat: seed.lat, lng: seed.lng, radiusM: 160 });
      else if (seed.category_key === 'police') zones.push({ lat: seed.lat, lng: seed.lng, radiusM: 70 });
    }
  }
  cachedZones = zones;
  return zones;
}

export function isForbiddenFuelVenue(hay: string): boolean {
  return FORBIDDEN_FUEL_VENUE_RE.test(hay);
}

export function isMedicalVenueName(hay: string): boolean {
  return MEDICAL_VENUE_RE.test(hay);
}

export function isMallVenueName(hay: string): boolean {
  return MALL_VENUE_RE.test(hay);
}

export function fuelKeepOutHit(lat: number, lng: number): KeepOut | null {
  for (const zone of footprints()) {
    if (haversineMeters(lat, lng, zone.lat, zone.lng) <= zone.radiusM) return zone;
  }
  return null;
}

export function isFuelCoordinateClean(lat: number, lng: number): boolean {
  return fuelKeepOutHit(lat, lng) == null;
}
