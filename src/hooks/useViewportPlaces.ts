import { useEffect, useMemo, useRef, useState } from 'react';
import type { DirectoryListing } from '@/types';
import { boundsSpanDeg, haversineKm, padBounds, pointInBounds, roundBounds, type MapBounds } from '@/lib/geo';
import { fetchPlacesFromOverpass, fetchPlacesInBounds } from '@/services/overpassApi';
import { isAuthenticVenueName, isNearDuplicate } from '@/lib/placeAuthenticity';
import { pinListing } from '@/lib/placePrecision';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const MAX_SPAN_DEG = 0.38;
const MIN_ZOOM = 12;

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
    if (!debouncedKey || categories.length === 0) {
      setTooZoomedOut(false);
      return;
    }

    const [south, west, north, east, zoomStr] = debouncedKey.split(':');
    const currentBounds: MapBounds = {
      south: Number(south),
      west: Number(west),
      north: Number(north),
      east: Number(east),
    };
    const currentZoom = Number(zoomStr);
    const padded = padBounds(currentBounds);
    const span = boundsSpanDeg(padded);
    if (currentZoom < MIN_ZOOM || span > MAX_SPAN_DEG) {
      setTooZoomedOut(true);
      setLoading(false);
      return;
    }

    setTooZoomedOut(false);
    const id = ++requestId.current;
    setLoading(true);
    setError(false);

    const rounded = roundBounds(padded);
    const here = originRef.current;

    (async () => {
      let places = await fetchPlacesInBounds(rounded, categories);
      if (places.length === 0 && here) {
        const nearby = await Promise.all(
          categories.map((key) => fetchPlacesFromOverpass(here.lat, here.lng, key)),
        );
        places = nearby.flat();
      }
      if (id !== requestId.current) return;
      setOsmById((prev) => {
        const next = new Map(prev);
        for (const [key, item] of next) {
          if (!categories.includes(item.category_key)) next.delete(key);
        }
        for (const place of places) next.set(place.id, place);
        return next;
      });
      setError(places.length === 0);
      setLoading(false);
    })().catch(() => {
      if (id !== requestId.current) return;
      setError(true);
      setLoading(false);
    });
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
    const view = bounds ? padBounds(bounds, 0.15) : null;

    const filtered = accepted.filter((item) => {
      if (categories.length > 0 && !categories.includes(item.category_key)) return false;
      const inView = view ? pointInBounds(item.lat, item.lng, view) : true;
      const nearOrigin = origin ? haversineKm(origin.lat, origin.lng, item.lat, item.lng) <= 5 : false;
      if (!inView && !nearOrigin) return false;
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
