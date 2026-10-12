import { useEffect, useMemo, useRef, useState } from 'react';
import type { DirectoryListing } from '@/types';
import { haversineKm, roundBounds, type MapBounds } from '@/lib/geo';
import { isAuthenticVenueName, isNearDuplicate } from '@/lib/placeAuthenticity';
import { canonicalFuelBakeryKey, pinListing } from '@/lib/placePrecision';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface UseViewportPlacesArgs {
  bounds: MapBounds | null;
  zoom: number;
  categories: string[];
  search: string;
  dbListings: DirectoryListing[];
  origin: { lat: number; lng: number } | null;
}

function boundsKey(b: MapBounds | null, zoom: number, categories: string) {
  if (!b) return '';
  const r = roundBounds(b, 3);
  return `${r.south}:${r.west}:${r.north}:${r.east}:${Math.round(zoom)}:${categories}`;
}

export function useViewportPlaces({
  bounds,
  zoom,
  categories,
  search,
  dbListings,
  origin,
}: UseViewportPlacesArgs) {
  const [osmById, setOsmById] = useState<Map<string, DirectoryListing>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tooZoomedOut, setTooZoomedOut] = useState(false);
  const requestId = useRef(0);
  const originRef = useRef(origin);
  originRef.current = origin;

  const categoryKey = categories.slice().sort().join(',');
  const fetchKey = boundsKey(bounds, zoom, categoryKey);
  const debouncedKey = useDebouncedValue(fetchKey, 550);
  const debouncedSearch = useDebouncedValue(search.trim(), 280);

  useEffect(() => {
    setTooZoomedOut(false);
    setLoading(false);
  }, [debouncedKey, categories, categoryKey]);

  const listings = useMemo(() => {
    const accepted: DirectoryListing[] = [];
    const ingest = (item: DirectoryListing) => {
      if (!isAuthenticVenueName(item.name, item.category_key) && !isAuthenticVenueName(item.description || '', item.category_key)) {
        return;
      }
      const pinned = pinListing(item);
      if (!pinned) return;
      if (accepted.some((existing) => existing.id === pinned.id || isNearDuplicate(existing, pinned))) return;
      accepted.push(pinned);
    };
    for (const item of osmById.values()) ingest(item);
    for (const item of dbListings) ingest(item);

    const q = debouncedSearch.toLowerCase();

    const filtered = accepted.filter((item) => {
      if (categories.length > 0 && !categories.includes(canonicalFuelBakeryKey(item))
        && !(item.category_key === 'police' && categories.includes('embassy'))) return false;
      if (q) {
        const hay = [
          item.name,
          item.category_label,
          item.address,
          item.city,
          item.country_name,
          ...(item.tags ?? []),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (!origin) return filtered;
    return filtered.sort(
      (a, b) => haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng),
    );
  }, [dbListings, osmById, categories, debouncedSearch, bounds, origin]);

  return { listings, loading, error, tooZoomedOut };
}
