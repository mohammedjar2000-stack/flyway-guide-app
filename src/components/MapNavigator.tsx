import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Minus, Navigation, Plus, Route, SlidersHorizontal, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { haversineKm, type MapBounds } from '@/lib/geo';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlacesQuery } from '@/hooks/usePlacesQuery';
import { usePersistedMapFilters } from '@/hooks/usePersistedMapFilters';
import type { DirectoryListing } from '@/types';
import MapView, { type MapCommandApi } from '@/components/map/MapView';
import CategoryFilterSheet from '@/components/map/CategoryFilterSheet';
import PlaceDetailsSheet from '@/components/map/PlaceDetailsSheet';
import PlacesList from '@/components/map/PlacesList';
import PlacesDrawer from '@/components/map/PlacesDrawer';
import ResultsBottomSheet from '@/components/map/ResultsBottomSheet';
import PlaceHoverCard from '@/components/map/PlaceHoverCard';
import DirectionsPanel from '@/components/map/DirectionsPanel';
import LiveNavOverlay from '@/components/map/LiveNavOverlay';
import { usePlacePreview } from '@/hooks/usePlacePreview';
import { DEFAULT_CATEGORY_KEYS, DEFAULT_MAP_CENTER, isAllCategoriesSelected } from '@/lib/mapConfig';
import { FALLBACK_MAP_CENTER, bboxAround, getCityBoundingBox, locationsEqual, resolveCatalogCity, safeMapCenter, type AppLocation } from '@/lib/cityCoordinates';
import { getMissionById, missionToListing } from '@/lib/iraqiMissions';
import { reverseGeocode } from '@/services/geocode';
import { rememberPlace } from '@/lib/routeHistory';
import { planRoute, pointFromCoords, type RoutePoint, type RouteResult, type TravelMode } from '@/lib/routing';
import CityPickerBar from '@/components/map/CityPickerBar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { lookupCity } from '@/lib/cityCoordinates';
import { isAllTurkeyCity } from '@/lib/turkeyScope';
import { fetchPlaceCatalog, gisPlacesToListings } from '@/services/gisApi';
import { bootPlaceVault, getVaultSnapshot, mergeIntoVault, subscribeVault } from '@/lib/placeVault';

interface MapNavigatorProps {
  searchLocation?: AppLocation | null;
  onLocationChange?: (loc: AppLocation) => void;
  onCameraChange?: (lat: number, lng: number, zoom: number) => void;
  onResultsOpenChange?: (open: boolean) => void;
}

export default function MapNavigator({ searchLocation, onLocationChange, onCameraChange, onResultsOpenChange }: MapNavigatorProps) {
  const hasChosenPlace = Boolean(searchLocation?.city || searchLocation?.district);
  const geo = useGeolocation({ autoStart: false });

  const [dbListings, setDbListings] = useState<DirectoryListing[]>(() => getVaultSnapshot());
  const [dbLoading, setDbLoading] = useState(true);

  const { selected: selectedCategories, search, setCategories: setSelectedCategories } = usePersistedMapFilters();
  const [bounds, setBounds] = useState<MapBounds | null>(() => {
    const seed = searchLocation ?? FALLBACK_MAP_CENTER;
    const city = resolveCatalogCity({
      city: seed.city,
      country: seed.country,
      district: seed.district,
      lat: seed.lat,
      lng: seed.lng,
    });
    return getCityBoundingBox(city?.name || seed.city, 22) ?? bboxAround(seed.lat, seed.lng, 22);
  });
  const [zoom, setZoom] = useState(() => searchLocation?.zoom ?? 14);

  const [customLoc, setCustomLoc] = useState<{ lat: number; lng: number; label: string; zoom?: number } | null>(
    searchLocation ? { lat: searchLocation.lat, lng: searchLocation.lng, label: searchLocation.label, zoom: searchLocation.zoom } : null,
  );

  const [selected, setSelected] = useState<DirectoryListing | null>(null);
  const [focusedItem, setFocusedItem] = useState<DirectoryListing | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [flyToken, setFlyToken] = useState(0);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [originPoint, setOriginPoint] = useState<RoutePoint | null>(null);
  const [destPoint, setDestPoint] = useState<RoutePoint | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [pickOnMap, setPickOnMap] = useState(false);
  const [routeField, setRouteField] = useState<'origin' | 'dest'>('origin');
  const [navigating, setNavigating] = useState(false);
  const [geoBannerDismissed, setGeoBannerDismissed] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);
  const pendingLocate = useRef(false);
  const mapCommands = useRef<MapCommandApi | null>(null);
  const { preview, show: showPreview, hide: hidePreview, clear: clearPreview } = usePlacePreview();

  useEffect(() => subscribeVault(() => setDbListings(getVaultSnapshot())), []);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 4000);
    const cityEn = isAllTurkeyCity(searchLocation?.city) ? undefined : lookupCity(searchLocation?.city)?.en;
    void bootPlaceVault();
    setDbListings(getVaultSnapshot());
    (async () => {
      const supabasePromise = supabase.from('directory_listings').select('*').order('sort_order').abortSignal(ctrl.signal)
        .then(({ data }) => (data ?? []) as DirectoryListing[])
        .catch(() => [] as DirectoryListing[]);
      const [rows, gisRows] = await Promise.all([
        supabasePromise,
        fetchPlaceCatalog({ city: cityEn, limit: 5000 }).catch(() => []),
      ]);
      if (cancelled) return;
      const incoming = [...gisPlacesToListings(gisRows), ...rows];
      if (incoming.length) mergeIntoVault(incoming);
      setDbListings(getVaultSnapshot());
      setDbLoading(false);
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [searchLocation?.city]);

  const lastFocus = useRef<AppLocation | null>(searchLocation ?? null);

  const flyToLocation = useCallback((next: AppLocation, opts?: { resetRoute?: boolean }) => {
    const safe = safeMapCenter(next.lat, next.lng, next.zoom);
    lastFocus.current = next;
    setCustomLoc({ ...safe, label: next.label });
    setZoom(safe.zoom);
    setFollowUser(false);
    setFlyToken((t) => t + 1);
    const cityBox = next.poiId
      ? bboxAround(safe.lat, safe.lng, 1.2)
      : next.district
        ? bboxAround(safe.lat, safe.lng, 6)
        : getCityBoundingBox(
          resolveCatalogCity({
            city: next.city,
            country: next.country,
            district: next.district,
            lat: safe.lat,
            lng: safe.lng,
          })?.name || next.city,
          22,
        ) ?? bboxAround(safe.lat, safe.lng, 22);
    if (cityBox) setBounds(cityBox);
    if (opts?.resetRoute !== false) {
      setRouteData(null);
      setOriginPoint(null);
      setDestPoint(null);
      setSelected(null);
      setFocusedItem(null);
      setNavigating(false);
    }
    if (next.categoryKey) setSelectedCategories([next.categoryKey]);
  }, [setSelectedCategories]);

  useEffect(() => {
    if (!searchLocation) return;
    if (lastFocus.current && locationsEqual(lastFocus.current, searchLocation)) return;
    flyToLocation(searchLocation, { resetRoute: !searchLocation.poiId });
  }, [searchLocation, flyToLocation]);

  const handleCitySelect = useCallback((next: AppLocation) => {
    flyToLocation(next);
    onLocationChange?.(next);
  }, [flyToLocation, onLocationChange]);

  const awaitingGpsOrigin = useRef(false);

  useEffect(() => {
    if (!geo.position) return;
    if (pendingLocate.current) {
      pendingLocate.current = false;
      setCustomLoc(null);
      setFollowUser(true);
      setFlyToken((t) => t + 1);
    }
    if (!awaitingGpsOrigin.current) return;
    awaitingGpsOrigin.current = false;
    setOriginPoint({
      label: 'موقعي الحالي',
      lat: geo.position.lat,
      lng: geo.position.lng,
      source: 'gps',
    });
  }, [geo.position]);

  useEffect(() => {
    if (!originPoint || !destPoint) {
      setRouteData(null);
      setRouteLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setRouteLoading(true);
    setRouteError(null);
    void planRoute(originPoint, destPoint, travelMode, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setRouteData(result);
        if (!result) setRouteError('تعذر حساب المسار بين النقطتين');
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setRouteError('تعذر حساب المسار بين النقطتين');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setRouteLoading(false);
      });
    return () => ctrl.abort();
  }, [originPoint, destPoint, travelMode]);

  const origin = useMemo(() => {
    if (customLoc) return { lat: customLoc.lat, lng: customLoc.lng };
    if (!hasChosenPlace && geo.position) return { lat: geo.position.lat, lng: geo.position.lng };
    return { lat: FALLBACK_MAP_CENTER.lat, lng: FALLBACK_MAP_CENTER.lng };
  }, [customLoc, geo.position, hasChosenPlace]);

  const mapCenter = (() => {
    if (navigating && geo.position) {
      return safeMapCenter(geo.position.lat, geo.position.lng, 17);
    }
    if (customLoc) {
      const safe = safeMapCenter(customLoc.lat, customLoc.lng, customLoc.zoom ?? searchLocation?.zoom ?? 14);
      return { ...safe };
    }
    if (!hasChosenPlace && followUser && geo.position) {
      return safeMapCenter(geo.position.lat, geo.position.lng, 16);
    }
    return {
      lat: DEFAULT_MAP_CENTER.lat,
      lng: DEFAULT_MAP_CENTER.lng,
      zoom: DEFAULT_MAP_CENTER.zoom,
    };
  })();

  const hotelsOnly = selectedCategories.length === 1 && selectedCategories[0] === 'hotels';
  const diningOnly = selectedCategories.length === 1 && selectedCategories[0] === 'restaurants';
  const catalogCity = resolveCatalogCity({
    city: searchLocation?.city || FALLBACK_MAP_CENTER.city,
    country: searchLocation?.country || FALLBACK_MAP_CENTER.country,
    district: searchLocation?.district,
    lat: origin.lat,
    lng: origin.lng,
  });

  const { listings, categoryCounts, scopedTotal, loading, error, errorMessage, tooZoomedOut, fromFallback, refetch } = usePlacesQuery({
    bounds,
    zoom,
    categories: selectedCategories,
    search,
    dbListings,
    origin,
    locationCity: catalogCity?.name || searchLocation?.city || FALLBACK_MAP_CENTER.city,
    locationCountry: catalogCity?.country || searchLocation?.country || FALLBACK_MAP_CENTER.country,
    locationDistrict: searchLocation?.district,
  });

  const calcDistanceKm = useCallback((lat: number, lng: number): number | null => {
    if (!origin) return null;
    return haversineKm(origin.lat, origin.lng, lat, lng);
  }, [origin]);

  const formatDistance = useCallback((km: number) => (
    km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`
  ), []);

  const listDistanceLabel = useCallback((item: DirectoryListing) => {
    const km = calcDistanceKm(item.lat, item.lng);
    return km == null ? null : formatDistance(km);
  }, [calcDistanceKm, formatDistance]);

  const poiListing = useMemo(() => {
    const poiId = searchLocation?.poiId;
    if (!poiId) return null;
    const mission = getMissionById(poiId);
    if (mission) return missionToListing(mission);
    const fromLists = listings.find((item) => item.id === poiId)
      || dbListings.find((item) => item.id === poiId)
      || getVaultSnapshot().find((item) => item.id === poiId);
    if (fromLists) return fromLists;
    if (!Number.isFinite(searchLocation.lat) || !Number.isFinite(searchLocation.lng)) return null;
    return {
      id: poiId,
      category_key: searchLocation.categoryKey || 'attractions',
      category_label: searchLocation.categoryKey || 'موقع',
      name: searchLocation.label,
      description: searchLocation.district || '',
      country_name: searchLocation.country || '',
      city: searchLocation.city || '',
      address: searchLocation.district || searchLocation.label,
      image: '',
      rating: 0,
      price_level: '',
      tags: [],
      proximity_note: `${searchLocation.lat.toFixed(5)}, ${searchLocation.lng.toFixed(5)}`,
      phone: '',
      hours: '',
      is_featured: true,
      sort_order: -80,
      lat: searchLocation.lat,
      lng: searchLocation.lng,
      metro_station_name: '',
      metro_walk_minutes: 0,
      review_count: 0,
      created_at: '',
      nav_query: `${searchLocation.lat},${searchLocation.lng}`,
    } satisfies DirectoryListing;
  }, [dbListings, listings, searchLocation]);

  const drawerListings = useMemo(() => {
    if (!searchLocation?.poiId) return listings;
    const cluster = listings.filter((item) => (
      haversineKm(searchLocation.lat, searchLocation.lng, item.lat, item.lng) <= 2.4
    ));
    const pin = poiListing && !cluster.some((item) => item.id === poiListing.id)
      ? poiListing
      : cluster.find((item) => item.id === searchLocation.poiId) || poiListing;
    const pool = cluster.length ? cluster : listings;
    const rest = pool.filter((item) => item.id !== pin?.id);
    return pin ? [pin, ...rest] : pool;
  }, [listings, poiListing, searchLocation?.lat, searchLocation?.lng, searchLocation?.poiId]);

  const categoryFilterActive = !isAllCategoriesSelected(selectedCategories);
  const showResultsList = categoryFilterActive && !selected && !directionsOpen && !navigating;

  useEffect(() => {
    onResultsOpenChange?.(showResultsList);
  }, [onResultsOpenChange, showResultsList]);

  const estWalkTime = (km: number) => {
    const m = Math.round((km / 5) * 60);
    return m < 60 ? `${m} دقيقة` : `${Math.floor(m / 60)} س ${m % 60} د`;
  };
  const estDriveTime = (km: number) => {
    const m = Math.max(1, Math.round((km / 35) * 60));
    return m < 60 ? `${m} د` : `${Math.floor(m / 60)} س ${m % 60} د`;
  };

  const applyRoutePoint = useCallback((field: 'origin' | 'dest', point: RoutePoint) => {
    rememberPlace(point);
    if (field === 'origin') setOriginPoint(point);
    else setDestPoint(point);
    setPickOnMap(false);
  }, []);

  const requestMyLocation = useCallback(() => {
    setLocationAttempted(true);
    pendingLocate.current = true;
    awaitingGpsOrigin.current = true;
    geo.start();
    setFollowUser(true);
    if (geo.position) {
      pendingLocate.current = false;
      awaitingGpsOrigin.current = false;
      setCustomLoc(null);
      setFlyToken((t) => t + 1);
      setOriginPoint({
        label: 'موقعي الحالي',
        lat: geo.position.lat,
        lng: geo.position.lng,
        source: 'gps',
      });
    }
  }, [geo]);

  const ensureGpsOrigin = useCallback(() => {
    if (!geo.position) return;
    const sameAsDest = (lat: number, lng: number) => {
      if (!destPoint) return false;
      return Math.abs(lat - destPoint.lat) < 0.00025
        && Math.abs(lng - destPoint.lng) < 0.00025;
    };
    if (sameAsDest(geo.position.lat, geo.position.lng)) return;
    setOriginPoint({
      label: 'موقعي الحالي',
      lat: geo.position.lat,
      lng: geo.position.lng,
      source: 'gps',
    });
  }, [destPoint, geo.position]);

  useEffect(() => {
    if (!searchLocation?.poiId || !poiListing) return;
    const mission = getMissionById(searchLocation.poiId);
    setSelected(poiListing);
    setFocusedItem(poiListing);
    if (!mission) return;
    setDestPoint({
      label: mission.nameAr,
      lat: mission.lat,
      lng: mission.lng,
      source: 'geocode',
    });
    setDirectionsOpen(true);
    if (geo.position) {
      setOriginPoint({
        label: 'موقعي الحالي',
        lat: geo.position.lat,
        lng: geo.position.lng,
        source: 'gps',
      });
    } else {
      setOriginPoint(null);
    }
  }, [geo.position, poiListing, searchLocation?.poiId]);

  const handleItemClick = useCallback((item: DirectoryListing) => {
    clearPreview();
    setFocusedItem(item);
    setFiltersOpen(false);
    if (directionsOpen || navigating) {
      const point = pointFromCoords(item.lat, item.lng, item.name, 'place');
      if (point) applyRoutePoint(routeField, point);
      if (geo.position) ensureGpsOrigin();
      return;
    }
    setSelected(item);
  }, [applyRoutePoint, clearPreview, directionsOpen, ensureGpsOrigin, geo.position, navigating, routeField]);

  const handleCategoriesChange = useCallback((next: string[]) => {
    setFocusedItem(null);
    setSelected(null);
    setSelectedCategories(next);
    setFiltersOpen(false);
  }, [setSelectedCategories]);

  const dismissResults = useCallback(() => {
    setFocusedItem(null);
    setSelected(null);
    setSelectedCategories([...DEFAULT_CATEGORY_KEYS]);
  }, [setSelectedCategories]);

  const openDirections = () => {
    if (!selected && !destPoint) return;
    const fromPlace = selected
      ? pointFromCoords(selected.lat, selected.lng, selected.name, 'place')
      : destPoint;
    if (!fromPlace) return;
    rememberPlace(fromPlace);
    setDestPoint(fromPlace);
    if (selected) setFocusedItem(selected);
    setSelected(null);
    setFiltersOpen(false);
    setDirectionsOpen(true);
    setTravelMode((m) => (m === 'walking' ? 'walking' : 'driving'));
    setRouteField('origin');
    if (geo.position) ensureGpsOrigin();
  };

  const closeDirections = () => {
    setDirectionsOpen(false);
    setPickOnMap(false);
    if (focusedItem && !navigating) {
      setSelected(focusedItem);
    }
  };

  const startLiveNavigation = () => {
    if (!destPoint) return;
    if (travelMode !== 'walking') setTravelMode('driving');
    ensureGpsOrigin();
    setNavigating(true);
    setDirectionsOpen(false);
    setSelected(null);
    setFollowUser(true);
    setFlyToken((t) => t + 1);
    if (!geo.position) requestMyLocation();
  };

  const stopLiveNavigation = () => {
    setNavigating(false);
    setFollowUser(false);
    setDirectionsOpen(true);
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const fallback = pointFromCoords(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'map');
    if (!fallback) return;
    try {
      const hit = await reverseGeocode(lat, lng);
      if (hit?.name) fallback.label = hit.name;
    } catch {
      /* coords label is enough */
    }
    applyRoutePoint(routeField, fallback);
  }, [applyRoutePoint, routeField]);

  const swapRoute = () => {
    if (!originPoint || !destPoint) return;
    setOriginPoint(destPoint);
    setDestPoint(originPoint);
  };

  const locateMe = () => {
    if (followUser && (geo.status === 'watching' || geo.status === 'prompt')) {
      geo.stop();
      setFollowUser(false);
      pendingLocate.current = false;
      awaitingGpsOrigin.current = false;
      return;
    }
    requestMyLocation();
  };

  const onViewportChange = useCallback((nextBounds: MapBounds, nextZoom: number, center: { lat: number; lng: number }) => {
    setZoom(nextZoom);
    setBounds((prev) => {
      if (!prev) return nextBounds;
      const dLat = Math.abs(nextBounds.south - prev.south) + Math.abs(nextBounds.north - prev.north);
      const dLng = Math.abs(nextBounds.west - prev.west) + Math.abs(nextBounds.east - prev.east);
      if (dLat < 0.04 && dLng < 0.04) return prev;
      return nextBounds;
    });
    onCameraChange?.(center.lat, center.lng, nextZoom);
  }, [onCameraChange]);

  const onActiveFieldChange = useCallback((field: 'origin' | 'dest') => {
    setRouteField(field);
  }, []);

  const selectedDist = selected && geo.position
    ? haversineKm(geo.position.lat, geo.position.lng, selected.lat, selected.lng)
    : null;

  return (
    <div className="on-dark relative h-[calc(100dvh-4rem)] overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 z-0 isolate overflow-hidden">
        <ErrorBoundary label="الخريطة" resetKey={`${searchLocation?.city || ''}:${selectedCategories.join(',')}`}>
          <MapView
            center={mapCenter}
            flyToken={flyToken}
            listings={searchLocation?.poiId ? drawerListings : listings}
            focusedItem={directionsOpen || navigating ? null : focusedItem}
            highlightedId={navigating ? null : preview?.place.id}
            userPosition={geo.position}
            followUser={followUser || navigating}
            route={routeData}
            dataLoading={loading}
            dataError={error}
            errorMessage={errorMessage}
            onRetry={() => { void refetch(); }}
            onViewportChange={onViewportChange}
            onSelect={handleItemClick}
            onPreview={navigating ? undefined : showPreview}
            onPreviewEnd={hidePreview}
            onUserDrag={() => {
              hidePreview();
              if (!navigating) setFollowUser(false);
            }}
            originPoint={originPoint}
            destPoint={destPoint}
            pickOnMap={directionsOpen && pickOnMap}
            onMapClick={handleMapClick}
            directionsOpen={directionsOpen}
            navigating={navigating}
            fitListings={(hotelsOnly || diningOnly) && !searchLocation?.district && !searchLocation?.poiId}
            fitListingsToken={hotelsOnly ? 'hotels' : diningOnly ? 'dining' : ''}
            commandsRef={mapCommands}
          />
        </ErrorBoundary>
      </div>

      {!navigating && (
      <div className="absolute inset-0 z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            setDirectionsOpen(false);
            setFiltersOpen((open) => !open);
          }}
          className={`map-overlay-filter pointer-events-auto w-12 h-12 rounded-2xl border shadow-xl flex items-center justify-center cursor-pointer ${
            filtersOpen || categoryFilterActive
              ? 'bg-brand-400 border-brand-300 text-neutral-950'
              : 'bg-white/95 border-white/80 text-neutral-800 dark:bg-neutral-950/90 dark:border-white/10 dark:text-white'
          }`}
          aria-label="التصنيفات"
          aria-pressed={filtersOpen || categoryFilterActive}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
        <div className="map-overlay-search pointer-events-auto" dir="rtl">
          <CityPickerBar location={searchLocation} onSelect={handleCitySelect} />
        </div>
        {(tooZoomedOut || (loading && listings.length === 0) || error || fromFallback || (locationAttempted && (geo.status === 'denied' || geo.status === 'unavailable') && !geoBannerDismissed)) && (
          <div className="map-overlay-banners pointer-events-auto flex flex-wrap items-center justify-center gap-1.5">
            {loading && listings.length === 0 && (
              <span className="bg-black/60 text-brand-200 rounded-full px-3 py-1.5 text-[11px]">جاري تحديث الأماكن...</span>
            )}
            {fromFallback && !loading && (
              <span className="bg-black/60 text-zinc-100 rounded-full px-3 py-1.5 text-[11px]">عرض أماكن إرشادية ريثما تتوفر البيانات الحية</span>
            )}
            {tooZoomedOut && <span className="bg-black/60 text-amber-200 rounded-full px-3 py-1.5 text-[11px]">قرّب الخريطة لعرض الأماكن الحية</span>}
            {error && !loading && listings.length === 0 && (
              <button type="button" onClick={() => { void refetch(); }} className="bg-black/60 text-amber-200 rounded-full px-3 py-1.5 text-[11px] cursor-pointer">
                تعذر جلب البيانات — اضغط لإعادة المحاولة
              </button>
            )}
            {(locationAttempted && (geo.status === 'denied' || geo.status === 'unavailable') && !geoBannerDismissed) && (
              <span className="inline-flex items-center gap-2 max-w-full bg-black/70 text-amber-100 rounded-full px-3 py-1.5 border border-amber-400/30 text-[11px]">
                <span className="truncate">{geo.error || 'لم يتم تفعيل الموقع — يمكنك البحث أو تحريك الخريطة يدوياً'}</span>
                <button type="button" onClick={locateMe} className="underline cursor-pointer shrink-0">تفعيل</button>
                <button type="button" onClick={() => setGeoBannerDismissed(true)} className="cursor-pointer shrink-0" aria-label="إغلاق">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      )}

      {!navigating && (
        <div className="map-overlay-dock absolute z-[55] pointer-events-none">
          <div dir="ltr" className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-neutral-900/95">
            <button
              type="button"
              onClick={() => mapCommands.current?.zoomIn()}
              className="w-11 h-11 flex items-center justify-center text-neutral-800 hover:bg-slate-100 cursor-pointer dark:text-white dark:hover:bg-white/10"
              aria-label="تكبير"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => mapCommands.current?.zoomOut()}
              className="w-11 h-11 flex items-center justify-center text-neutral-800 hover:bg-slate-100 cursor-pointer border-t border-slate-200 dark:text-white dark:hover:bg-white/10 dark:border-white/10"
              aria-label="تصغير"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={locateMe}
              className={`w-11 h-11 flex items-center justify-center cursor-pointer border-t border-slate-200 dark:border-white/10 ${
                followUser ? 'bg-brand-400 text-neutral-950' : 'text-neutral-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10'
              }`}
              aria-label={followUser ? 'إيقاف موقعي الحالي' : 'موقعي الحالي'}
              aria-pressed={followUser}
            >
              <Navigation className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(false);
                setDirectionsOpen((open) => !open);
              }}
              className={`w-11 h-11 flex items-center justify-center cursor-pointer border-t border-slate-200 dark:border-white/10 ${
                directionsOpen
                  ? 'bg-[#e8f0fe] text-[#1a73e8]'
                  : 'text-[#1a73e8] hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
              aria-label="من وإلى"
              aria-pressed={directionsOpen}
            >
              <Route className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {navigating && (
        <div className="absolute z-40 right-3 bottom-6 pointer-events-auto">
          <button
            type="button"
            onClick={locateMe}
            className={`w-11 h-11 rounded-2xl border shadow-xl flex items-center justify-center cursor-pointer ${
              followUser ? 'bg-brand-400 border-brand-300 text-neutral-950' : 'bg-white/95 border-white/80 text-neutral-800'
            }`}
            aria-label={followUser ? 'إيقاف موقعي الحالي' : 'موقعي الحالي'}
            aria-pressed={followUser}
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      )}

      {!navigating && (
      <div className="absolute top-[5.75rem] left-3 z-40 pointer-events-none hidden md:block">
        {directionsOpen && (
          <div className="pointer-events-auto w-[380px] max-h-[calc(100dvh-8rem)]">
            <DirectionsPanel
              origin={originPoint}
              destination={destPoint}
              destinationPlace={focusedItem}
              userLocation={geo.position}
              nearbyPlaces={listings}
              mode={travelMode}
              route={routeData}
              loading={routeLoading}
              error={routeError}
              pickOnMap={pickOnMap}
              onModeChange={setTravelMode}
              onOriginChange={setOriginPoint}
              onDestinationChange={setDestPoint}
              onActiveFieldChange={onActiveFieldChange}
              onSwap={swapRoute}
              onClose={closeDirections}
              onUseMyLocation={() => {
                requestMyLocation();
              }}
              onPickOnMapChange={setPickOnMap}
              onStartNavigation={startLiveNavigation}
            />
          </div>
        )}
      </div>
      )}

      {!navigating && directionsOpen && (
        <div className="absolute z-50 inset-x-3 top-[5.75rem] md:hidden pointer-events-auto max-h-[min(52vh,420px)]">
          <DirectionsPanel
            origin={originPoint}
            destination={destPoint}
            destinationPlace={focusedItem}
            userLocation={geo.position}
            nearbyPlaces={listings}
            mode={travelMode}
            route={routeData}
            loading={routeLoading}
            error={routeError}
            pickOnMap={pickOnMap}
            onModeChange={setTravelMode}
            onOriginChange={setOriginPoint}
            onDestinationChange={setDestPoint}
            onActiveFieldChange={onActiveFieldChange}
            onSwap={swapRoute}
            onClose={closeDirections}
            onUseMyLocation={() => {
              requestMyLocation();
            }}
            onPickOnMapChange={setPickOnMap}
            onStartNavigation={startLiveNavigation}
          />
        </div>
      )}

      {navigating && destPoint && (
        <LiveNavOverlay
          destination={destPoint}
          route={routeData}
          loading={routeLoading}
          mode={travelMode === 'walking' ? 'walking' : 'driving'}
          userPosition={geo.position}
          onStop={stopLiveNavigation}
        />
      )}

      {!navigating && showResultsList && (
        <div
          className="absolute z-50 right-3 top-[5.75rem] bottom-3 w-[340px] pointer-events-none hidden md:flex flex-col"
          onWheel={(e) => e.stopPropagation()}
        >
          <ErrorBoundary label="قائمة الأماكن" resetKey={selectedCategories.join(',')}>
            <PlacesDrawer count={drawerListings.length} onDismiss={dismissResults}>
              <PlacesList
                items={drawerListings}
                loading={(loading || dbLoading) && drawerListings.length === 0}
                activeId={focusedItem?.id}
                hoveredId={preview?.place.id}
                scrollToId={preview?.source === 'marker' ? preview.place.id : preview ? undefined : focusedItem?.id}
                onSelect={handleItemClick}
                onPreview={showPreview}
                onPreviewEnd={hidePreview}
                formatDistance={listDistanceLabel}
              />
            </PlacesDrawer>
          </ErrorBoundary>
        </div>
      )}

      {!navigating && showResultsList && (
        <div className="absolute z-50 inset-x-0 bottom-0 md:hidden pointer-events-none">
          <ErrorBoundary label="قائمة الأماكن" resetKey={selectedCategories.join(',')}>
            <ResultsBottomSheet count={drawerListings.length} onDismiss={dismissResults}>
              <PlacesList
                compact
                items={drawerListings}
                loading={(loading || dbLoading) && drawerListings.length === 0}
                activeId={focusedItem?.id}
                hoveredId={preview?.place.id}
                scrollToId={preview?.source === 'marker' ? preview.place.id : preview ? undefined : focusedItem?.id}
                onSelect={handleItemClick}
                formatDistance={listDistanceLabel}
              />
            </ResultsBottomSheet>
          </ErrorBoundary>
        </div>
      )}

      <CategoryFilterSheet
        open={filtersOpen && !navigating}
        selected={selectedCategories}
        onChange={handleCategoriesChange}
        onClose={() => setFiltersOpen(false)}
        counts={categoryCounts}
        total={scopedTotal}
      />

      {selected && !directionsOpen && !navigating && (
        <PlaceDetailsSheet
          place={selected}
          distanceLabel={selectedDist != null
            ? (selectedDist > 3
              ? `${formatDistance(selectedDist)} • ${estDriveTime(selectedDist)} بالسيارة`
              : `${formatDistance(selectedDist)} • ${estWalkTime(selectedDist)} مشياً`)
            : null}
          origin={geo.position}
          onClose={() => {
            setSelected(null);
          }}
          onInternalNavigate={openDirections}
          onStartNavigation={startLiveNavigation}
        />
      )}

      {preview && !selected && !navigating && preview.source === 'marker' && (
        <PlaceHoverCard
          place={preview.place}
          x={preview.x}
          y={preview.y}
          source={preview.source}
        />
      )}
    </div>
  );
}
