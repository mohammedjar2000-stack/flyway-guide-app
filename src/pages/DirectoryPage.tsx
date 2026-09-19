import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Hotel, UtensilsCrossed, Stethoscope, Pill, ShoppingBag, Camera,
  Banknote, Landmark, Car, Shield, Smartphone, Moon, Scissors, Fuel,
  ShoppingCart, PlaneTakeoff, Search, Star, MapPin, Phone, Clock, X, Compass, Globe,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';
import { pinQuery, sanitizePin, canonicalFuelBakeryKey, listingMatchesCategory } from '@/lib/placePrecision';
import { isFuelCoordinateClean } from '@/lib/fuelGuard';
import { getAllVerifiedPlaces } from '@/lib/verifiedPlaces';
import FlywayBookButton from '@/components/map/FlywayBookButton';
import PlaceHoverCard from '@/components/map/PlaceHoverCard';
import PlaceSafeImage from '@/components/map/PlaceSafeImage';
import { usePlacePreview } from '@/hooks/usePlacePreview';
import { formatPlaceCount, listingDedupeKey, useCategoryCounts } from '@/hooks/useCategoryCounts';
import { civicListRank } from '@/lib/civicRank';
import {
  fetchPlaceCatalog,
  gisPlacesToListings,
  ingestMappedPlaces,
  PLACES_UPDATED_EVENT,
  syncOsmCategory,
} from '@/services/gisApi';
import { fetchPlacesFromOverpass } from '@/services/overpassApi';
import { lookupCity } from '@/lib/cityCoordinates';
import { FETCH_RADIUS_METERS } from '@/lib/mapConfig';
import { listingMatchesProvince, isAllTurkeyCity, isTurkeyCountry } from '@/lib/turkeyScope';
import { appleMapsDirUrl, googleMapsSearchUrl, wazeNavUrl } from '@/lib/navLinks';
import { bootPlaceVault, getVaultSnapshot, mergeIntoVault, subscribeVault } from '@/lib/placeVault';

const iconMap: Record<string, typeof Hotel> = {
  Hotel, UtensilsCrossed, Stethoscope, Pill, ShoppingBag, Camera,
  Banknote, Landmark, Car, Shield, Smartphone, Moon, Scissors, Fuel, ShoppingCart, PlaneTakeoff,
};

interface DirectoryPageProps {
  locationFilter?: { country?: string; city?: string; district?: string; category?: string } | null;
}

export default function DirectoryPage({ locationFilter }: DirectoryPageProps) {
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(locationFilter?.category || 'hotels');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DirectoryListing | null>(null);
  const { counts: liveCounts } = useCategoryCounts({
    city: locationFilter?.city,
    country: locationFilter?.country,
  });
  const { preview, show: showPreview, hide: hidePreview, clear: clearPreview } = usePlacePreview();

  useEffect(() => {
    if (locationFilter?.category) setActiveCategory(locationFilter.category);
  }, [locationFilter]);

  useEffect(() => {
    let cancelled = false;
    void bootPlaceVault();
    setListings(getVaultSnapshot());
    setLoading(false);
    const unsub = subscribeVault(() => {
      if (!cancelled) setListings(getVaultSnapshot());
    });

    const cityHit = lookupCity(locationFilter?.city) || lookupCity(locationFilter?.country);
    const origin = cityHit ? { lat: cityHit.lat, lng: cityHit.lng } : { lat: 41.0082, lng: 28.9784 };

    (async () => {
      mergeIntoVault(getAllVerifiedPlaces(), { fromCache: true });
      const cityName = cityHit?.en || '';
      void ingestMappedPlaces(getVaultSnapshot()).catch(() => null);
      const denseCats = ['pharmacies', 'markets', 'hotels', 'telecom', 'exchange', 'transport', 'hospitals', 'police', 'fuel', 'bakeries', 'restaurants', 'mosques', 'nightlife', 'salons'] as const;
      for (const category of denseCats) {
        void syncOsmCategory({
          lat: origin.lat,
          lng: origin.lng,
          category,
          city: cityName,
          country: cityHit?.countryEn || 'Turkey',
          limit: category === 'transport' || category === 'fuel' || category === 'bakeries' ? 400 : 250,
          radius: FETCH_RADIUS_METERS,
        }).then(async (osmCounts) => {
          if (cancelled) return;
          if (osmCounts) {
            window.dispatchEvent(new CustomEvent(PLACES_UPDATED_EVENT, { detail: { counts: osmCounts } }));
          }
          const extra = await fetchPlaceCatalog({ category, limit: 5000 });
          if (cancelled) return;
          mergeIntoVault(gisPlacesToListings(extra));
        }).catch(() => null);
      }
      const supabasePromise = supabase.from('directory_listings').select('*').order('sort_order')
        .then(({ data }) => (data ?? []) as DirectoryListing[])
        .catch(() => [] as DirectoryListing[]);
      const supabaseTimer = new Promise<DirectoryListing[]>((resolve) => {
        window.setTimeout(() => resolve([]), 2500);
      });
      const [dbRows, gisPlaces, ...liveBuckets] = await Promise.all([
        Promise.race([supabasePromise, supabaseTimer]),
        fetchPlaceCatalog({ limit: 5000 }),
        ...denseCats.map((category) => fetchPlacesFromOverpass(origin.lat, origin.lng, category, FETCH_RADIUS_METERS).catch(() => [] as DirectoryListing[])),
      ]);
      if (cancelled) return;
      mergeIntoVault(dbRows);
      mergeIntoVault(gisPlacesToListings(gisPlaces));
      for (const bucket of liveBuckets) {
        if (bucket.length) {
          mergeIntoVault(bucket);
          void ingestMappedPlaces(bucket).catch(() => null);
        }
      }
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [locationFilter?.city, locationFilter?.country]);

  const currentCat = CATEGORIES.find((c) => c.key === activeCategory);
  const cityHit = lookupCity(locationFilter?.city);
  const allTurkey = isAllTurkeyCity(locationFilter?.city)
    || (!cityHit && isTurkeyCountry(locationFilter?.country));
  const filteredHold = useRef<DirectoryListing[]>([]);
  const filtered = useMemo(() => {
    const seen = new Set<string>();
    const next = listings.filter((l) => {
      if (allTurkey) {
        if (!listingMatchesProvince(l, cityHit, true)) return false;
      } else if (cityHit && !listingMatchesProvince(l, cityHit, false)) {
        return false;
      }
      if (canonicalFuelBakeryKey(l) !== activeCategory && !(activeCategory === 'embassy' && l.category_key === 'police')) return false;
      if (activeCategory === 'fuel' && (!listingMatchesCategory(l, 'fuel') || !isFuelCoordinateClean(l.lat, l.lng))) return false;
      const key = listingDedupeKey(l);
      if (seen.has(key)) return false;
      seen.add(key);
      if (search.trim()) {
        const hay = [l.name, l.description, l.city, l.country_name, l.address].join(' ').toLowerCase();
        const tokens = search.toLowerCase().split(/[،,]+/).map((t) => t.trim()).filter(Boolean);
        if (tokens.length > 0 && !tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    }).sort((a, b) => civicListRank(a) - civicListRank(b));
    if (next.length > 0) {
      filteredHold.current = next;
      return next;
    }
    if (loading && filteredHold.current.length > 0) return filteredHold.current;
    return next;
  }, [listings, activeCategory, search, loading, cityHit, allTurkey]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">الدليل الشامل لخدمات السفر</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm">16 دليلاً متخصصاً مع تصفية فورية — اختر الفئة وابحث</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon] || Hotel;
          const count = liveCounts[cat.key] ?? 0;
          return (
            <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setSearch(''); }}
              className={`rounded-xl p-3 text-center cursor-pointer transition-all duration-300 border ${
                activeCategory === cat.key
                  ? 'bg-brand-400 border-brand-400 shadow-lg shadow-brand-400/20 scale-105'
                  : 'glass-dark border-white/10 hover:border-brand-400/40'
              }`}>
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${activeCategory === cat.key ? 'text-neutral-950' : 'text-brand-400'}`} />
              <div className={`text-[10px] font-bold leading-tight ${activeCategory === cat.key ? 'text-neutral-950' : 'text-neutral-700 dark:text-zinc-300'}`}>
                {cat.shortLabel}
              </div>
              <div className={`text-[9px] mt-0.5 ${activeCategory === cat.key ? 'text-neutral-800' : 'text-zinc-500'}`}>
                {formatPlaceCount(count)} عنصر
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400/60" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، المدينة، أو الدولة..."
            className="w-full pr-12 pl-4 py-3.5 glass-dark rounded-xl text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-white/10 transition-all focus:border-brand-400" />
        </div>
      </div>

      {loading && listings.length === 0 ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[300px] rounded-2xl shimmer-bg animate-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg">لا توجد نتائج مطابقة</p>
        </div>
      ) : (
        <>
          <div className="text-zinc-500 text-xs mb-4 tabular-nums">{formatPlaceCount(filtered.length)} نتيجة في "{currentCat?.label}"</div>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => { clearPreview(); setSelected(item); }}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  showPreview(item, r.left + r.width / 2, r.top, 'marker');
                }}
                onMouseLeave={() => hidePreview()}
                className="glass-dark rounded-2xl overflow-hidden border border-white/10 card-hover cursor-pointer group [content-visibility:auto] [contain-intrinsic-size:auto_360px]"
              >
                <div className="relative h-[180px] overflow-hidden">
                  <PlaceSafeImage place={item} prefer={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {Number(item.rating) > 0 && (
                    <div className="on-dark absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Star className="w-3.5 h-3.5 text-brand-400" fill="currentColor" />
                      <span className="text-white text-xs font-semibold">{Number(item.rating)}</span>
                    </div>
                  )}
                  {item.is_featured && (
                    <span className="absolute top-3 left-3 bg-brand-400 text-neutral-950 px-3 py-1 rounded-full text-xs font-semibold">
                      مميز
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">{item.name}</h3>
                  <p className="text-neutral-600 dark:text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs mb-2">
                    <MapPin className="w-3.5 h-3.5" /> {item.city}، {item.country_name}
                  </div>
                  {item.proximity_note && (
                    <div className="text-brand-400/80 text-[11px] leading-relaxed">
                      {item.proximity_note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="max-w-[560px] w-full max-h-[85vh] overflow-y-auto bg-white rounded-2xl border border-neutral-200 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[260px] overflow-hidden rounded-t-2xl">
              <PlaceSafeImage place={selected} prefer={selected.image} alt={selected.name} className="w-full h-full object-cover" loading="eager" />
              <button onClick={() => setSelected(null)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              {Number(selected.rating) > 0 && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-brand-400 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-neutral-950" fill="currentColor" />
                  <span className="text-neutral-950 text-sm font-semibold">{Number(selected.rating)}</span>
                </div>
              )}
              <div className="on-dark absolute bottom-0 right-0 left-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {selected.city}، {selected.country_name}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <p className="text-neutral-800 text-sm leading-relaxed">{selected.description}</p>

              {selected.address && (
                <div className="rounded-xl p-3 flex items-start gap-2 bg-neutral-50 border border-neutral-200">
                  <MapPin className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-600 font-semibold mb-0.5">العنوان</p>
                    <p className="text-neutral-900 text-sm font-medium">{selected.address}</p>
                  </div>
                </div>
              )}

              {selected.proximity_note && (
                <div className="rounded-xl p-3 flex items-start gap-2 bg-neutral-50 border border-neutral-200">
                  <Compass className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-600 font-semibold mb-0.5">القرب من المعالم</p>
                    <p className="text-neutral-900 text-sm font-medium">{selected.proximity_note}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {selected.phone && (
                  <a href={`tel:${selected.phone.replace(/\s+/g, '')}`} className="rounded-xl p-3 flex items-center gap-2 bg-neutral-50 border border-neutral-200 text-neutral-900 no-underline">
                    <Phone className="w-4 h-4 text-neutral-800" />
                    <div>
                      <p className="text-xs text-neutral-600 font-semibold">الهاتف</p>
                      <p className="text-neutral-900 text-sm font-semibold" dir="ltr">{selected.phone}</p>
                    </div>
                  </a>
                )}
                {selected.hours && (
                  <div className="rounded-xl p-3 flex items-center gap-2 bg-neutral-50 border border-neutral-200">
                    <Clock className="w-4 h-4 text-neutral-800" />
                    <div>
                      <p className="text-xs text-neutral-600 font-semibold">ساعات العمل</p>
                      <p className="text-neutral-900 text-sm font-medium">{selected.hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {selected.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer" className="rounded-xl p-3 flex items-center gap-2 bg-neutral-50 border border-neutral-200 text-neutral-900 no-underline">
                  <Globe className="w-4 h-4 text-neutral-800" />
                  <div>
                    <p className="text-xs text-neutral-600 font-semibold">الموقع الرسمي</p>
                    <p className="text-neutral-900 text-sm font-semibold break-all" dir="ltr">{selected.website}</p>
                  </div>
                </a>
              )}

              {(() => {
                const pin = sanitizePin(selected.lat, selected.lng);
                if (!pin || !pinQuery(pin.lat, pin.lng)) return null;
                return (
                  <div className="grid grid-cols-3 gap-2">
                    <a href={wazeNavUrl(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl text-xs font-bold flex items-center justify-center bg-neutral-900 text-white no-underline">Waze</a>
                    <a href={googleMapsSearchUrl(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl text-xs font-bold flex items-center justify-center bg-brand-400 text-neutral-950 no-underline">Google Maps</a>
                    <a href={appleMapsDirUrl(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl text-xs font-bold flex items-center justify-center bg-neutral-800 text-white no-underline">Apple Maps</a>
                  </div>
                );
              })()}

              <FlywayBookButton
                name={selected.name}
                city={selected.city}
                country={selected.country_name}
                address={selected.address}
                lat={selected.lat}
                lng={selected.lng}
                categoryKey={selected.category_key}
              />
            </div>
          </div>
        </div>
      )}

      {preview && !selected && (
        <PlaceHoverCard place={preview.place} x={preview.x} y={preview.y} source={preview.source} />
      )}
    </div>
  );
}
