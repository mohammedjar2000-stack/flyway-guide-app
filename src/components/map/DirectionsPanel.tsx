import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpDown, Bike, Bus, Car, Clock, Crosshair, Footprints, MapPin, Phone, Plane, X,
} from 'lucide-react';
import type { DirectoryListing } from '@/types';
import { geocodePlace } from '@/services/geocode';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { pinQuery } from '@/lib/placePrecision';
import { getRecentPlaces, rememberPlace, type RecentPlace } from '@/lib/routeHistory';
import {
  formatRouteDistance,
  formatRouteDuration,
  type RoutePoint,
  type RouteResult,
  type TravelMode,
} from '@/lib/routing';
import FlywayBookButton from '@/components/map/FlywayBookButton';

interface DirectionsPanelProps {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  userLocation: { lat: number; lng: number } | null;
  nearbyPlaces: DirectoryListing[];
  destinationPlace?: DirectoryListing | null;
  mode: TravelMode;
  route: RouteResult | null;
  loading: boolean;
  error: string | null;
  pickOnMap: boolean;
  onModeChange: (mode: TravelMode) => void;
  onOriginChange: (point: RoutePoint | null) => void;
  onDestinationChange: (point: RoutePoint) => void;
  onActiveFieldChange: (field: 'origin' | 'dest') => void;
  onSwap: () => void;
  onClose: () => void;
  onUseMyLocation: () => void;
  onPickOnMapChange: (active: boolean) => void;
  onStartNavigation: () => void;
}

const MODES: { id: TravelMode; label: string; Icon: typeof Car }[] = [
  { id: 'driving', label: 'سيارة', Icon: Car },
  { id: 'transit', label: 'نقل عام', Icon: Bus },
  { id: 'walking', label: 'مشي', Icon: Footprints },
  { id: 'cycling', label: 'دراجة', Icon: Bike },
  { id: 'flight', label: 'طيران', Icon: Plane },
];

type Field = 'origin' | 'dest';

function coordsLabel(lat: number, lng: number): string {
  return pinQuery(lat, lng) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function DirectionsPanel({
  origin,
  destination,
  userLocation,
  nearbyPlaces,
  destinationPlace = null,
  mode,
  route,
  loading,
  error,
  pickOnMap,
  onModeChange,
  onOriginChange,
  onDestinationChange,
  onActiveFieldChange,
  onSwap,
  onClose,
  onUseMyLocation,
  onPickOnMapChange,
  onStartNavigation,
}: DirectionsPanelProps) {
  const [originText, setOriginText] = useState(origin?.label ?? '');
  const [destText, setDestText] = useState(destination?.label ?? '');
  const [activeField, setActiveField] = useState<Field>('origin');
  const [inputFocused, setInputFocused] = useState(true);
  const [recents, setRecents] = useState<RecentPlace[]>(() => getRecentPlaces());
  const [geoHits, setGeoHits] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const originRef = useRef<HTMLInputElement>(null);
  const query = activeField === 'origin' ? originText : destText;
  const debouncedQuery = useDebouncedValue(query, 380);

  useEffect(() => {
    setOriginText(origin?.label ?? '');
  }, [origin?.label, origin?.lat, origin?.lng]);

  useEffect(() => {
    setDestText(destination?.label ?? '');
  }, [destination?.label, destination?.lat, destination?.lng]);

  useEffect(() => {
    originRef.current?.focus();
    onActiveFieldChange('origin');
  }, [onActiveFieldChange]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setGeoHits([]);
      setGeoLoading(false);
      return;
    }
    if (origin && activeField === 'origin' && q === origin.label) {
      setGeoHits([]);
      return;
    }
    if (destination && activeField === 'dest' && q === destination.label) {
      setGeoHits([]);
      return;
    }
    let cancelled = false;
    setGeoLoading(true);
    void geocodePlace(q).then((hits) => {
      if (cancelled) return;
      setGeoHits(hits.slice(0, 6).map((h) => ({ label: h.displayName, lat: h.lat, lng: h.lng })));
      setGeoLoading(false);
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, activeField, origin, destination]);

  const placeSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return nearbyPlaces.slice(0, 5);
    return nearbyPlaces
      .filter((p) => [p.name, p.address, p.city].join(' ').toLowerCase().includes(q))
      .slice(0, 6);
  }, [nearbyPlaces, query]);

  const recentFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter((r) => r.label.toLowerCase().includes(q));
  }, [recents, query]);

  const destPlace = useMemo(() => {
    if (destinationPlace) return destinationPlace;
    if (!destination) return null;
    return nearbyPlaces.find(
      (p) => Math.abs(p.lat - destination.lat) < 0.00005 && Math.abs(p.lng - destination.lng) < 0.00005,
    ) ?? null;
  }, [destination, destinationPlace, nearbyPlaces]);
  const showRoute = Boolean(route) && Boolean(origin) && Boolean(destination);
  const showSuggestions = inputFocused && !showRoute;

  const setField = (field: Field) => {
    setActiveField(field);
    onActiveFieldChange(field);
    setInputFocused(true);
    onPickOnMapChange(true);
  };

  const applyPoint = (field: Field, point: RoutePoint) => {
    rememberPlace(point);
    setRecents(getRecentPlaces());
    if (field === 'origin') {
      setOriginText(point.label);
      onOriginChange(point);
    } else {
      setDestText(point.label);
      onDestinationChange(point);
    }
    onPickOnMapChange(false);
    setInputFocused(false);
  };

  const pickMyLocation = () => {
    onUseMyLocation();
    if (userLocation) {
      applyPoint(activeField, {
        label: 'موقعي الحالي',
        lat: userLocation.lat,
        lng: userLocation.lng,
        source: 'gps',
      });
    }
  };

  return (
    <div
      className="gmaps-directions flex flex-col h-full min-h-0 rounded-2xl border border-[#dadce0] dark:border-white/10 bg-white dark:bg-[#292a2d] shadow-[0_12px_40px_rgba(0,0,0,0.28)] overflow-hidden"
      dir="rtl"
    >
      <div className="flex items-center gap-1 px-2 pt-2 pb-0 border-b border-[#dadce0]">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] flex items-center justify-center cursor-pointer shrink-0"
          aria-label="إغلاق الاتجاهات"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-end justify-around">
          {MODES.map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                className={`gmaps-mode flex flex-col items-center gap-1 min-w-[52px] px-1 pb-2 pt-1 cursor-pointer border-b-[3px] ${
                  active ? 'gmaps-mode-active border-[#1a73e8]' : 'border-transparent hover:text-[#202124]'
                }`}
                aria-label={label}
                aria-pressed={active}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] flex items-center justify-center cursor-pointer shrink-0"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pt-3 pb-2">
        <p className="text-[11px] font-bold text-neutral-900 dark:text-white mb-2 px-0.5">من — إلى</p>
        <div className="flex gap-2 items-stretch">
          <div className="flex flex-col items-center w-5 pt-[18px] pb-[18px] shrink-0">
            <span className="w-3 h-3 rounded-full border-2 border-[#1a73e8] bg-white shrink-0" />
            <span className="flex-1 w-px bg-[#dadce0] my-1 min-h-[28px]" />
            <span className="w-3 h-3 rounded-[2px] bg-[#ea4335] shrink-0" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-neutral-600 dark:text-zinc-300 mb-1">من (موقعك الحالي)</p>
              <input
                ref={originRef}
                value={originText}
                onChange={(e) => {
                  setOriginText(e.target.value);
                  if (origin) onOriginChange(null);
                }}
                onFocus={() => setField('origin')}
                placeholder="اختيار نقطة الانطلاق — موقعي الحالي"
                className="w-full h-11 rounded-lg bg-[#f1f3f4] dark:bg-[#3c4043] px-3 text-sm font-semibold text-neutral-900 dark:text-[#e8eaed] outline-none border border-transparent focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:bg-white dark:focus:bg-[#202124]"
              />
              {origin && (
                <p className="text-[11px] font-black font-mono text-neutral-900 dark:text-white px-1 mt-1" dir="ltr">
                  {coordsLabel(origin.lat, origin.lng)}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-600 dark:text-zinc-300 mb-1">إلى (الوجهة)</p>
              <input
                value={destText}
                onChange={(e) => setDestText(e.target.value)}
                onFocus={() => setField('dest')}
                placeholder={destination ? coordsLabel(destination.lat, destination.lng) : 'الوجهة'}
                className="w-full h-11 rounded-lg bg-[#f1f3f4] dark:bg-[#3c4043] px-3 text-sm font-semibold text-neutral-900 dark:text-[#e8eaed] outline-none border border-transparent focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:bg-white dark:focus:bg-[#202124]"
              />
              {destination && (
                <p className="text-[11px] font-black font-mono text-neutral-900 dark:text-white px-1 mt-1" dir="ltr">
                  {coordsLabel(destination.lat, destination.lng)}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onSwap}
            disabled={!origin || !destination}
            className="self-center w-10 h-10 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] flex items-center justify-center cursor-pointer disabled:opacity-30 shrink-0"
            aria-label="عكس الاتجاه"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {pickOnMap && activeField === 'dest' && (
          <p className="mx-3 mb-2 text-[12px] text-[#1a73e8] bg-[#e8f0fe] rounded-lg px-3 py-2">
            انقر على الخريطة لتحديد الوجهة
          </p>
        )}

        {showSuggestions && (
          <div className="pb-3">
            <button
              type="button"
              onClick={pickMyLocation}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8f9fa] cursor-pointer text-right"
            >
              <span className="w-9 h-9 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0">
                <Crosshair className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-neutral-950 dark:text-white">موقعي الحالي</span>
                <span className="block text-[11px] font-bold text-neutral-800 dark:text-zinc-100">
                  {userLocation ? coordsLabel(userLocation.lat, userLocation.lng) : 'فعّل الموقع لاستخدام موقعك كنقطة انطلاق'}
                </span>
              </span>
            </button>

            {recentFiltered.length > 0 && (
              <>
                <p className="px-4 pt-2 pb-1 text-[11px] font-black text-neutral-800 dark:text-zinc-100 tracking-wide">الأخيرة / اقتراحات</p>
                {recentFiltered.map((item) => (
                  <button
                    key={`${item.label}-${item.lat}`}
                    type="button"
                    onClick={() => applyPoint(activeField, {
                      label: item.label,
                      lat: item.lat,
                      lng: item.lng,
                      source: 'recent',
                    })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] cursor-pointer text-right"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-neutral-950 dark:text-white truncate">{item.label}</span>
                      <span className="block text-[11px] font-black font-mono text-neutral-800 dark:text-zinc-100" dir="ltr">{coordsLabel(item.lat, item.lng)}</span>
                    </span>
                  </button>
                ))}
              </>
            )}

            {placeSuggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => applyPoint(activeField, {
                  label: place.name,
                  lat: place.lat,
                  lng: place.lng,
                  source: 'place',
                })}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] cursor-pointer text-right"
              >
                <span className="w-9 h-9 rounded-full bg-[#f1f3f4] text-[#ea4335] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-neutral-950 dark:text-white truncate">{place.name}</span>
                  <span className="block text-[11px] font-bold text-neutral-800 dark:text-zinc-100 truncate">{place.address || place.category_label}</span>
                </span>
              </button>
            ))}

            {geoLoading && <p className="px-4 py-2 text-[12px] font-bold text-neutral-800 dark:text-zinc-100">جاري البحث...</p>}
            {geoHits.map((hit) => (
              <button
                key={`${hit.lat}-${hit.lng}-${hit.label}`}
                type="button"
                onClick={() => applyPoint(activeField, {
                  label: hit.label.split(',')[0] || hit.label,
                  lat: hit.lat,
                  lng: hit.lng,
                  source: 'geocode',
                })}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] cursor-pointer text-right"
              >
                <span className="w-9 h-9 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-neutral-950 dark:text-white truncate">{hit.label.split(',')[0]}</span>
                  <span className="block text-[11px] font-bold text-neutral-800 dark:text-zinc-100 truncate">{hit.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {destination && (
          <div className="route-from-to mx-3 mb-3 rounded-2xl bg-neutral-50 border border-neutral-200 p-3 dark:bg-white/5 dark:border-white/10">
            <p className="text-[11px] font-bold text-neutral-900 dark:text-white mb-2">مسار من موقعك إلى الوجهة</p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-semibold text-neutral-600 dark:text-zinc-300">من</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{origin?.label || 'موقعي الحالي — بانتظار تحديد GPS'}</p>
                {origin && (
                  <p className="font-mono text-[12px] text-neutral-800 dark:text-zinc-200" dir="ltr">{coordsLabel(origin.lat, origin.lng)}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-neutral-600 dark:text-zinc-300">إلى</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{destination.label}</p>
                <p className="font-mono text-[12px] text-neutral-800 dark:text-zinc-200" dir="ltr">{coordsLabel(destination.lat, destination.lng)}</p>
              </div>
            </div>
            {destPlace?.address && (
              <p className="mt-2 text-[12px] font-medium text-neutral-800 dark:text-zinc-200">{destPlace.address}</p>
            )}
            {destPlace?.phone && (
              <a
                href={`tel:${destPlace.phone.replace(/\s+/g, '')}`}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-400 text-neutral-950 px-3 py-1.5 text-[12px] font-bold no-underline"
                dir="ltr"
              >
                <Phone className="w-3.5 h-3.5" />
                {destPlace.phone}
              </a>
            )}
            {route && (
              <p className="mt-3 text-base font-bold text-neutral-900 dark:text-white">
                {formatRouteDistance(route.distanceKm)} · {formatRouteDuration(route.durationMin)}
              </p>
            )}
            {!origin && (
              <p className="mt-2 text-[12px] font-medium text-neutral-600 dark:text-zinc-300">فعّل الموقع لرسم المسار من GPS إلى السفارة/الوجهة</p>
            )}
          </div>
        )}

        {showRoute && route && (
          <div className="px-4 pb-4 pt-1">
            <p className="text-[28px] leading-none font-black text-neutral-950 dark:text-white">
              {formatRouteDuration(route.durationMin)}
            </p>
            <p className="text-sm font-bold text-neutral-800 dark:text-zinc-100 mt-1">
              {formatRouteDistance(route.distanceKm)}
              {route.estimated ? ' · تقدير' : ''}
              {' · '}
              {MODES.find((m) => m.id === mode)?.label}
            </p>
            {route.notice && (
              <p className="mt-2 text-[12px] font-bold text-neutral-900 dark:text-white bg-brand-400/20 rounded-lg px-3 py-2">{route.notice}</p>
            )}
            <div className="mt-4 space-y-3">
              {route.steps.slice(0, 24).map((step, i) => (
                <div key={`${i}-${step}`} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-neutral-950 dark:bg-brand-400 shrink-0" />
                  <p className="text-sm font-bold text-neutral-950 dark:text-white leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <p className="px-4 py-6 text-sm font-bold text-neutral-900 dark:text-white">جاري حساب المسار من موقعك إلى الوجهة...</p>
        )}
        {error && !loading && (
          <p className="mx-4 mb-4 text-sm text-[#c5221f] bg-[#fce8e6] rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {destination && (
        <div className="p-3 border-t border-[#dadce0] bg-white dark:bg-[#292a2d] dark:border-white/10 space-y-2">
          <FlywayBookButton
            name={destination.label}
            lat={destination.lat}
            lng={destination.lng}
            city={destPlace?.city}
            country={destPlace?.country_name}
            address={destPlace?.address}
            categoryKey={destPlace?.category_key}
            compact
          />
          <button
            type="button"
            onClick={onStartNavigation}
            className="w-full h-12 rounded-xl bg-[#1a73e8] text-white text-sm font-black cursor-pointer hover:bg-[#174ea6]"
          >
            ابدأ الآن
          </button>
        </div>
      )}
    </div>
  );
}
