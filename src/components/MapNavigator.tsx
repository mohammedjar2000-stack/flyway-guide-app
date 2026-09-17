import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair, List, Navigation, Route, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { haversineKm, type MapBounds } from '@/lib/geo';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlacesQuery } from '@/hooks/usePlacesQuery';
import { usePersistedMapFilters } from '@/hooks/usePersistedMapFilters';
import type { DirectoryListing } from '@/types';
import MapView from '@/components/map/MapView';
import CategoryFilterBar from '@/components/map/CategoryFilterBar';
import PlaceDetailsSheet from '@/components/map/PlaceDetailsSheet';
import PlacesList from '@/components/map/PlacesList';
import PlacesDrawer from '@/components/map/PlacesDrawer';
import PlaceHoverCard from '@/components/map/PlaceHoverCard';
import DirectionsPanel from '@/components/map/DirectionsPanel';
import LiveNavOverlay from '@/components/map/LiveNavOverlay';
import { usePlacePreview } from '@/hooks/usePlacePreview';
import { DEFAULT_MAP_CENTER } from '@/lib/mapConfig';
import { FALLBACK_MAP_CENTER, bboxAround, getCityBoundingBox, locationIdentityEqual, resolveCatalogCity, safeMapCenter, type AppLocation } from '@/lib/cityCoordinates';
import { getMissionById, missionToListing } from '@/lib/iraqiMissions';
import { reverseGeocode } from '@/services/geocode';
import { rememberPlace } from '@/lib/routeHistory';
import { planRoute, pointFromCoords, type RoutePoint, type RouteResult, type TravelMode } from '@/lib/routing';
import CityPickerBar from '@/components/map/CityPickerBar';

interface MapNavigatorProps {
  searchLocation?: AppLocation | null;
  onLocationChange?: (loc: AppLocation) => void;
  onCameraChange?: (lat: number, lng: number, zoom: number) => void;
}

export default function MapNavigator({ searchLocation, onLocationChange, onCameraChange }: MapNavigatorProps) {
  const hasChosenPlace = Boolean(searchLocation?.city || searchLocation?.district);
  const geo = useGeolocation({ autoStart: false });

  const [dbListings, setDbListings] = useState<DirectoryListing[]>([]);
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
  const [zoom, setZoom] = useState(14);

  const [customLoc, setCustomLoc] = useState<{ lat: number; lng: number; label: string; zoom?: number } | null>(
    searchLocation ? { lat: searchLocation.lat, lng: searchLocation.lng, label: searchLocation.label, zoom: searchLocation.zoom } : null,
  );

  const [selected, setSelected] = useState<DirectoryListing | null>(null);
  const [focusedItem, setFocusedItem] = useState<DirectoryListing | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [flyToken, setFlyToken] = useState(0);
  const [listExpanded, setListExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = window.localStorage.getItem('flyway.placesPane');
      if (saved === 'collapsed') return false;
      if (saved === 'expanded') return true;
    } catch {
      /* ignore */
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  });

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
  const { preview, show: showPreview, hide: hidePreview, clear: clearPreview } = usePlacePreview();

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 4000);
    (async () => {
      try {
        const { data: l } = await supabase.from('directory_listings').select('*').order('sort_order').abortSignal(ctrl.signal);
        if (!ctrl.signal.aborted) setDbListings(l ?? []);
      } catch {
        if (!ctrl.signal.aborted) setDbListings([]);
      } finally {
        window.clearTimeout(timer);
        if (!ctrl.signal.aborted) setDbLoading(false);
      }
    })();
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  const lastFocus = useRef<AppLocation | null>(null);

  const flyToLocation = useCallback((next: AppLocation, opts?: { resetRoute?: boolean }) => {
    const safe = safeMapCenter(next.lat, next.lng, next.zoom);
    lastFocus.current = next;
    setCustomLoc({ ...safe, label: next.label });
    setZoom(safe.zoom);
    setFollowUser(false);
    setFlyToken((t) => t + 1);
    const cityBox = next.poiId
      ? bboxAround(safe.lat, safe.lng, 1.2)
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
    if (lastFocus.current && locationIdentityEqual(lastFocus.current, searchLocation)) return;
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
    try {
      window.localStorage.setItem('flyway.placesPane', listExpanded ? 'expanded' : 'collapsed');
    } catch {
      /* ignore */
    }
  }, [listExpanded]);

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

  const { listings, loading, error, errorMessage, tooZoomedOut, fromFallback, refetch } = usePlacesQuery({
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

  const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`);
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
    if (!searchLocation?.poiId) return;
    const mission = getMissionById(searchLocation.poiId);
    if (!mission) return;
    const listing = missionToListing(mission);
    setDestPoint({
      label: mission.nameAr,
      lat: mission.lat,
      lng: mission.lng,
      source: 'geocode',
    });
    setSelected(listing);
    setFocusedItem(listing);
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
  }, [searchLocation?.poiId, searchLocation?.lat, searchLocation?.lng]);

  const handleItemClick = useCallback((item: DirectoryListing) => {
    clearPreview();
    const point = pointFromCoords(item.lat, item.lng, item.name, 'place');
    if (point) applyRoutePoint('dest', point);
    setFocusedItem(item);
    setListExpanded(false);
    if (geo.position) ensureGpsOrigin();
    if (directionsOpen || navigating) return;
    setSelected(item);
  }, [applyRoutePoint, clearPreview, directionsOpen, navigating, ensureGpsOrigin, geo.position]);

  const handleCategoriesChange = useCallback((next: string[]) => {
    setFocusedItem(null);
    setSelected(null);
    setSelectedCategories(next);
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
    setDirectionsOpen(true);
    setTravelMode((m) => (m === 'walking' ? 'walking' : 'driving'));
    setRouteField('origin');
    setListExpanded(false);
    if (geo.position) ensureGpsOrigin();
  };

  const closeDirections = () => {
    setDirectionsOpen(false);
    setPickOnMap(false);
    if (focusedItem && !navigating) {
      setSelected(focusedItem);
      setListExpanded(false);
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
    applyRoutePoint('dest', fallback);
    setSelected(null);
    setDirectionsOpen(true);
    if (geo.position && !originPoint) {
      setOriginPoint({
        label: 'موقعي الحالي',
        lat: geo.position.lat,
        lng: geo.position.lng,
        source: 'gps',
      });
    }
  }, [applyRoutePoint, originPoint, geo.position]);

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
        <MapView
            center={mapCenter}
            flyToken={flyToken}
            listings={listings}
            focusedItem={directionsOpen || navigating ? null : focusedItem}
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
            pickOnMap={!navigating}
            onMapClick={handleMapClick}
            directionsOpen={directionsOpen}
            navigating={navigating}
            fitListings={hotelsOnly || diningOnly}
            fitListingsToken={hotelsOnly ? 'hotels' : diningOnly ? 'dining' : ''}
          />
      </div>

      {!navigating && (
      <div className="absolute top-3 inset-x-3 bottom-4 z-40 pointer-events-none flex flex-col items-stretch gap-2">
        <div className="pointer-events-auto shrink-0 flex flex-col gap-2">
          <CityPickerBar location={searchLocation} onSelect={handleCitySelect} />
          <div className="gmaps-surface min-w-0 rounded-2xl bg-white/95 shadow-[0_2px_8px_rgba(60,64,67,0.18)] border border-black/[0.06] dark:bg-neutral-900/90 dark:border-white/10">
            <CategoryFilterBar selected={selectedCategories} onChange={handleCategoriesChange} />
          </div>
        </div>
        {(customLoc || tooZoomedOut || (loading && listings.length === 0) || error || fromFallback || (locationAttempted && (geo.status === 'denied' || geo.status === 'unavailable') && !geoBannerDismissed)) && (
          <div className="pointer-events-auto shrink-0 flex flex-wrap items-center gap-2 text-[11px]">
            {customLoc && (
              <span className="inline-flex items-center gap-1.5 bg-black/55 text-white rounded-full px-3 py-1 border border-white/10">
                <Crosshair className="w-3 h-3 text-brand-300" />
                {customLoc.label}
                <button type="button" onClick={() => setCustomLoc(null)} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {loading && listings.length === 0 && (
              <span className="bg-black/55 text-brand-200 rounded-full px-3 py-1">جاري تحديث الأماكن...</span>
            )}
            {fromFallback && !loading && (
              <span className="bg-black/55 text-zinc-100 rounded-full px-3 py-1">عرض أماكن إرشادية ريثما تتوفر البيانات الحية</span>
            )}
            {tooZoomedOut && <span className="bg-black/55 text-amber-200 rounded-full px-3 py-1">قرّب الخريطة لعرض الأماكن الحية</span>}
            {error && !loading && listings.length === 0 && (
              <button type="button" onClick={() => { void refetch(); }} className="bg-black/55 text-amber-200 rounded-full px-3 py-1 cursor-pointer">
                تعذر جلب البيانات — اضغط لإعادة المحاولة
              </button>
            )}
            {(locationAttempted && (geo.status === 'denied' || geo.status === 'unavailable') && !geoBannerDismissed) && (
              <span className="inline-flex items-center gap-2 bg-black/70 text-amber-100 rounded-full px-3 py-1 border border-amber-400/30">
                <span>{geo.error || 'لم يتم تفعيل الموقع — يمكنك البحث أو تحريك الخريطة يدوياً'}</span>
                <button type="button" onClick={locateMe} className="underline cursor-pointer">تفعيل</button>
                <button type="button" onClick={() => setGeoBannerDismissed(true)} className="cursor-pointer" aria-label="إغلاق">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 flex items-stretch gap-3 relative z-50" dir="ltr">
          {directionsOpen && (
            <div className="pointer-events-auto w-full lg:w-[380px] shrink-0 min-h-0 max-h-[58vh] lg:max-h-none lg:my-0">
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

      <div className={`absolute z-40 end-4 flex flex-col gap-2 ${
        !navigating && !directionsOpen && listExpanded ? 'bottom-[min(58vh,580px)]' : 'bottom-24'
      }`}>
        {!directionsOpen && !navigating && (
        <button
          type="button"
          onClick={() => setDirectionsOpen(true)}
          className="w-12 h-12 rounded-full bg-white border border-slate-200 text-[#1a73e8] shadow-xl flex items-center justify-center cursor-pointer"
          aria-label="من وإلى"
        >
          <Route className="w-5 h-5" />
        </button>
        )}
        {!directionsOpen && !navigating && (
        <button
          type="button"
          onClick={() => setListExpanded((v) => !v)}
          className="w-12 h-12 rounded-full bg-white border-2 border-neutral-900 text-neutral-950 shadow-xl flex items-center justify-center cursor-pointer dark:bg-neutral-950 dark:border-white dark:text-white"
          aria-label={listExpanded ? 'طي قائمة الأماكن' : 'عرض قائمة الأماكن'}
          aria-pressed={listExpanded}
        >
          <List className="w-5 h-5" />
        </button>
        )}
        <button
          type="button"
          onClick={locateMe}
          className={`w-12 h-12 rounded-full border shadow-xl flex items-center justify-center cursor-pointer ${
            followUser ? 'bg-brand-400 border-brand-300 text-neutral-950' : 'bg-neutral-950/90 border-white/15 text-white'
          }`}
          aria-label={followUser ? 'إيقاف موقعي الحالي' : 'موقعي الحالي'}
          aria-pressed={followUser}
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {!navigating && (
        <div className={`absolute z-50 inset-x-3 bottom-3 lg:inset-x-auto lg:w-[360px] lg:end-4 pointer-events-none ${
          directionsOpen ? 'hidden lg:block' : ''
        }`}>
          <PlacesDrawer
            expanded={listExpanded}
            onToggle={() => setListExpanded((v) => !v)}
            count={listings.length}
          >
            <PlacesList
              items={listings}
              loading={(loading || dbLoading) && listings.length === 0}
              activeId={focusedItem?.id}
              onSelect={handleItemClick}
              onPreview={showPreview}
              onPreviewEnd={hidePreview}
              formatDistance={(item) => {
                const km = calcDistanceKm(item.lat, item.lng);
                return km == null ? null : formatDistance(km);
              }}
            />
          </PlacesDrawer>
        </div>
      )}

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

      {preview && !selected && !navigating && (
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
