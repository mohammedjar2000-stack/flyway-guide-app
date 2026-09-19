import type { DirectoryListing } from '@/types';

/** Iraqi consulate first in سفارة وشرطة; featured civic venues next. */
export function civicListRank(item: DirectoryListing): number {
  const hay = `${item.name} ${item.description}`.toLowerCase();
  if (item.category_key === 'embassy' && /عراق|iraq/.test(hay)) return -200;
  if (item.category_key === 'embassy') return -80;
  if (item.category_key === 'airports' && /\bist\b|إسطنبول — ist/.test(hay)) return -40;
  if (item.category_key === 'airports' && /\bsaw\b|صبيحة/.test(hay)) return -30;
  if (item.is_featured) return -10;
  return 0;
}

export function sortCivicListings(
  items: DirectoryListing[],
  origin?: { lat: number; lng: number } | null,
  distanceFn?: (a: DirectoryListing, b: DirectoryListing) => number,
): DirectoryListing[] {
  return [...items].sort((a, b) => {
    const rank = civicListRank(a) - civicListRank(b);
    if (rank !== 0) return rank;
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (origin && distanceFn) return distanceFn(a, b);
    return a.sort_order - b.sort_order;
  });
}
