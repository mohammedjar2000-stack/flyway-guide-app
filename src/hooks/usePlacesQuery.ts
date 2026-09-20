import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DirectoryListing } from '@/types';
import { haversineKm, type MapBounds } from '@/lib/geo';
import { DEFAULT_CATEGORY_KEYS, FETCH_RADIUS_METERS } from '@/lib/mapConfig';
import { catalogBoundsForCity, resolveCatalogCity } from '@/lib/cityCoordinates';
import { canonicalFuelBakeryKey, listingMatchesCategory } from '@/lib/placePrecision';
import { isFuelCoordinateClean } from '@/lib/fuelGuard';
import { isCuratedTurkeyFuelPin } from '@/lib/turkeyFuelStations';
import { isAllTurkeyCity, isTurkeyCountry, listingMatchesProvince } from '@/lib/turkeyScope';
import { isCuratedTurkeyPin } from '@/lib/turkeyCuratedGuard';
import { civicListRank } from '@/lib/civicRank';
import { getVerifiedPlaces } from '@/lib/verifiedPlaces';
import { turkeyAirportListings } from '@/lib/turkeyAirports';
import { fetchPlacesForMap, fetchPlacesFromOverpass } from '@/services/overpassApi';
import { listingDedupeKey, tallyScopedCategoryCounts } from '@/hooks/useCategoryCounts';
import {
  fetchNearbyPlaces,
  fetchPlaceCatalog,
  gisPlacesToListings,
  ingestMappedPlaces,
  PLACES_UPDATED_EVENT,
  syncOsmCategory,
} from '@/services/gisApi';
import { bootPlaceVault, getVaultSnapshot, ingestListings, mergeIntoVault, subscribeVault } from '@/lib/placeVault';

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

const CITY_CATALOG_LIMIT = 5000;
const CITY_NEARBY_LIMIT = 2500;
const CITY_SYNC_LIMIT = 500;
const AIRPORT_SEEDS = turkeyAirportListings();

function keepPreviousData<T>(previous: T | undefined) {
  return previous;
}

async function fetchCityCategory(
  category: string,
  here: { lat: number; lng: number } | null,
  cityEn?: string | null,
  live = true,
) {
  if (!live) return [] as DirectoryListing[];
  const catalogCity = cityEn && cityEn !== 'All Turkey' ? cityEn : undefined;
  const [osm, gis, catalog] = await Promise.all([
    live && here
      ? fetchPlacesFromOverpass(here.lat, here.lng, category, FETCH_RADIUS_METERS).catch(() => [] as DirectoryListing[])
      : Promise.resolve([] as DirectoryListing[]),
    live && here
      ? fetchNearbyPlaces({
        lat: here.lat,
        lng: here.lng,
        radius: FETCH_RADIUS_METERS,
        category,
        city: catalogCity,
        limit: CITY_NEARBY_LIMIT,
      })
      : Promise.resolve([]),
    fetchPlaceCatalog({ category, city: catalogCity, limit: CITY_CATALOG_LIMIT }),
  ]);
  if (osm.length) void ingestMappedPlaces(osm);
  return [...gisPlacesToListings(gis), ...gisPlacesToListings(catalog), ...osm];
}

function matchesSelectedCategory(item: DirectoryListing, categories: string[]) {
  if (categories.length === 0) return false;
  const key = canonicalFuelBakeryKey(item);
  const hay = `${item.name || ''} ${item.description || ''}`;
  if (key === 'fuel' && (!listingMatchesCategory(item, 'fuel') || !isFuelCoordinateClean(item.lat, item.lng) || !isCuratedTurkeyFuelPin(item.lat, item.lng, hay))) return false;
  if (!isCuratedTurkeyPin(item.lat, item.lng, key, hay)) return false;
  if (categories.includes(key)) return true;
  if ((key === 'police' || item.category_key === 'police') && categories.includes('embassy')) return true;
  return false;
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

  const [vaultRev, setVaultRev] = useState(0);
  useEffect(() => {
    void bootPlaceVault();
    return subscribeVault(() => setVaultRev((n) => n + 1));
  }, []);

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
  const allTurkey = isAllTurkeyCity(resolvedCity) || isAllTurkeyCity(locationCity);
  const liveOsm = !allTurkey && !isTurkeyCountry(resolvedCity?.country || locationCountry);

  const originRef = useRef(origin);
  originRef.current = origin;
  const cityRef = useRef(resolvedCity?.name || locationCity);
  cityRef.current = resolvedCity?.name || locationCity;
  const cityEnRef = useRef(resolvedCity?.en || '');
  cityEnRef.current = resolvedCity?.en || '';
  const liveOsmRef = useRef(liveOsm);
  liveOsmRef.current = liveOsm;
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

  const verifiedDining = useMemo(
    () => verifiedAll.filter((item) => item.category_key === 'restaurants').length,
    [verifiedAll],
  );
  const skipLiveDining = verifiedDining >= 150;
  const verifiedRef = useRef(verifiedAll);
  verifiedRef.current = verifiedAll;

  const pharmacyQuery = useQuery({
    queryKey: ['places-pharmacies', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('pharmacies', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'pharmacies',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const marketsQuery = useQuery({
    queryKey: ['places-markets', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('markets', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'markets',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const hotelsQuery = useQuery({
    queryKey: ['places-hotels', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('hotels', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'hotels',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const telecomQuery = useQuery({
    queryKey: ['places-telecom', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('telecom', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'telecom',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const exchangeQuery = useQuery({
    queryKey: ['places-exchange', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('exchange', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'exchange',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const transportQuery = useQuery({
    queryKey: ['places-transport', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('transport', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'transport',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const hospitalsQuery = useQuery({
    queryKey: ['places-hospitals', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('hospitals', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'hospitals',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const policeQuery = useQuery({
    queryKey: ['places-police', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('police', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'police',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const fuelQuery = useQuery({
    queryKey: ['places-fuel', 'v4', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 60 * 60_000,
    gcTime: Infinity,
    retry: 0,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => [] as DirectoryListing[],
  });

  const bakeriesQuery = useQuery({
    queryKey: ['places-bakeries', 'curated-v1', cityKey],
    enabled: Boolean(cityBounds),
    staleTime: 30_000,
    gcTime: Infinity,
    retry: 1,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const here = originRef.current;
      const rows = await fetchCityCategory('bakeries', liveOsmRef.current ? here : null, cityEnRef.current, liveOsmRef.current);
      if (here && liveOsmRef.current) {
        void syncOsmCategory({
          lat: here.lat,
          lng: here.lng,
          category: 'bakeries',
          city: cityEnRef.current || cityRef.current || '',
          country: countryRef.current || 'Turkey',
          limit: CITY_SYNC_LIMIT,
          radius: FETCH_RADIUS_METERS,
        });
      }
      return rows;
    },
  });

  const airportsQuery = useQuery({
    queryKey: ['places-airports', 'curated-v1', cityKey],
    staleTime: 60 * 60_000,
    gcTime: 6 * 60 * 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () => [] as DirectoryListing[],
  });

  const query = useQuery({
    queryKey: ['places-city', 'curated-v1', cityKey, skipLiveDining ? 1 : 0],
    enabled: Boolean(cityBounds),
    staleTime: 15 * 60_000,
    gcTime: Infinity,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!liveOsmRef.current) {
        return { places: [] as DirectoryListing[], fallback: true };
      }
      const here = originRef.current;
      const local = verifiedRef.current;
      let cats = DEFAULT_CATEGORY_KEYS.filter((key) => key !== 'fuel');
      if (local.filter((item) => item.category_key === 'restaurants').length >= 150) {
        cats = cats.filter((key) => key !== 'restaurants');
      }
      const liveCats = cats.includes('pharmacies') ? cats : ['pharmacies', ...cats];
      try {
        const catalogCity = cityEnRef.current && cityEnRef.current !== 'All Turkey' ? cityEnRef.current : undefined;
        const [overpass, gisMixed, catalogAll] = await Promise.all([
          liveOsmRef.current
            ? fetchPlacesForMap({
              bounds: cityBounds,
              origin: here,
              categories: liveCats,
              radiusMeters: FETCH_RADIUS_METERS,
            }).catch(() => [] as DirectoryListing[])
            : Promise.resolve([] as DirectoryListing[]),
          liveOsmRef.current && here
            ? fetchNearbyPlaces({ lat: here.lat, lng: here.lng, radius: FETCH_RADIUS_METERS, city: catalogCity, limit: CITY_NEARBY_LIMIT })
            : Promise.resolve([]),
          fetchPlaceCatalog({ city: catalogCity, limit: CITY_CATALOG_LIMIT }),
        ]);
        const gisListings = gisPlacesToListings([...catalogAll, ...gisMixed]);
        const places = [...gisListings, ...overpass];
        if (overpass.length > 0) {
          void ingestMappedPlaces(overpass).catch(() => null);
        }
        return { places, fallback: overpass.length === 0 && gisListings.length === 0 };
      } catch {
        return { places: [] as DirectoryListing[], fallback: true };
      }
    },
  });

  const catalogHold = useRef<DirectoryListing[]>([]);
  const listingsHold = useRef<DirectoryListing[]>([]);
  const listingsHoldKey = useRef('');

  const fetching = Boolean(
    query.isFetching
    || pharmacyQuery.isFetching
    || marketsQuery.isFetching
    || hotelsQuery.isFetching
    || telecomQuery.isFetching
    || exchangeQuery.isFetching
    || transportQuery.isFetching
    || hospitalsQuery.isFetching
    || policeQuery.isFetching
    || fuelQuery.isFetching
    || bakeriesQuery.isFetching
    || airportsQuery.isFetching,
  );

  const catalog = useMemo(() => {
    const live = query.data?.places ?? [];
    const pharmacies = pharmacyQuery.data ?? [];
    const markets = marketsQuery.data ?? [];
    const hotels = hotelsQuery.data ?? [];
    const telecom = telecomQuery.data ?? [];
    const exchange = exchangeQuery.data ?? [];
    const transport = transportQuery.data ?? [];
    const hospitals = hospitalsQuery.data ?? [];
    const police = policeQuery.data ?? [];
    const fuel = fuelQuery.data ?? [];
    const bakeries = bakeriesQuery.data ?? [];
    const airports = [...AIRPORT_SEEDS, ...(airportsQuery.data ?? [])];
    const fresh = ingestListings([
      verifiedAll,
      airports,
      hospitals,
      police,
      fuel,
      bakeries,
      pharmacies,
      markets,
      hotels,
      telecom,
      exchange,
      transport,
      live,
      dbListings,
    ]);
    const next = ingestListings([fresh, getVaultSnapshot()], { fromCache: true });
    if (next.length > 0) {
      catalogHold.current = next;
      return next;
    }
    return catalogHold.current.length > 0 ? catalogHold.current : next;
  }, [airportsQuery.data, bakeriesQuery.data, dbListings, exchangeQuery.data, fuelQuery.data, hospitalsQuery.data, hotelsQuery.data, marketsQuery.data, pharmacyQuery.data, policeQuery.data, query.data?.places, telecomQuery.data, transportQuery.data, vaultRev, verifiedAll]);

  const scopedTally = useMemo(
    () => tallyScopedCategoryCounts(catalog, { cityHit: resolvedCity, allTurkey }),
    [catalog, resolvedCity, allTurkey],
  );

  useEffect(() => {
    if (catalog.length === 0) return;
    mergeIntoVault(catalog, { fromCache: true });
    window.dispatchEvent(new CustomEvent(PLACES_UPDATED_EVENT, {
      detail: { counts: scopedTally.counts, total: scopedTally.total },
    }));
  }, [catalog, scopedTally]);

  const listings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const seenName = new Set<string>();
    const filtered = catalog.filter((item) => {
      const nearOrigin = origin
        ? haversineKm(origin.lat, origin.lng, item.lat, item.lng) <= 18
        : false;
      if (!listingMatchesProvince(item, resolvedCity, allTurkey) && !nearOrigin) return false;
      if (!matchesSelectedCategory(item, categories)) return false;
      const nameKey = listingDedupeKey(item);
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

    const sorted = origin
      ? filtered.sort((a, b) => {
        if (locationDistrict) {
          return haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng);
        }
        const rank = civicListRank(a) - civicListRank(b);
        if (rank !== 0) return rank;
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng);
      })
      : filtered.sort((a, b) => civicListRank(a) - civicListRank(b) || Number(b.is_featured) - Number(a.is_featured));

    if (sorted.length > 0) {
      listingsHold.current = sorted;
      listingsHoldKey.current = `${cityKey}:${categories.join(',')}:${search}`;
      return sorted;
    }
    const holdKey = `${cityKey}:${categories.join(',')}:${search}`;
    if (fetching && listingsHold.current.length > 0 && listingsHoldKey.current === holdKey) {
      return listingsHold.current;
    }
    return sorted;
  }, [catalog, categories, search, origin, fetching, resolvedCity, allTurkey, locationDistrict]);

  return {
    listings,
    categoryCounts: scopedTally.counts,
    scopedTotal: scopedTally.total,
    loading: listings.length === 0 && fetching,
    error: false,
    errorMessage: null as string | null,
    tooZoomedOut: false,
    fromFallback: false,
    refetch: () => {
      void query.refetch();
      void pharmacyQuery.refetch();
      void marketsQuery.refetch();
      void hotelsQuery.refetch();
      void telecomQuery.refetch();
      void exchangeQuery.refetch();
      void transportQuery.refetch();
      void hospitalsQuery.refetch();
      void policeQuery.refetch();
      void fuelQuery.refetch();
      void bakeriesQuery.refetch();
      void airportsQuery.refetch();
    },
  };
}
