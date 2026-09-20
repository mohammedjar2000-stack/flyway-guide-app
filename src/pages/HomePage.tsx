import { useEffect, useState, useRef } from 'react';
import {
  Hotel, UtensilsCrossed, Stethoscope, Pill, ShoppingBag, Camera,
  Banknote, Landmark, Car, Shield, Smartphone, Moon, Scissors, Fuel,
  ShoppingCart, MapPin, Star, TrendingUp, Compass,
  Sparkles, Globe, Zap, Navigation, Search, Crosshair, Building2,
  ChevronDown, PlaneTakeoff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Country, Promo, PageKey } from '@/types';
import { CATEGORIES } from '@/types';
import { flywayBookingUrl } from '@/lib/flywayBooking';
import {
  getDataset,
  searchCountries,
  searchCities,
  searchDistricts,
  listMajorCities,
  type CountryData,
  type CityData,
  type DistrictData,
} from '@/lib/locations';
import {
  lookupCity,
  resolveMapFocus,
  isValidCoord,
  type AppLocation,
} from '@/lib/cityCoordinates';
import { geocodePlace, reverseGeocode, type GeoHit } from '@/services/geocode';
import { formatPlaceCount, useCategoryCounts } from '@/hooks/useCategoryCounts';

interface HomePageProps {
  onNavigate: (page: PageKey) => void;
  onLocationChange: (loc: AppLocation) => void;
  onSearchNavigate: (loc: AppLocation) => void;
  onDirectoryNavigate: (filter: { country?: string; city?: string; district?: string; category?: string }) => void;
  currentLocation?: AppLocation;
}

const iconMap: Record<string, typeof Hotel> = {
  Hotel, UtensilsCrossed, Stethoscope, Pill, ShoppingBag, Camera,
  Banknote, Landmark, Car, Shield, Smartphone, Moon, Scissors, Fuel, ShoppingCart, PlaneTakeoff,
};

const categoryColors = [
  'from-brand-400 to-lime-600',
  'from-neutral-800 to-neutral-950',
  'from-lime-400 to-brand-700',
  'from-neutral-700 to-black',
  'from-brand-300 to-lime-700',
  'from-zinc-800 to-neutral-950',
  'from-brand-400 to-neutral-900',
  'from-lime-300 to-lime-700',
  'from-neutral-800 to-brand-700',
  'from-zinc-700 to-black',
  'from-brand-400 to-lime-800',
  'from-neutral-900 to-zinc-800',
  'from-lime-400 to-neutral-900',
  'from-zinc-800 to-lime-700',
  'from-brand-500 to-neutral-950',
];

const NEIGHBORHOOD_SUGGESTIONS: { label: string; query: string }[] = [
  { label: 'تقسيم، إسطنبول', query: 'Taksim, Istanbul, Turkey' },
  { label: 'السلطان أحمد، إسطنبول', query: 'Sultanahmet, Istanbul, Turkey' },
  { label: 'بشيكتاش، إسطنبول', query: 'Besiktas, Istanbul, Turkey' },
  { label: 'نيشانتاشي، إسطنبول', query: 'Nisantasi, Istanbul, Turkey' },
  { label: 'كاديكوي، إسطنبول', query: 'Kadikoy, Istanbul, Turkey' },
  { label: 'شيشلي، إسطنبول', query: 'Sisli, Istanbul, Turkey' },
  { label: 'فاتح، إسطنبول', query: 'Fatih, Istanbul, Turkey' },
  { label: 'وسط دبي', query: 'Downtown Dubai, UAE' },
  { label: 'دبي مارينا', query: 'Dubai Marina, UAE' },
  { label: 'ديرة، دبي', query: 'Deira, Dubai, UAE' },
  { label: 'العليا، الرياض', query: 'Al Olaya, Riyadh, Saudi Arabia' },
  { label: 'الحمرا، جدة', query: 'Al Hamra, Jeddah, Saudi Arabia' },
  { label: 'وسط القاهرة', query: 'Downtown Cairo, Egypt' },
  { label: 'سوق واقف، الدوحة', query: 'Souq Waqif, Doha, Qatar' },
  { label: 'وسط عمّان', query: 'Downtown Amman, Jordan' },
  { label: 'ميتي، برلين', query: 'Mitte, Berlin, Germany' },
  { label: 'سوكومفيت، بانكوك', query: 'Sukhumvit, Bangkok, Thailand' },
  { label: 'شينجوكو، طوكيو', query: 'Shinjuku, Tokyo, Japan' },
  { label: 'الكرادة، بغداد', query: 'Karrada, Baghdad, Iraq' },
];

const HERO_BACKGROUND = '/hero-phone-map.jpg';
const HERO_TITLE = 'دليلك في راحة يدك';
const HERO_SUBTITLE = 'بوابتك الذكية لاستكشاف أفضل الفنادق، المستشفيات، والخدمات في وجهتك بكل سهولة';

export default function HomePage({ onNavigate, onLocationChange, onSearchNavigate, onDirectoryNavigate, currentLocation }: HomePageProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  const [countryQuery, setCountryQuery] = useState('');
  const [countryResults, setCountryResults] = useState<GeoHit[]>([]);
  const [showCountryResults, setShowCountryResults] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; lat: number; lng: number; bbox?: GeoHit['bbox'] } | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<GeoHit[]>([]);
  const [showCityResults, setShowCityResults] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ name: string; lat: number; lng: number; bbox?: GeoHit['bbox'] } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [neighborhoodQuery, setNeighborhoodQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState<CountryData[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<{ city: CityData; countryName: string }[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [neighborhoodSuggestions, setNeighborhoodSuggestions] = useState<{ district: DistrictData; cityName: string; countryName: string }[]>([]);
  const [showNeighborhoodSuggestions, setShowNeighborhoodSuggestions] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const neighborhoodRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { counts: liveCounts } = useCategoryCounts({
    city: selectedCity?.name || currentLocation?.city,
    country: selectedCountry?.name || currentLocation?.country,
  });
  const activeCountryName = selectedCountry?.name || countryQuery.trim() || undefined;

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('countries').select('*').order('created_at'),
        supabase.from('promos').select('*').eq('is_active', true).limit(3),
      ]);
      setCountries(c ?? []);
      setPromos(p ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowCountryResults(false);
        setShowCityResults(false);
        setShowCountrySuggestions(false);
        setShowCitySuggestions(false);
        setShowNeighborhoodSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trending = countries.filter((c) => c.trending).slice(0, 4);

  const searchLocations = (
    query: string,
    setResults: (r: GeoHit[]) => void,
    feature?: 'city' | 'country' | 'settlement',
  ) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const hits = await geocodePlace(query, {
        country: feature === 'city' ? activeCountryName : undefined,
        feature,
      });
      setResults(hits);
    }, 350);
  };

  const [datasetLoading, setDatasetLoading] = useState(true);

  useEffect(() => {
    getDataset().then(() => setDatasetLoading(false));
  }, []);

  const filterCountries = async (query: string) => {
    const results = await searchCountries(query);
    setCountrySuggestions(results);
  };

  const filterCities = async (query: string, countryName?: string) => {
    if (countryName) {
      const major = listMajorCities(countryName, query);
      setCitySuggestions(major);
      if (major.length > 0 && (!query.trim() || major.length >= 3)) return;
    }
    const results = await searchCities(query, countryName);
    setCitySuggestions(results);
  };

  const filterNeighborhoods = (query: string, cityName?: string, countryName?: string) =>
    searchDistricts(query, cityName, countryName);

  const emitLocation = (partial: Parameters<typeof resolveMapFocus>[0], navigate = false) => {
    const loc = resolveMapFocus(partial);
    onLocationChange(loc);
    if (navigate) onSearchNavigate(loc);
    return loc;
  };

  const currentFocus = () => {
    return resolveMapFocus({
      country: selectedCountry?.name || activeCountryName,
      city: selectedCity?.name || lookupCity(cityQuery)?.name || cityQuery.trim() || undefined,
      district: selectedDistrict?.name,
      lat: selectedDistrict?.lat ?? selectedCity?.lat,
      lng: selectedDistrict?.lng ?? selectedCity?.lng,
      bbox: selectedCity?.bbox,
      label: selectedDistrict?.name || selectedCity?.name,
    });
  };

  const handleCountrySelect = (r: GeoHit) => {
    const shortName = r.country || r.name;
    setSelectedCountry({ name: shortName, lat: r.lat, lng: r.lng, bbox: r.bbox });
    setCountryQuery(shortName);
    setShowCountryResults(false);
    setShowCountrySuggestions(false);
    setCityQuery('');
    setSelectedCity(null);
    setSelectedDistrict(null);
    setNeighborhoodQuery('');
    const cities = listMajorCities(shortName);
    setCitySuggestions(cities);
    emitLocation({ country: shortName, lat: r.lat, lng: r.lng, bbox: r.bbox, label: shortName });
  };

  const handleLocalCountrySelect = (c: CountryData) => {
    setSelectedCountry({ name: c.name, lat: c.lat, lng: c.lng });
    setCountryQuery(c.name);
    setShowCountrySuggestions(false);
    setShowCountryResults(false);
    setCityQuery('');
    setSelectedCity(null);
    setSelectedDistrict(null);
    setNeighborhoodQuery('');
    const cities = listMajorCities(c.name);
    setCitySuggestions(cities);
    emitLocation({ country: c.name });
  };

  const handleLocalCitySelect = (item: { city: CityData; countryName: string }) => {
    const known = lookupCity(item.city.name) ?? lookupCity(item.city.en);
    const lat = known?.lat ?? item.city.lat;
    const lng = known?.lng ?? item.city.lng;
    setSelectedCity({ name: item.city.name, lat, lng });
    setSelectedCountry({ name: item.countryName, lat: known?.lat ?? 0, lng: known?.lng ?? 0 });
    setCountryQuery(item.countryName);
    setCityQuery(item.city.name);
    setShowCitySuggestions(false);
    setShowCityResults(false);
    setSelectedDistrict(null);
    setNeighborhoodQuery('');
    setNeighborhoodSuggestions(filterNeighborhoods('', item.city.name, item.countryName));
    emitLocation({ country: item.countryName, city: item.city.name, lat, lng });
  };

  const handleCitySelect = (r: GeoHit) => {
    const shortName = r.city || r.name;
    const known = lookupCity(shortName);
    setSelectedCity({ name: known?.name ?? shortName, lat: r.lat, lng: r.lng, bbox: r.bbox });
    setCityQuery(known?.name ?? shortName);
    setShowCityResults(false);
    setShowCitySuggestions(false);
    setSelectedDistrict(null);
    setNeighborhoodQuery('');
    emitLocation({
      country: selectedCountry?.name ?? r.country ?? known?.country,
      city: known?.name ?? shortName,
      lat: r.lat,
      lng: r.lng,
      bbox: r.bbox,
      label: known?.name ?? shortName,
    });
  };

  const geocodeAndNavigate = async () => {
    setGeocoding(true);
    setGeoError('');
    const neighborhood = neighborhoodQuery.trim();
    const cityName = selectedCity?.name || cityQuery.trim();
    const countryName = selectedCountry?.name || countryQuery.trim();

    try {
      if (neighborhood) {
        const hits = await geocodePlace([neighborhood, cityName, countryName].filter(Boolean).join(', '));
        if (hits[0]) {
          onSearchNavigate(resolveMapFocus({
            country: countryName || hits[0].country,
            city: cityName || hits[0].city,
            district: neighborhood,
            lat: hits[0].lat,
            lng: hits[0].lng,
            bbox: hits[0].bbox,
            label: `${neighborhood}، ${cityName || hits[0].city || hits[0].name}`,
          }));
          return;
        }
      }

      if (selectedCity && isValidCoord(selectedCity.lat, selectedCity.lng)) {
        onSearchNavigate(resolveMapFocus({
          country: countryName,
          city: selectedCity.name,
          lat: selectedCity.lat,
          lng: selectedCity.lng,
          bbox: selectedCity.bbox,
          label: selectedCity.name,
        }));
        return;
      }

      const query = [cityName, countryName].filter(Boolean).join(', ');
      if (query) {
        const hits = await geocodePlace(query, { feature: 'settlement', country: countryName || undefined });
        if (hits[0]) {
          onSearchNavigate(resolveMapFocus({
            country: countryName || hits[0].country,
            city: cityName || hits[0].city || hits[0].name,
            lat: hits[0].lat,
            lng: hits[0].lng,
            bbox: hits[0].bbox,
            label: cityName || hits[0].name,
          }));
          return;
        }
      }

      onSearchNavigate(currentFocus());
    } catch {
      setGeoError('تعذر تحديد الموقع، حاول كتابة اسم مدينة أخرى');
    } finally {
      setGeocoding(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const hit = await reverseGeocode(latitude, longitude);
          onSearchNavigate(resolveMapFocus({
            lat: latitude,
            lng: longitude,
            label: hit?.name || 'موقعي الحالي',
            city: hit?.city,
            country: hit?.country,
            bbox: hit?.bbox,
          }));
        } catch {
          onSearchNavigate(resolveMapFocus({ lat: latitude, lng: longitude, label: 'موقعي الحالي' }));
        }
        setLocating(false);
      },
      () => {
        setGeoError('تعذر الوصول إلى موقعك. يرجى السماح بإذن الموقع.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNeighborhoodSelect = (s: { label: string; query: string }) => {
    const districtName = s.label.split('،')[0].trim();
    setNeighborhoodQuery(s.label);
    setShowSuggestions(false);
    setShowNeighborhoodSuggestions(false);
    const loc = resolveMapFocus({
      country: selectedCountry?.name,
      city: selectedCity?.name,
      district: districtName,
    });
    setSelectedDistrict({ name: loc.district ?? districtName, lat: loc.lat, lng: loc.lng });
    emitLocation(loc, true);
  };

  const handleDistrictSelect = (item: { district: DistrictData; cityName: string; countryName: string }) => {
    setNeighborhoodQuery(item.district.name);
    setSelectedDistrict({
      name: item.district.name,
      lat: item.district.lat ?? selectedCity?.lat ?? 0,
      lng: item.district.lng ?? selectedCity?.lng ?? 0,
    });
    if (!selectedCity) {
      const known = lookupCity(item.cityName);
      setSelectedCity({ name: item.cityName, lat: known?.lat ?? item.district.lat ?? 0, lng: known?.lng ?? item.district.lng ?? 0 });
      setCityQuery(item.cityName);
    }
    if (!selectedCountry) {
      setSelectedCountry({ name: item.countryName, lat: 0, lng: 0 });
      setCountryQuery(item.countryName);
    }
    setShowSuggestions(false);
    setShowNeighborhoodSuggestions(false);
    emitLocation({
      country: item.countryName,
      city: item.cityName,
      district: item.district.name,
      lat: item.district.lat,
      lng: item.district.lng,
    }, true);
  };

  const openCategoryOnMap = (categoryKey: string) => {
    onSearchNavigate({ ...currentFocus(), categoryKey });
  };

  const filteredSuggestions = neighborhoodQuery.trim()
    ? NEIGHBORHOOD_SUGGESTIONS.filter((s) =>
        s.label.includes(neighborhoodQuery.trim()) || s.query.toLowerCase().includes(neighborhoodQuery.trim().toLowerCase())
      )
    : NEIGHBORHOOD_SUGGESTIONS.filter((s) =>
      selectedCity
        ? s.label.includes(selectedCity.name) || s.query.toLowerCase().includes(selectedCity.name.toLowerCase())
        : false
    );

  return (
    <div className="min-h-screen">
      {/* Hero — cinematic travel background. Search card layout is locked (CLAUDE.md). */}
      <section
        className="relative min-h-[640px] md:min-h-[700px] overflow-hidden"
        aria-labelledby="hero-heading"
        dir="rtl"
      >
        <div className="absolute inset-0">
          <img
            src={HERO_BACKGROUND}
            alt=""
            role="presentation"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center origin-center will-change-transform motion-safe:animate-ken-burns"
          />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col items-center justify-center text-center pt-24 pb-20 z-20">
          <div className="motion-safe:animate-slide-up w-full max-w-4xl">
            <div className="min-h-[120px] md:min-h-[140px] flex flex-col items-center justify-center mb-8 md:mb-10">
              <div className="motion-safe:animate-slide-fade">
                <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full mb-5 border border-white/20">
                  <Sparkles className="w-4 h-4 text-brand-400" aria-hidden />
                  <span className="text-white text-sm font-medium">دليل السفر الذكي الأول للمسافر العراقي</span>
                </div>
                <div className="on-dark">
                  <h1
                    id="hero-heading"
                    className="hero-title mb-4 text-white text-[1.85rem] sm:text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.35] tracking-tight"
                  >
                    {HERO_TITLE}
                  </h1>
                  <p className="text-[15px] sm:text-base md:text-lg text-white max-w-[20.5rem] sm:max-w-xl md:max-w-2xl mx-auto leading-8 md:leading-9 font-medium text-pretty drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                    {HERO_SUBTITLE}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ LOCKDOWN: Hero Search Card — DO NOT MODIFY layout, fields, or styling. See CLAUDE.md ═══ */}
            <div ref={searchRef} className="relative bg-white rounded-3xl p-6 shadow-2xl shadow-black/40 max-w-5xl mx-auto mt-6">
              {/* Horizontal Input Row — 3 fields + search button (FROZEN) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 md:items-end">
                {/* Country */}
                <div ref={countryRef} className="relative md:col-span-3 md:pl-4 md:border-l md:border-slate-200">
                  <label className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1.5 px-1">
                    <Globe className="w-3.5 h-3.5 text-brand-500" />
                    الدولة
                  </label>
                  <input
                    type="text"
                    value={countryQuery}
                    onChange={(e) => {
                      setCountryQuery(e.target.value);
                      setSelectedCountry(null);
                      const q = e.target.value;
                      filterCountries(q);
                      setShowCountrySuggestions(q.trim().length >= 2);
                      searchLocations(q, setCountryResults, 'country');
                      setShowCountryResults(q.trim().length >= 2);
                      setShowCityResults(false);
                      setShowCitySuggestions(false);
                      setShowSuggestions(false);
                      setShowNeighborhoodSuggestions(false);
                    }}
                    onFocus={() => { if (countryQuery.trim().length >= 2) { filterCountries(countryQuery); setShowCountrySuggestions(true); } }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && selectedCountry) geocodeAndNavigate(); }}
                    placeholder="ابحث عن أي دولة..."
                    className="w-full bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3.5 text-slate-900 text-sm font-semibold outline-none border border-slate-200 focus:border-brand-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                  {showCountrySuggestions && countrySuggestions.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[280px] overflow-y-auto z-[100] animate-slide-down">
                      {countrySuggestions.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleLocalCountrySelect(c)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-all cursor-pointer text-right"
                        >
                          <Globe className="w-4 h-4 text-brand-500 shrink-0" />
                          <div className="text-right">
                            <span className="text-slate-700 text-sm font-medium block">{c.name}</span>
                            <span className="text-slate-400 text-xs">{c.en} • {c.cities.length} مدن</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showCountryResults && countryResults.length > 0 && !showCountrySuggestions && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[280px] overflow-y-auto z-[100] animate-slide-down">
                      {countryResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => handleCountrySelect(r)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-all cursor-pointer text-right"
                        >
                          <Globe className="w-4 h-4 text-brand-500 shrink-0" />
                          <span className="text-slate-700 text-sm font-medium line-clamp-2">{r.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* City */}
                <div ref={cityRef} className="relative md:col-span-3 md:pl-4 md:border-l md:border-slate-200">
                  <label className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1.5 px-1">
                    <Building2 className="w-3.5 h-3.5 text-brand-500" />
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setSelectedCity(null);
                      setSelectedDistrict(null);
                      const q = e.target.value;
                      const country = selectedCountry?.name || countryQuery.trim() || undefined;
                      filterCities(q, country);
                      setShowCitySuggestions(q.trim().length >= 2);
                      if (!country && q.trim().length >= 2) {
                        searchLocations(q, setCityResults, 'settlement');
                        setShowCityResults(true);
                      } else {
                        setCityResults([]);
                        setShowCityResults(false);
                      }
                      setShowCountryResults(false);
                      setShowCountrySuggestions(false);
                      setShowSuggestions(false);
                      setShowNeighborhoodSuggestions(false);
                    }}
                    onFocus={() => {
                      if (cityQuery.trim().length < 2) return;
                      const country = selectedCountry?.name || countryQuery.trim() || undefined;
                      const major = listMajorCities(country, cityQuery);
                      if (major.length) setCitySuggestions(major);
                      else filterCities(cityQuery, country);
                      setShowCitySuggestions(true);
                      if (!country && cityResults.length > 0) setShowCityResults(true);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && selectedCity) geocodeAndNavigate(); }}
                    placeholder="ابحث عن أي مدينة..."
                    className="w-full bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3.5 text-slate-900 text-sm font-semibold outline-none border border-slate-200 focus:border-brand-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[280px] overflow-y-auto z-[100] animate-slide-down">
                      {citySuggestions.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleLocalCitySelect(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-all cursor-pointer text-right"
                        >
                          <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
                          <div className="text-right">
                            <span className="text-slate-700 text-sm font-medium block">{item.city.name}</span>
                            <span className="text-slate-400 text-xs">{item.city.en} • {item.countryName}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showCityResults && cityResults.length > 0 && !showCitySuggestions && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[280px] overflow-y-auto z-[100] animate-slide-down">
                      {cityResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => handleCitySelect(r)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-all cursor-pointer text-right"
                        >
                          <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
                          <span className="text-slate-700 text-sm font-medium line-clamp-2">{r.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Neighborhood / Street */}
                <div ref={neighborhoodRef} className="relative md:col-span-4 md:pl-4 md:border-l md:border-slate-200">
                  <label className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1.5 px-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    المنطقة / الحي / الشارع
                  </label>
                  <input
                    type="text"
                    value={neighborhoodQuery}
                    onChange={(e) => {
                      setNeighborhoodQuery(e.target.value);
                      setSelectedDistrict(null);
                      const q = e.target.value;
                      setNeighborhoodSuggestions(filterNeighborhoods(q, selectedCity?.name, selectedCountry?.name || countryQuery.trim() || undefined));
                      setShowNeighborhoodSuggestions(true);
                      setShowSuggestions(!selectedCity);
                      setShowCountryResults(false);
                      setShowCountrySuggestions(false);
                      setShowCityResults(false);
                      setShowCitySuggestions(false);
                    }}
                    onFocus={() => {
                      setNeighborhoodSuggestions(filterNeighborhoods(neighborhoodQuery, selectedCity?.name, selectedCountry?.name || countryQuery.trim() || undefined));
                      setShowNeighborhoodSuggestions(true);
                      setShowSuggestions(!selectedCity);
                      setShowCountryResults(false);
                      setShowCountrySuggestions(false);
                      setShowCityResults(false);
                      setShowCitySuggestions(false);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') geocodeAndNavigate(); }}
                    placeholder="أين أنت؟ مثال: تقسيم، وسط دبي، شارع الرشيد..."
                    className="w-full bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3.5 text-slate-900 text-sm font-semibold outline-none border border-slate-200 focus:border-brand-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                  {showNeighborhoodSuggestions && neighborhoodSuggestions.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[260px] overflow-y-auto z-[100] animate-slide-down">
                      {neighborhoodSuggestions.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleDistrictSelect(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-all cursor-pointer text-right"
                        >
                          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <div className="text-right">
                            <span className="text-slate-700 text-sm font-medium block">{item.district.name}</span>
                            <span className="text-slate-400 text-xs">{item.cityName} • {item.countryName}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSuggestions && filteredSuggestions.length > 0 && !showNeighborhoodSuggestions && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[260px] overflow-y-auto z-[100] animate-slide-down">
                      {filteredSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleNeighborhoodSelect(s)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-all cursor-pointer text-right"
                        >
                          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span className="text-slate-700 text-sm font-medium">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                  <button
                    onClick={geocodeAndNavigate}
                    disabled={geocoding}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/30"
                  >
                    {geocoding ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> بحث...</>
                    ) : (
                      <><Search className="w-5 h-5" /> بحث</>
                    )}
                  </button>
                </div>
              </div>

              {geoError && <p className="text-red-500 text-xs mt-3 text-center">{geoError}</p>}

              {/* GPS Location Button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={useMyLocation}
                  disabled={locating}
                  className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 px-5 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-all border border-brand-200 disabled:opacity-50"
                >
                  {locating ? (
                    <><div className="w-4 h-4 border-2 border-brand-300 border-t-brand-700 rounded-full animate-spin" /> جاري تحديد موقعك...</>
                  ) : (
                    <><Crosshair className="w-4 h-4" /> موقعي الحالي</>
                  )}
                </button>
              </div>
            </div>
            {/* ═══ END LOCKDOWN — Hero Search Card ═══ */}

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button onClick={() => onDirectoryNavigate({ country: selectedCountry?.name, city: selectedCity?.name, district: selectedDistrict?.name })}
                className="glass text-neutral-900 dark:text-white px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-neutral-900/5 dark:hover:bg-white/15 transition-all flex items-center gap-2">
                <Compass className="w-4 h-4" /> الدليل الشامل
              </button>
              <a href={flywayBookingUrl({ product: 'generic' })} target="_blank" rel="noopener noreferrer"
                className="glass text-neutral-900 dark:text-white px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-neutral-900/5 dark:hover:bg-white/15 transition-all flex items-center gap-2 no-underline">
                <Zap className="w-4 h-4" /> احجز عبر Flyway
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 15 Master Classification Index */}
      <section className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
            <LayoutGrid className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-brand-700 dark:text-brand-300 text-sm font-medium">15 دليلاً متخصصاً</span>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">الدليل الشامل لخدمات السفر</h2>
          <p className="text-neutral-600 dark:text-zinc-300 text-sm max-w-2xl mx-auto">
            دليل تفاعلي شامل لكل ما يحتاجه المسافر العراقي في وجهته — مع تصفية فورية وبحث ذكي
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Hotel;
            const color = categoryColors[i % categoryColors.length];
            return (
              <button key={cat.key} onClick={() => openCategoryOnMap(cat.key)}
                className="glass-dark rounded-2xl p-5 text-center card-hover cursor-pointer group border border-brand-700/20">
                <div className={`on-dark w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-[11px] text-brand-600 dark:text-brand-400/60 font-bold mb-1">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-neutral-900 dark:text-white font-bold text-sm mb-1 leading-tight">{cat.shortLabel}</h3>
                <p className="text-brand-700 dark:text-brand-300 text-[11px] font-bold mb-1 tabular-nums">{formatPlaceCount(liveCounts[cat.key] ?? 0)} عنصر</p>
                <p className="text-neutral-500 dark:text-zinc-400 text-[10px] leading-tight">{cat.filters.slice(0, 2).join(' • ')}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Smart Navigator CTA */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="glass-dark rounded-3xl p-8 md:p-12 border border-brand-700/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
                <Navigation className="w-4 h-4 text-brand-600 dark:text-brand-300" />
                <span className="text-brand-700 dark:text-brand-300 text-sm font-medium">متصفح الخريطة الذكي</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">أين أنت؟ وأين تريد الذهاب؟</h2>
              <p className="text-neutral-600 dark:text-zinc-300 text-sm mb-6 leading-relaxed">
                اختر منطقتك أو اكتشف موقعك الحالي، ثم ابحث عن أقرب الفنادق، المطاعم، المستشفيات، الصيدليات، الأسواق، والمساجد — كل ذلك على خريطة تفاعلية مع المسافة ووقت المشي التقديري.
              </p>
              <button onClick={() => onSearchNavigate(currentFocus())}
                className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold cursor-pointer flex items-center gap-2">
                <Navigation className="w-5 h-5" /> ابدأ التنقل
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.slice(0, 9).map((cat, i) => {
                const Icon = iconMap[cat.icon] || Hotel;
                const color = categoryColors[i % categoryColors.length];
                return (
                  <button key={cat.key} type="button" onClick={() => openCategoryOnMap(cat.key)} className="glass rounded-xl p-3 text-center cursor-pointer">
                    <div className={`on-dark w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-neutral-600 dark:text-zinc-300 text-[10px] leading-tight">{cat.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Global Cities Showcase */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-brand-400" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">مدن عالمية</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'إسطنبول', en: 'Istanbul', img: 'https://images.pexels.com/photos/31256089/pexels-photo-31256089.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'ترابزون', en: 'Trabzon', img: 'https://images.pexels.com/photos/34245309/pexels-photo-34245309.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'أنطاليا', en: 'Antalya', img: 'https://images.pexels.com/photos/15417847/pexels-photo-15417847.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'طهران', en: 'Tehran', img: 'https://images.pexels.com/photos/16386081/pexels-photo-16386081.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'مشهد', en: 'Mashhad', img: 'https://images.pexels.com/photos/18509546/pexels-photo-18509546.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'دبي', en: 'Dubai', img: 'https://images.pexels.com/photos/19180974/pexels-photo-19180974.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'أبوظبي', en: 'Abu Dhabi', img: 'https://images.pexels.com/photos/33451132/pexels-photo-33451132.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'الرياض', en: 'Riyadh', img: 'https://images.pexels.com/photos/35761/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'مسقط', en: 'Muscat', img: 'https://images.pexels.com/photos/27222917/pexels-photo-27222917.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'كوالالمبور', en: 'Kuala Lumpur', img: 'https://images.pexels.com/photos/8405707/pexels-photo-8405707.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'بانكوك', en: 'Bangkok', img: 'https://images.pexels.com/photos/5264308/pexels-photo-5264308.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
            { name: 'طوكيو', en: 'Tokyo', img: 'https://images.pexels.com/photos/5905666/pexels-photo-5905666.jpeg?auto=compress&cs=tinysrgb&h=300&w=400' },
          ].map((city) => (
            <button
              key={city.en}
              onClick={() => {
                const known = lookupCity(city.en) ?? lookupCity(city.name);
                onSearchNavigate(resolveMapFocus({
                  city: known?.name ?? city.name,
                  country: known?.country,
                  lat: known?.lat,
                  lng: known?.lng,
                  label: city.name,
                }));
              }}
              className="relative h-[120px] rounded-xl overflow-hidden cursor-pointer group card-hover"
            >
              <img src={city.img} alt={city.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="on-dark absolute bottom-0 right-0 left-0 p-2 text-center">
                <h3 className="text-white font-bold text-sm">{city.name}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-brand-400" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">وجهات رائجة</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-[260px] rounded-2xl shimmer-bg animate-shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.map((c) => (
              <div key={c.id} onClick={() => onNavigate('visas')}
                className="relative h-[260px] rounded-2xl overflow-hidden cursor-pointer group card-hover">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="on-dark absolute bottom-0 right-0 left-0 p-5">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-brand-400" fill="currentColor" />
                    <span className="text-amber-400 text-xs font-semibold">رائج</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{c.name}</h3>
                  <p className="text-zinc-200/70 text-xs mt-1 line-clamp-2">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promos */}
      {promos.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-brand-400" fill="currentColor" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">عروض ومكافآت</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {promos.map((p) => (
              <div key={p.id} className="relative h-[200px] rounded-2xl overflow-hidden card-hover cursor-pointer group" onClick={() => onNavigate('rewards')}>
                <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="on-dark absolute bottom-0 right-0 left-0 p-5">
                  <h3 className="text-white font-bold text-lg mb-1">{p.title}</h3>
                  <p className="text-zinc-200/70 text-xs line-clamp-2">{p.description}</p>
                  {p.discount_percentage > 0 && (
                    <span className="inline-block mt-2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      خصم {p.discount_percentage}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="glass-dark rounded-3xl p-10 md:p-16 text-center border border-brand-700/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-royal-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <Globe className="w-12 h-12 text-brand-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">جاهز للسفر؟</h2>
            <p className="text-neutral-600 dark:text-zinc-300 text-sm mb-6 max-w-xl mx-auto">
              جميع خدمات الحجز والمعالجة متاحة عبر نظام Flyway الرسمي. ابدأ رحلتك الآن.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={flywayBookingUrl({ product: 'generic' })} target="_blank" rel="noopener noreferrer"
                className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold cursor-pointer flex items-center gap-2 no-underline">
                <Zap className="w-5 h-5" /> احجز عبر Flyway
              </a>
              <button onClick={() => onNavigate('discover-iraq')}
                className="glass text-neutral-900 dark:text-white px-8 py-3.5 rounded-xl text-base font-semibold cursor-pointer hover:bg-neutral-900/5 dark:hover:bg-white/10 transition-all flex items-center gap-2">
                <MapPin className="w-5 h-5" /> اكتشف العراق
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LayoutGrid({ className }: { className?: string }) {
  return <Compass className={className} />;
}
