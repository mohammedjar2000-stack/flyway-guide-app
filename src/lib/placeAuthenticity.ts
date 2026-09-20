import { haversineKm } from '@/lib/geo';
import type { DirectoryListing } from '@/types';

const GENERIC_NAME = /^(hotel|pharmacy|hospital|park|parking|unnamed|toilet|wc|cafe|restaurant|clinic|eczane|karakol|polis|zabıta|zabita|döviz|doviz|test|dummy|placeholder|example|sample)$/i;

const JUNK_VENUE = /zabıta|zabita|الزابطة|زابطة|trafik (kontrol|denetleme)|çocuk büro|asayiş büro|devriye ekip|kriminal|adli tıp|kontrol noktası|güven timleri|\b(test|dummy|placeholder|fake)\b/i;

const GENERIC_SEED_EXACT = /^(eczanesi|pharmacy|döviz|doviz|kuaför|kuafor|hair studio|pastanesi|opet|shell|bp|turkcell|vodafone|fishland|cemil usta)$/i;

export function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b(the|hotel|hastane|hospital|camii|cami|mosque|eczanesi|pharmacy)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isAuthenticVenueName(name: string, categoryKey?: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  if (categoryKey === 'exchange' && /^(atm|bank|döviz|doviz|exchange|صرافة|مصرف)$/i.test(trimmed)) {
    return true;
  }
  if (categoryKey === 'fuel' && /^(bp|po|opet|shell|total|aytemiz)$/i.test(trimmed)) {
    return true;
  }
  if (categoryKey === 'bakeries' && /^(bim|a101|şok|sok|migros)$/i.test(trimmed)) {
    return true;
  }
  if (GENERIC_NAME.test(trimmed)) return false;
  if (JUNK_VENUE.test(trimmed)) return false;
  if (categoryKey === 'police') {
    if (/trafik tescil|trafik amirliği|tescil büro/i.test(trimmed)) return false;
    if (/büro amirliği|ekip amirliği/i.test(trimmed) && !/polis merkezi|police|emniyet müdürlüğü|مديرية|مركز شرطة/i.test(trimmed)) {
      return false;
    }
  }
  return true;
}

export function isGenericSeedName(nameEn: string, nameAr: string): boolean {
  const check = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (GENERIC_NAME.test(trimmed)) return true;
    return GENERIC_SEED_EXACT.test(trimmed);
  };
  return check(nameEn) || check(nameAr);
}

export function isNearDuplicate(a: DirectoryListing, b: DirectoryListing): boolean {
  if (a.category_key !== b.category_key) return false;
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
  const na = normalizeVenueName(a.name);
  const nb = normalizeVenueName(b.name);
  const sameStay = a.category_key === 'hotels' || a.category_key === 'restaurants';
  // Adjacent hotels/resorts are distinct properties — only collapse obvious name clones.
  if (sameStay) {
    if (km < 0.012) return true;
    if (!na || !nb) return false;
    if (km < 0.08 && (na.includes(nb) || nb.includes(na))) return true;
    return false;
  }
  // Operator chains (Turkcell / Vodafone / Türk Telekom) share names across districts.
  if (a.category_key === 'telecom' || a.category_key === 'exchange' || a.category_key === 'transport' || a.category_key === 'fuel' || a.category_key === 'bakeries' || a.category_key === 'airports') {
    if (km < 0.018) return true;
    return false;
  }
  if (km < 0.06) return true;
  if (!na || !nb) return false;
  if (km < 0.22 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}
