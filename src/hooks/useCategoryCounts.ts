import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';
import { lookupCity, type CityCoordinate } from '@/lib/cityCoordinates';
import { canonicalFuelBakeryKey, listingMatchesCategory } from '@/lib/placePrecision';
import { isFuelCoordinateClean } from '@/lib/fuelGuard';
import { isCuratedTurkeyFuelPin } from '@/lib/turkeyFuelStations';
import { isCuratedTurkeyPin } from '@/lib/turkeyCuratedGuard';
import { isAllTurkeyCity, isTurkeyCountry, listingMatchesProvince } from '@/lib/turkeyScope';
import { bootPlaceVault, getVaultRevision, getVaultSnapshot, subscribeVault } from '@/lib/placeVault';

export type CategoryCountMap = Record<string, number>;

export type CountScope = {
  city?: string | null;
  country?: string | null;
  cityHit?: CityCoordinate | null;
  allTurkey?: boolean;
};

const EMPTY: CategoryCountMap = Object.fromEntries(CATEGORIES.map((cat) => [cat.key, 0]));

export function emptyCategoryCounts(): CategoryCountMap {
  return { ...EMPTY };
}

export function listingDedupeKey(item: {
  category_key: string;
  name: string;
  lat: number;
  lng: number;
}): string {
  return `${item.category_key}:${item.name.toLowerCase().trim()}:${item.lat.toFixed(4)}:${item.lng.toFixed(4)}`;
}

export function formatPlaceCount(n: number): string {
  const value = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return new Intl.NumberFormat('en-US').format(value);
}

export function resolveCountScope(scope?: CountScope): {
  cityHit: CityCoordinate | null;
  allTurkey: boolean;
  constrain: boolean;
} {
  const namedCity = lookupCity(scope?.city);
  const cityHit = scope?.cityHit ?? namedCity;
  const allTurkey = Boolean(scope?.allTurkey)
    || isAllTurkeyCity(scope?.city)
    || isAllTurkeyCity(cityHit)
    || (!namedCity && isTurkeyCountry(scope?.country));
  return {
    cityHit: cityHit ?? null,
    allTurkey,
    constrain: Boolean(cityHit) || allTurkey,
  };
}

export function tallyScopedCategoryCounts(
  items: Array<Pick<DirectoryListing, 'category_key' | 'name' | 'lat' | 'lng'> & {
    id?: string;
    city?: string;
    country_name?: string;
  }>,
  scope?: CountScope,
): { counts: CategoryCountMap; total: number } {
  const { cityHit, allTurkey, constrain } = resolveCountScope(scope);
  const counts = emptyCategoryCounts();
  const seen = new Set<string>();
  let total = 0;

  for (const item of items) {
    if (!item.category_key || !Number.isFinite(item.lat) || !Number.isFinite(item.lng)) continue;
    if (constrain && !listingMatchesProvince(item as DirectoryListing, cityHit, allTurkey)) continue;
    const categoryKey = canonicalFuelBakeryKey(item);
    const hay = `${item.name || ''} ${(item as DirectoryListing).description || ''}`;
    if (categoryKey === 'fuel' && (!listingMatchesCategory(item, 'fuel') || !isFuelCoordinateClean(item.lat, item.lng) || !isCuratedTurkeyFuelPin(item.lat, item.lng, hay))) continue;
    if (!isCuratedTurkeyPin(item.lat, item.lng, categoryKey, hay)) continue;
    const key = listingDedupeKey({ ...item, category_key: categoryKey });
    if (seen.has(key)) continue;
    seen.add(key);
    counts[categoryKey] = (counts[categoryKey] ?? 0) + 1;
    total += 1;
  }

  counts.embassy = (counts.embassy ?? 0) + (counts.police ?? 0);
  return { counts, total };
}

/** Raw key tallies without city filter. Kept for GIS ingest payloads. */
export function countListingsByCategory(
  items: Array<Pick<DirectoryListing, 'category_key' | 'name' | 'lat' | 'lng'> & {
    id?: string;
    city?: string;
    country_name?: string;
  }>,
  scope?: CountScope,
): CategoryCountMap {
  return tallyScopedCategoryCounts(items, scope).counts;
}

export function mergeCategoryCounts(...sources: CategoryCountMap[]): CategoryCountMap {
  const next = emptyCategoryCounts();
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (!Number.isFinite(value) || value <= 0) continue;
      next[key] = Math.max(next[key] ?? 0, value);
    }
  }
  return next;
}

export function useCategoryCounts(scope?: CountScope) {
  const [revision, setRevision] = useState(getVaultRevision);

  useEffect(() => {
    void bootPlaceVault().then(() => setRevision(getVaultRevision()));
    return subscribeVault(() => setRevision(getVaultRevision()));
  }, []);

  const countsResult = useMemo(
    () => tallyScopedCategoryCounts(getVaultSnapshot(), scope),
    [revision, scope?.city, scope?.country, scope?.allTurkey, scope?.cityHit?.en, scope?.cityHit?.name],
  );

  const refresh = useCallback(() => {
    setRevision(getVaultRevision());
  }, []);

  return {
    counts: countsResult.counts,
    total: countsResult.total,
    fromDatabase: revision > 0,
    refresh,
  };
}
