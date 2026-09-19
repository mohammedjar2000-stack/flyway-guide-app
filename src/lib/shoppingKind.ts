export function isMallPlace(place: {
  category_key?: string;
  subcategory?: string | null;
  place_kind?: string;
  category_label?: string;
  name?: string;
  description?: string;
  tags?: string[];
}): boolean {
  if (place.category_key && place.category_key !== 'markets') return false;
  if (place.place_kind === 'mall' || place.subcategory === 'mall') return true;
  if (place.category_label === 'مركز تسوق') return true;
  const hay = [place.name, place.description, ...(place.tags || [])].filter(Boolean).join(' ');
  return /avm|\bmall\b|shopping centre|shopping center|department store|مول(?!ات)|مركز تسوق|كانيون|zorlu|istinye|cevahir/i.test(hay);
}

export function shoppingLabel(place: {
  category_key?: string;
  subcategory?: string | null;
  category_label?: string;
  name?: string;
  description?: string;
  tags?: string[];
}): string {
  if (isMallPlace(place)) return 'مركز تسوق';
  if (place.subcategory === 'marketplace' || /pazar|bazaar|souk|سوق/i.test([place.name, place.description].filter(Boolean).join(' '))) {
    return 'سوق';
  }
  return place.category_label || 'سوبر ماركت';
}
