const TURKEY_PLACE =
  /تركيا|turkey|türkiye|istanbul|antalya|trabzon|ankara|izmir|fatih|beyoğlu|beyoglu|kadıköy|kadikoy|şişli|sisli|üsküdar|uskudar|beşiktaş|besiktas/i;

const LEGACY_ONLY = /^(?:\+90)?0?(?:155|110)$/;

export function isTurkeyPlace(country?: string, city?: string, address?: string): boolean {
  const countryNorm = (country || '').trim().toUpperCase();
  if (countryNorm === 'TR' || countryNorm === 'TUR' || countryNorm === 'TURKEY') return true;
  return TURKEY_PLACE.test(`${country || ''} ${city || ''} ${address || ''}`);
}

/** Turkey uses unified 112 (police, ambulance, fire). Do not rewrite landlines like +90 212 326 1100. */
export function normalizeTurkeyEmergencyPhone(
  phone: string,
  country?: string,
  city?: string,
  categoryKey?: string,
  address?: string,
): string {
  if (!isTurkeyPlace(country, city, address)) return phone || '';
  const compact = (phone || '').replace(/[\s-]/g, '');
  if (LEGACY_ONLY.test(compact)) return '112';
  if (categoryKey === 'police' && (!compact || compact === '112' || compact === '155')) return '112';
  return phone || '';
}
