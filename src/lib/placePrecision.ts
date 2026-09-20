import type { DirectoryListing } from '@/types';
import { validateCoordinates } from '@/lib/coordIntegrity';
import { isForbiddenFuelVenue, isFuelCoordinateClean } from '@/lib/fuelGuard';
import { isCuratedTurkeyFuelPin } from '@/lib/turkeyFuelStations';
import { isCuratedTurkeyPin, isTurkeyCatalogCoordinate } from '@/lib/turkeyCuratedGuard';

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
  if (categoryKey === 'markets') {
    return amenity === 'marketplace'
      || shop === 'supermarket'
      || shop === 'mall'
      || shop === 'convenience'
      || shop === 'department_store'
      || shop === 'marketplace'
      || shop === 'wholesale'
      || shop === 'general';
  }
  if (categoryKey === 'hotels') return tourism === 'hotel' || tourism === 'guest_house' || tourism === 'hostel' || tourism === 'apartment' || tourism === 'resort';
  if (categoryKey === 'telecom') {
    const office = tags.office || '';
    const brandHay = `${tags.name || ''} ${tags.brand || ''} ${tags.operator || ''}`;
    return shop === 'mobile_phone'
      || shop === 'telecommunication'
      || office === 'telecommunication'
      || /turkcell|vodafone|telekom|tt\s?mobil|esim|e-sim|cep telefon/i.test(brandHay);
  }
  if (categoryKey === 'exchange') {
    return amenity === 'bank' || amenity === 'bureau_de_change' || amenity === 'atm';
  }
  if (categoryKey === 'mosques') return amenity === 'mosque' || tags.religion === 'muslim';
  if (categoryKey === 'police') return amenity === 'police';
  if (categoryKey === 'fuel') {
    if (!(amenity === 'fuel' || shop === 'fuel')) return false;
    if (HOSPITAL_TAGS.has(amenity) || HOSPITAL_HEALTHCARE.has(healthcare)) return false;
    if (shop === 'mall' || amenity === 'marketplace' || amenity === 'hospital' || amenity === 'clinic') return false;
    if (tourism === 'hotel' || tourism === 'mall') return false;
    const hay = `${tags.name || ''} ${tags['name:en'] || ''} ${tags['name:ar'] || ''} ${tags.brand || ''} ${tags.operator || ''}`;
    if (isForbiddenFuelVenue(hay)) return false;
    return true;
  }
  if (categoryKey === 'bakeries') {
    return shop === 'bakery'
      || shop === 'pastry'
      || shop === 'supermarket'
      || shop === 'convenience'
      || shop === 'greengrocer'
      || shop === 'butcher';
  }
  if (categoryKey === 'airports') return true;
  if (categoryKey === 'attractions') {
    if (HOSPITAL_TAGS.has(amenity) || amenity === 'pharmacy') return false;
    return Boolean(tourism || historic);
  }
  return true;
}

const HOSPITAL_STRICT = /hospital|hastane|hastanesi|مستشفى|عيادة|clinic|طوارئ|acil|polyclinic/i;
const CROSS_BLEED = /sigorta|insurance|atölye|atolye|workshop|tamirhane|kaporta|kaynak|genel müdürlük|headquarters|kurumsal|metal iş|demir doğrama|\bacente\b|plaza ofis|oto sanayi|commercial office/i;

const FUEL_VENUE_RE = /opet|shell|\bbp\b|petrol\s*ofisi|\baytemiz\b|totalenergies|\btotal\b|enoc|adnoc|lukoil|go\s?petrol|benzin|benzinlik|akaryakıt|akaryakit|fuel\s?station|petrol\s?station|gas\s?station|محطة\s*وقود|\bوقود\b|بنزين|أوبيت|بترول\s*أوفيسي|أيتميز|اينوك|اد نوك/i;
const BAKERY_GROCERY_RE = /fırın|firin|مخبز|مخابز|\bفرن\b|ekmek|pastane|bakery|patisserie|güllüoğlu|gulluoglu|hafız\s*mustafa|hafiz\s*mustafa|حافظ مصطفى|\bbim\b|a101|şok|\bsok\b|migros|carrefour|greengrocer|supermarket|سوبر\s*ماركت|بقالة|\bبيم\b|أ101|ميغروس|كارفور/i;

const FUEL_UI_LABEL = 'وقود';
const BAKERY_UI_LABEL = 'مخابز وسوبر ماركت';
const FUEL_KEEP_LABELS = new Set(['وقود', 'محطة وقود']);
const BAKERY_KEEP_LABELS = new Set(['مخبز', 'حلويات', 'سوبر ماركت', 'بقالة', 'خضار وفواكه', 'مخابز وسوبر ماركت']);

function venueHay(place: { name?: string; description?: string; name_en?: string }): string {
  return [place.name, place.description, place.name_en].filter(Boolean).join(' ');
}

export function isFuelVenueName(hay: string): boolean {
  return FUEL_VENUE_RE.test(hay);
}

export function isBakeryOrGroceryName(hay: string): boolean {
  return BAKERY_GROCERY_RE.test(hay);
}

export function canonicalFuelBakeryKey(
  place: Pick<DirectoryListing, 'category_key' | 'name'> & { description?: string; name_en?: string },
): string {
  const hay = venueHay(place);
  if (place.category_key === 'fuel') {
    if (isForbiddenFuelVenue(hay)) return place.category_key;
    if (isBakeryOrGroceryName(hay) && !isFuelVenueName(hay)) return 'bakeries';
    return 'fuel';
  }
  if (place.category_key === 'bakeries') {
    if (isForbiddenFuelVenue(hay)) return 'bakeries';
    if (isFuelVenueName(hay) && !isBakeryOrGroceryName(hay)) return 'fuel';
    return 'bakeries';
  }
  return place.category_key;
}

export function normalizeFuelBakeryListing<T extends DirectoryListing>(place: T): T {
  const key = canonicalFuelBakeryKey(place);
  if (key === 'fuel') {
    const label = FUEL_KEEP_LABELS.has(place.category_label) ? place.category_label : FUEL_UI_LABEL;
    if (place.category_key === key && place.category_label === label) return place;
    return { ...place, category_key: 'fuel', category_label: label };
  }
  if (key === 'bakeries') {
    const label = BAKERY_KEEP_LABELS.has(place.category_label) ? place.category_label : BAKERY_UI_LABEL;
    if (place.category_key === key && place.category_label === label) return place;
    return { ...place, category_key: 'bakeries', category_label: label };
  }
  return place;
}

export function listingMatchesCategory(
  place: Pick<DirectoryListing, 'category_key' | 'name'> & { description?: string; name_en?: string },
  categoryKey = place.category_key,
): boolean {
  const hay = venueHay(place);

  if (CROSS_BLEED.test(hay) && !['exchange', 'telecom'].includes(categoryKey)) {
    if (!(categoryKey === 'hospitals' && HOSPITAL_STRICT.test(hay))) return false;
  }

  if (categoryKey === 'hospitals') {
    if (HOSPITAL_NAME_BAN.test(hay) && !HOSPITAL_STRICT.test(hay)) return false;
    if (FACULTY_WITHOUT_HOSPITAL.test(hay) && !HOSPITAL_STRICT.test(hay)) return false;
    return true;
  }

  if (categoryKey === 'pharmacies') {
    if (/museum|müze|hospital|hastane|mosque/i.test(hay) && !/pharmacy|eczane|صيدل/i.test(hay)) return false;
    return true;
  }

  if (categoryKey === 'fuel') {
    if (isForbiddenFuelVenue(hay)) return false;
    if (isBakeryOrGroceryName(hay) && !isFuelVenueName(hay)) return false;
    return canonicalFuelBakeryKey({ ...place, category_key: 'fuel' }) === 'fuel';
  }

  if (categoryKey === 'bakeries') {
    return canonicalFuelBakeryKey({ ...place, category_key: 'bakeries' }) === 'bakeries';
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
  const normalized = normalizeFuelBakeryListing(place);
  const pin = sanitizePin(normalized.lat, normalized.lng);
  if (!pin) return null;
  if (!listingMatchesCategory(normalized, normalized.category_key)) return null;
  if (normalized.category_key === 'fuel') {
    if (!isFuelCoordinateClean(pin.lat, pin.lng)) return null;
    if (!isCuratedTurkeyFuelPin(pin.lat, pin.lng, venueHay(normalized))) return null;
  } else if (isTurkeyCatalogCoordinate(pin.lat, pin.lng)) {
    if (!isCuratedTurkeyPin(pin.lat, pin.lng, normalized.category_key, venueHay(normalized))) return null;
  }
  const verdict = validateCoordinates({
    lat: pin.lat,
    lng: pin.lng,
    city: place.city,
    country: place.country_name,
    address: place.address,
  });
  if (!verdict.ok) return null;
  return { ...normalized, lat: verdict.lat, lng: verdict.lng };
}
