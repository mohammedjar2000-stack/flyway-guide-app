export type FinancialKind = 'exchange' | 'bank' | 'atm';

export function financialKind(place: {
  place_kind?: string;
  subcategory?: string | null;
  category_label?: string;
  name?: string;
  description?: string;
  tags?: string[];
}): FinancialKind {
  const typed = String(place.place_kind || place.subcategory || '').toLowerCase();
  if (typed === 'atm') return 'atm';
  if (typed === 'bank') return 'bank';
  if (typed === 'bureau_de_change' || typed === 'exchange') return 'exchange';

  const hay = [
    place.place_kind,
    place.subcategory,
    place.category_label,
    place.name,
    place.description,
    ...(place.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase();

  if (/\batm\b|صراف آلي|bankomat/.test(hay)) return 'atm';
  if (/döviz|doviz|bureau|صرافة|exchange/.test(hay)) return 'exchange';
  if (/bank|bankası|bankasi|مصرف|\bبنك\b/.test(hay)) return 'bank';
  return 'exchange';
}

export function financialLabel(kind: FinancialKind): string {
  if (kind === 'atm') return 'صراف آلي';
  if (kind === 'bank') return 'مصرف';
  return 'صرافة';
}
