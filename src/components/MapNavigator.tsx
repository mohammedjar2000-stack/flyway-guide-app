import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronUp, Crosshair, List, Navigation, Route, X,
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
import PlaceHoverCard from '@/components/map/PlaceHoverCard';
import DirectionsPanel from '@/components/map/DirectionsPanel';
import LiveNavOverlay from '@/components/map/LiveNavOverlay';
import { usePlacePreview } from '@/hooks/usePlacePreview';
import { DEFAULT_MAP_CENTER } from '@/lib/mapConfig';
import { FALLBACK_MAP_CENTER, bboxAround, getCityBoundingBox, locationIdentityEqual, resolveCatalogCity, safeMapCenter, type AppLocation } from '@/lib/cityCoordinates';
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
  const geo = useGeolocation({ autoStart: !hasChosenPlace });

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
  const [listOpen, setListOpen] = useState(false);

  const [directionsOpen, setDirectionsOpen] = useState(true);
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
  const didAutoLocate = useRef(false);
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
    const cityBox = getCityBoundingBox(
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
    flyToLocation(searchLocation);
  }, [searchLocation, flyToLocation]);

  const handleCitySelect = useCallback((next: AppLocation) => {
    flyToLocation(next);
    onLocationChange?.(next);
  }, [flyToLocation, onLocationChange]);

  useEffect(() => {
    if (didAutoLocate.current || customLoc || searchLocation || !geo.position) return;
    didAutoLocate.current = true;
    setFollowUser(true);
    setFlyToken((t) => t + 1);
  }, [geo.position, customLoc, searchLocation]);

  const awaitingGpsOrigin = useRef(false);

  useEffect(() => {
    if (!geo.position || !awaitingGpsOrigin.current) return;
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
    if (!hasChosenPlace && geo.position) {
      return safeMapCenter(geo.position.lat, geo.position.lng, 15);
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

  const applyRoutePoint = useCallback((field: 'origin' | 'dest', point: RoutePoint) => {
    rememberPlace(point);
    if (field === 'origin') setOriginPoint(point);
    else setDestPoint(point);
    setPickOnMap(false);
  }, []);

  const ensureGpsOrigin = useCallback(() => {
    if (originPoint?.source === 'gps') return;
    if (geo.position) {
      setOriginPoint({
        label: 'موقعي الحالي',
        lat: geo.position.lat,
        lng: geo.position.lng,
        source: 'gps',
      });
      return;
    }
    if (!originPoint) {
      if (customLoc) {
        setOriginPoint({
          label: customLoc.label || 'نقطة الانطلاق',
          lat: customLoc.lat,
          lng: customLoc.lng,
          source: 'geocode',
        });
      } else if (searchLocation) {
        setOriginPoint({
          label: searchLocation.label || 'نقطة الانطلاق',
          lat: searchLocation.lat,
          lng: searchLocation.lng,
          source: 'geocode',
        });
      }
    }
    awaitingGpsOrigin.current = true;
    geo.start();
  }, [originPoint, geo, customLoc, searchLocation]);

  const handleItemClick = useCallback((item: DirectoryListing) => {
    clearPreview();
    const point = pointFromCoords(item.lat, item.lng, item.name, 'place');
    if (point) applyRoutePoint('dest', point);
    setFocusedItem(item);
    setListOpen(false);
    ensureGpsOrigin();
    if (directionsOpen || navigating) return;
    setSelected(item);
  }, [applyRoutePoint, clearPreview, directionsOpen, navigating, ensureGpsOrigin]);

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
    setListOpen(false);
    ensureGpsOrigin();
  };

  const closeDirections = () => {
    setDirectionsOpen(false);
    setPickOnMap(false);
    if (focusedItem && !navigating) setSelected(focusedItem);
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
    geo.start();
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
    if (!originPoint) {
      if (geo.position) {
        setOriginPoint({
          label: 'موقعي الحالي',
          lat: geo.position.lat,
          lng: geo.position.lng,
          source: 'gps',
        });
      } else {
        awaitingGpsOrigin.current = true;
        geo.start();
      }
    }
  }, [applyRoutePoint, originPoint, geo]);

  const swapRoute = () => {
    if (!originPoint || !destPoint) return;
    setOriginPoint(destPoint);
    setDestPoint(originPoint);
  };

  const locateMe = () => {
    geo.start();
    setCustomLoc(null);
    setFollowUser(true);
    setFlyToken((t) => t + 1);
    if (destPoint && geo.position) {
      applyRoutePoint('origin', {
        label: 'موقعي الحالي',
        lat: geo.position.lat,
        lng: geo.position.lng,
        source: 'gps',
      });
    }
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

  const selectedDist = selected ? calcDistanceKm(selected.lat, selected.lng) : null;

  return (
    <div className="on-dark relative h-[calc(100dvh-4rem)] overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 z-0">
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
        {(customLoc || tooZoomedOut || (loading && listings.length === 0) || error || fromFallback) && (
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
            {(geo.status === 'denied' || geo.status === 'unavailable') && !geoBannerDismissed && (
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
        <div className="flex-1 min-h-0 flex items-stretch gap-3" dir="ltr">
          {directionsOpen && (
            <div className="pointer-events-auto w-full lg:w-[380px] shrink-0 min-h-0 max-h-[58vh] lg:max-h-none lg:my-0">
              <DirectionsPanel
                origin={originPoint}
                destination={destPoint}
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
                  geo.start();
                  if (geo.position) {
                    applyRoutePoint(routeField, {
                      label: 'موقعي الحالي',
                      lat: geo.position.lat,
                      lng: geo.position.lng,
                      source: 'gps',
                    });
                  }
                }}
                onPickOnMapChange={setPickOnMap}
                onStartNavigation={startLiveNavigation}
              />
            </div>
          )}
          <div className="hidden lg:block pointer-events-auto w-[360px] ms-auto min-h-0">
            <div className="h-full gmaps-surface rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.22)] p-3 overflow-y-auto dark:border-white/10 dark:bg-neutral-900/92">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-slate-500 text-xs font-medium dark:text-zinc-400">{listings.length} مكان في نطاق الخريطة</p>
              </div>
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
            </div>
          </div>
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

      <div className="absolute z-20 bottom-36 end-4 flex flex-col gap-2">
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
          onClick={() => setListOpen((v) => !v)}
          className="lg:hidden w-12 h-12 rounded-full bg-brand-950/90 border border-white/15 text-white shadow-xl flex items-center justify-center cursor-pointer"
          aria-label="قائمة الأماكن"
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
          aria-label="موقعي الحالي"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {listOpen && !directionsOpen && !navigating && (
        <div className="lg:hidden absolute inset-x-3 bottom-3 z-30 max-h-[55%] gmaps-surface rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl p-3 overflow-hidden flex flex-col">
          <button type="button" onClick={() => setListOpen(false)} className="mx-auto mb-2 text-slate-400 cursor-pointer">
            <ChevronUp className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-xs mb-2">{listings.length} مكان</p>
          <div className="overflow-y-auto">
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
          </div>
        </div>
      )}

      {selected && !directionsOpen && !navigating && (
        <PlaceDetailsSheet
          place={selected}
          distanceLabel={selectedDist != null ? `${formatDistance(selectedDist)} • ${estWalkTime(selectedDist)} مشياً` : null}
          origin={geo.position ?? origin}
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
