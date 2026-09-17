import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import type { DirectoryListing } from '@/types';
import { haversineKm, type MapBounds } from '@/lib/geo';
import { DEFAULT_CATEGORY_KEYS, FETCH_RADIUS_METERS } from '@/lib/mapConfig';
import { catalogBoundsForCity, resolveCatalogCity } from '@/lib/cityCoordinates';
import { isAuthenticVenueName, isNearDuplicate } from '@/lib/placeAuthenticity';
import { pinListing } from '@/lib/placePrecision';
import { placeGallery, placeKindLabel, resolvePlaceKind } from '@/lib/placeImagery';
import { normalizeTurkeyEmergencyPhone } from '@/lib/turkeyEmergency';
import { getVerifiedPlaces } from '@/lib/verifiedPlaces';
import { fetchPlacesForMap } from '@/services/overpassApi';

interface UsePlacesQueryArgs {
  bounds: MapBounds | null;
  zoom: number;
  categories: string[];
  search: string;
  dbListings: DirectoryListing[];
  origin: { lat: number; lng: number } | null;
  locationCity?: string;
  locationCountry?: string;
  locationDistrict?: string;
  locationBbox?: { south: number; west: number; north: number; east: number } | null;
}

function matchesSelectedCategory(item: DirectoryListing, categories: string[]) {
  if (categories.length === 0) return false;
  if (categories.includes(item.category_key)) return true;
  if (item.category_key === 'police' && categories.includes('embassy')) return true;
  return false;
}

function cellKey(category: string, lat: number, lng: number) {
  return `${category}:${Math.round(lat * 200)}:${Math.round(lng * 200)}`;
}

function ingestPlaces(buckets: DirectoryListing[][]): DirectoryListing[] {
  const accepted: DirectoryListing[] = [];
  const byId = new Set<string>();
  const grid = new Map<string, DirectoryListing[]>();

  const nearby = (item: DirectoryListing) => {
    const i = Math.round(item.lat * 200);
    const j = Math.round(item.lng * 200);
    const hits: DirectoryListing[] = [];
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const bucket = grid.get(`${item.category_key}:${i + di}:${j + dj}`);
        if (bucket) hits.push(...bucket);
      }
    }
    return hits;
  };

  const ingest = (item: DirectoryListing) => {
    if (!isAuthenticVenueName(item.name, item.category_key) && !isAuthenticVenueName(item.description, item.category_key)) {
      return;
    }
    const pinned = pinListing(item);
    if (!pinned) return;
    if (byId.has(pinned.id)) return;
    pinned.phone = normalizeTurkeyEmergencyPhone(
      pinned.phone,
      pinned.country_name,
      pinned.city,
      pinned.category_key,
      pinned.address,
    );
    if (pinned.category_key === 'hotels' || pinned.category_key === 'restaurants') {
      pinned.place_kind = resolvePlaceKind(pinned);
      pinned.category_label = placeKindLabel(pinned.place_kind);
    }
    const owned = (pinned.images || []).filter((url) => /^https?:\/\//i.test(url));
    if (owned.length < 3) {
      pinned.images = placeGallery(pinned);
    }
    pinned.image = pinned.images?.[0] || pinned.image;
    if (nearby(pinned).some((existing) => isNearDuplicate(existing, pinned))) return;
    byId.add(pinned.id);
    const key = cellKey(pinned.category_key, pinned.lat, pinned.lng);
    const bucket = grid.get(key);
    if (bucket) bucket.push(pinned);
    else grid.set(key, [pinned]);
    accepted.push(pinned);
  };

  for (const bucket of buckets) {
    for (const item of bucket) ingest(item);
  }
  return accepted;
}

export function usePlacesQuery({
  bounds: _bounds,
  zoom: _zoom,
  categories,
  search,
  dbListings,
  origin,
  locationCity,
  locationCountry,
  locationDistrict,
  locationBbox: _locationBbox,
}: UsePlacesQueryArgs) {
  void _bounds;
  void _zoom;
  void _locationBbox;

  const resolvedCity = useMemo(
    () => resolveCatalogCity({
      city: locationCity,
      country: locationCountry,
      district: locationDistrict,
      lat: origin?.lat,
      lng: origin?.lng,
    }),
    [locationCity, locationCountry, locationDistrict, origin?.lat, origin?.lng],
  );
  const cityKey = (resolvedCity?.en || locationCity || locationCountry || '').trim();

  const originRef = useRef(origin);
  originRef.current = origin;
  const cityRef = useRef(resolvedCity?.name || locationCity);
  cityRef.current = resolvedCity?.name || locationCity;
  const countryRef = useRef(resolvedCity?.country || locationCountry);
  countryRef.current = resolvedCity?.country || locationCountry;

  const cityBounds = useMemo(
    () => catalogBoundsForCity(resolvedCity, origin),
    [resolvedCity, origin?.lat, origin?.lng],
  );

  const verifiedAll = useMemo(
    () => getVerifiedPlaces({
      origin,
      city: resolvedCity?.name || locationCity,
      country: resolvedCity?.country || locationCountry,
      district: locationDistrict,
      categories: DEFAULT_CATEGORY_KEYS,
    }),
    [resolvedCity?.name, resolvedCity?.country, locationCity, locationCountry, locationDistrict, origin?.lat, origin?.lng],
  );

  const verifiedHotels = useMemo(
    () => verifiedAll.filter((item) => item.category_key === 'hotels').length,
    [verifiedAll],
  );
  const verifiedDining = useMemo(
    () => verifiedAll.filter((item) => item.category_key === 'restaurants').length,
    [verifiedAll],
  );
  const skipLiveHotels = verifiedHotels >= 50;
  const skipLiveDining = verifiedDining >= 50;
  const verifiedRef = useRef(verifiedAll);
  verifiedRef.current = verifiedAll;

  const query = useQuery({
    queryKey: ['places-city', 'instant-catalog-v2', cityKey, skipLiveHotels ? 1 : 0, skipLiveDining ? 1 : 0, cityBounds.south, cityBounds.west],
    enabled: Boolean(cityBounds),
    staleTime: 15 * 60_000,
    gcTime: 45 * 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const here = originRef.current;
      const local = verifiedRef.current;
      let cats = DEFAULT_CATEGORY_KEYS;
      if (local.filter((item) => item.category_key === 'hotels').length >= 50) {
        cats = cats.filter((key) => key !== 'hotels');
      }
      if (local.filter((item) => item.category_key === 'restaurants').length >= 50) {
        cats = cats.filter((key) => key !== 'restaurants');
      }
      try {
        const places = await fetchPlacesForMap({
          bounds: cityBounds,
          origin: here,
          categories: cats,
          radiusMeters: FETCH_RADIUS_METERS,
        });
        return { places, fallback: false };
      } catch {
        return { places: [] as DirectoryListing[], fallback: true };
      }
    },
  });

  const catalog = useMemo(() => {
    const live = query.data?.places ?? [];
    return ingestPlaces([verifiedAll, live, dbListings]);
  }, [dbListings, query.data?.places, verifiedAll]);

  const listings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const seenName = new Set<string>();
    const filtered = catalog.filter((item) => {
      if (!matchesSelectedCategory(item, categories)) return false;
      const nameKey = `${item.category_key}:${item.name.toLowerCase().trim()}`;
      if (seenName.has(nameKey)) return false;
      seenName.add(nameKey);
      if (q) {
        const hay = [
          item.name,
          item.description,
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

    if (!origin) {
      return filtered.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }
    return filtered.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng);
    });
  }, [catalog, categories, search, origin]);

  return {
    listings,
    loading: catalog.length === 0,
    error: false,
    errorMessage: null as string | null,
    tooZoomedOut: false,
    fromFallback: false,
    refetch: query.refetch,
  };
}
