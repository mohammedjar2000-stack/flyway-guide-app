import type { DirectoryListing } from '@/types';

export function sanitizePin(lat: number, lng: number): { lat: number; lng: number } | null {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la === 0 && ln === 0) return null;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  return { lat: Number(la.toFixed(7)), lng: Number(ln.toFixed(7)) };
}

export function pinQuery(lat: number, lng: number): string | null {
  const pin = sanitizePin(lat, lng);
  if (!pin) return null;
  return `${pin.lat},${pin.lng}`;
}

const HOSPITAL_TAGS = new Set(['hospital', 'clinic']);
const HOSPITAL_HEALTHCARE = new Set(['hospital', 'clinic']);

const FORBIDDEN_HOSPITAL_AMENITY = new Set([
  'university', 'college', 'arts_centre', 'library', 'theatre', 'cinema',
  'museum', 'place_of_worship', 'cafe', 'restaurant', 'fast_food', 'bar',
  'pub', 'hotel', 'marketplace', 'parking',
]);

const FORBIDDEN_TOURISM = new Set(['museum', 'gallery', 'artwork', 'theme_park', 'zoo', 'attraction']);
const FORBIDDEN_LEISURE = new Set(['park', 'garden', 'playground', 'pitch', 'stadium']);

const HOSPITAL_NAME_BAN = /museum|müze|muze|gallery|galeri|park\b|mall\b|mosque|cami\b|hotel|otel\b|university campus|faculty of arts|faculty of science|faculty of engineering|كلية الآداب|كلية العلوم|كلية الهندسة/i;
const FACULTY_WITHOUT_HOSPITAL = /faculty|fakülte|كلية/i;

export function osmTagsMatchCategory(tags: Record<string, string> | undefined, categoryKey: string): boolean {
  if (!tags) return false;
  const amenity = tags.amenity || '';
  const tourism = tags.tourism || '';
  const leisure = tags.leisure || '';
  const shop = tags.shop || '';
  const historic = tags.historic || '';
  const landuse = tags.landuse || '';
  const healthcare = tags.healthcare || '';

  if (categoryKey === 'hospitals') {
    const medical = HOSPITAL_TAGS.has(amenity) || HOSPITAL_HEALTHCARE.has(healthcare);
    if (!medical) return false;
    if (FORBIDDEN_HOSPITAL_AMENITY.has(amenity) && amenity !== 'hospital' && amenity !== 'clinic' && amenity !== 'doctors') return false;
    if (FORBIDDEN_TOURISM.has(tourism)) return false;
    if (FORBIDDEN_LEISURE.has(leisure)) return false;
    if (historic === 'monument' || historic === 'castle' || historic === 'archaeological_site') return false;
    if (landuse === 'university' && amenity !== 'hospital' && amenity !== 'clinic') return false;
    if (landuse === 'retail' || landuse === 'recreation_ground') return false;
    if (shop && shop !== 'medical_supply' && shop !== 'chemist') return false;
    return true;
  }

  if (categoryKey === 'pharmacies') return amenity === 'pharmacy' || shop === 'chemist';
  if (categoryKey === 'hotels') return tourism === 'hotel' || tourism === 'guest_house' || tourism === 'hostel' || tourism === 'apartment' || tourism === 'resort';
  if (categoryKey === 'mosques') return amenity === 'mosque' || tags.religion === 'muslim';
  if (categoryKey === 'police') return amenity === 'police';
  if (categoryKey === 'attractions') {
    if (HOSPITAL_TAGS.has(amenity) || amenity === 'pharmacy') return false;
    return Boolean(tourism || historic);
  }
  return true;
}

const HOSPITAL_STRICT = /hospital|hastane|hastanesi|مستشفى|عيادة|clinic|طوارئ|acil|polyclinic/i;

export function listingMatchesCategory(
  place: Pick<DirectoryListing, 'category_key' | 'name' | 'description'> & { name_en?: string },
  categoryKey = place.category_key,
): boolean {
  const hay = [place.name, place.description, place.name_en].filter(Boolean).join(' ');

  if (categoryKey === 'hospitals') {
    if (HOSPITAL_NAME_BAN.test(hay) && !HOSPITAL_STRICT.test(hay)) return false;
    if (FACULTY_WITHOUT_HOSPITAL.test(hay) && !HOSPITAL_STRICT.test(hay)) return false;
    return true;
  }

  if (categoryKey === 'pharmacies') {
    if (/museum|müze|hospital|hastane|mosque/i.test(hay) && !/pharmacy|eczane|صيدل/i.test(hay)) return false;
    return true;
  }

  return true;
}

export function isCampusBlob(el: { type?: string; tags?: Record<string, string> }): boolean {
  if (el.type === 'relation') return true;
  const t = el.tags || {};
  if (t.type === 'site' || t.type === 'campus' || t.site === 'university') return true;
  if (t.landuse === 'university' || t.amenity === 'university' || t.amenity === 'college') return true;
  return false;
}

export function isPreciseVenuePin(el: { type?: string; tags?: Record<string, string> }, categoryKey: string): boolean {
  if (isCampusBlob(el)) return false;
  if (el.type === 'node') return true;
  const t = el.tags || {};
  const hay = `${t.name || ''} ${t['name:en'] || ''} ${t['name:ar'] || ''}`;
  if (categoryKey === 'hospitals') {
    if (FACULTY_WITHOUT_HOSPITAL.test(hay) && !HOSPITAL_STRICT.test(hay)) return false;
    if (/campus|kampüs|university campus|kampus/i.test(hay)) return false;
    if (t.entrance === 'main' || t.entrance === 'yes') return true;
    if (t.building === 'hospital' || t.building === 'clinic' || t.building === 'yes' || t.building === 'civic' || t.building === 'commercial') {
      return true;
    }
    return false;
  }
  return el.type !== 'relation';
}

export function pinListing(place: DirectoryListing): DirectoryListing | null {
  const pin = sanitizePin(place.lat, place.lng);
  if (!pin) return null;
  if (!listingMatchesCategory(place, place.category_key)) return null;
  return { ...place, lat: pin.lat, lng: pin.lng };
}
