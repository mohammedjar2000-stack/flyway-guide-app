import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Landmark, Loader2, MapPin, Search, X } from 'lucide-react';
import {
  firstMajorCityForCountry,
  getDistrictsForCity,
  getMajorCitiesForCountry,
  listCountriesFromCatalog,
  lookupCity,
  resolveMapFocus,
  type AppLocation,
  type CityCoordinate,
  type DistrictCoordinate,
} from '@/lib/cityCoordinates';
import { listMajorCities, searchCities } from '@/lib/locations';
import { ALL_TURKEY_LOCATION, isAllTurkeyCity, isTurkeyCountry } from '@/lib/turkeyScope';

interface CityPickerBarProps {
  location?: AppLocation | null;
  onSelect: (next: AppLocation) => void;
}

interface CityOption {
  id: string;
  kind: 'city' | 'district';
  name: string;
  en: string;
  country: string;
  cityName: string;
  lat: number;
  lng: number;
}

function optionFromCity(city: CityCoordinate): CityOption {
  return {
    id: `city:${city.countryCode}:${city.en}`,
    kind: 'city',
    name: city.name,
    en: city.en,
    country: city.country,
    cityName: city.name,
    lat: city.lat,
    lng: city.lng,
  };
}

function optionFromDistrict(district: DistrictCoordinate, city: CityCoordinate): CityOption {
  return {
    id: `district:${city.countryCode}:${city.en}:${district.en}`,
    kind: 'district',
    name: district.name,
    en: district.en,
    country: city.country,
    cityName: city.name,
    lat: district.lat,
    lng: district.lng,
  };
}

function matchesQuery(option: CityOption, query: string) {
  if (!query) return true;
  const hay = `${option.name} ${option.en} ${option.cityName} ${option.country}`.toLowerCase();
  return hay.includes(query);
}

export default function CityPickerBar({ location, onSelect }: CityPickerBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [countryMenu, setCountryMenu] = useState(false);
  const [remote, setRemote] = useState<CityOption[]>([]);
  const [searching, setSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const country = location?.country || 'تركيا';
  const countries = useMemo(() => listCountriesFromCatalog(), []);
  const currentCity = lookupCity(location?.city) || lookupCity(location?.label);

  const localOptions = useMemo(() => {
    const cities = getMajorCitiesForCountry(country);
    const options = cities.map(optionFromCity);
    const cityForDistricts = currentCity && currentCity.country === country ? currentCity : cities[0];
    if (cityForDistricts) {
      for (const district of getDistrictsForCity(cityForDistricts.en, cityForDistricts.countryCode)) {
        options.push(optionFromDistrict(district, cityForDistricts));
      }
    }
    return options;
  }, [country, currentCity]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCountryMenu(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setRemote([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchCities(q, country).then((hits) => {
        if (cancelled) return;
        const extras: CityOption[] = hits.map((hit) => ({
          id: `city:${hit.city.countryCode}:${hit.city.en}`,
          kind: 'city' as const,
          name: hit.city.name,
          en: hit.city.en,
          country: hit.countryName,
          cityName: hit.city.name,
          lat: hit.city.lat,
          lng: hit.city.lng,
        }));
        setRemote(extras);
        setSearching(false);
      }).catch(() => {
        if (!cancelled) {
          setRemote([]);
          setSearching(false);
        }
      });
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, country, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const next: CityOption[] = [];
    for (const option of [...localOptions, ...remote]) {
      if (seen.has(option.id) || !matchesQuery(option, q)) continue;
      seen.add(option.id);
      next.push(option);
    }
    if (!q) {
      const majors = listMajorCities(country).map((hit) => ({
        id: `city:${hit.city.countryCode}:${hit.city.en}`,
        kind: 'city' as const,
        name: hit.city.name,
        en: hit.city.en,
        country: hit.countryName,
        cityName: hit.city.name,
        lat: hit.city.lat,
        lng: hit.city.lng,
      }));
      for (const option of majors) {
        if (seen.has(option.id)) continue;
        seen.add(option.id);
        next.unshift(option);
      }
    }
    return next.slice(0, 60);
  }, [localOptions, remote, query, country]);

  const cities = filtered.filter((o) => o.kind === 'city');
  const districts = filtered.filter((o) => o.kind === 'district');

  const applyAllTurkey = () => {
    onSelect({ ...ALL_TURKEY_LOCATION });
    setQuery('');
    setOpen(false);
    setCountryMenu(false);
  };

  const applyOption = (option: CityOption) => {
    onSelect(resolveMapFocus({
      country: option.country,
      city: option.cityName,
      district: option.kind === 'district' ? option.name : undefined,
      lat: option.lat,
      lng: option.lng,
      label: option.kind === 'district' ? `${option.name}، ${option.cityName}` : option.name,
    }));
    setQuery('');
    setOpen(false);
    setCountryMenu(false);
  };

  const applyCountry = (nextCountry: { name: string; en: string }) => {
    const first = firstMajorCityForCountry(nextCountry.name);
    onSelect(resolveMapFocus({
      country: nextCountry.name,
      city: first?.name,
      lat: first?.lat,
      lng: first?.lng,
      label: first?.name || nextCountry.name,
    }));
    setCountryMenu(false);
    setQuery('');
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const label = location?.district
    ? `${location.district}، ${location.city || ''}`
    : location?.city || location?.label || 'اختر مدينة';

  return (
    <div ref={rootRef} className="relative w-full" dir="rtl">
      <div className="flex items-center gap-2 rounded-2xl bg-neutral-950/90 text-white border border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md px-2 py-2">
        <button
          type="button"
          onClick={() => {
            setCountryMenu((v) => !v);
            setOpen(false);
          }}
          className="shrink-0 max-w-[38%] sm:max-w-[30%] inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-2 text-[12px] font-semibold cursor-pointer"
          aria-expanded={countryMenu}
        >
          <Landmark className="w-3.5 h-3.5 text-brand-300 shrink-0" />
          <span className="truncate">{country}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
        </button>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={open ? query : ''}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setCountryMenu(false);
            }}
            onFocus={() => {
              setOpen(true);
              setCountryMenu(false);
            }}
            placeholder={label}
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/10 rounded-xl pr-9 pl-8 py-2 text-[13px] text-white placeholder:text-zinc-400 outline-none"
            aria-label="خانة المدن الذكية"
          />
          {(open && query) ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-300 pointer-events-none" />
          )}
        </div>
      </div>

      {countryMenu && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[min(100%,280px)] max-h-72 overflow-y-auto rounded-2xl bg-neutral-950/95 border border-white/10 shadow-2xl p-1.5">
          {countries.map((item) => {
            const active = item.name === country;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => applyCountry(item)}
                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-[13px] cursor-pointer ${
                  active ? 'bg-brand-500/20 text-white' : 'text-zinc-200 hover:bg-white/8'
                }`}
              >
                <span>{item.name}</span>
                {active && <Check className="w-3.5 h-3.5 text-brand-300" />}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div className="absolute top-[calc(100%+6px)] inset-x-0 z-50 max-h-[min(58vh,420px)] overflow-y-auto rounded-2xl bg-neutral-950/95 border border-white/10 shadow-2xl p-2">
          {isTurkeyCountry(country) && (
            <button
              type="button"
              onClick={applyAllTurkey}
              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-[13px] cursor-pointer mb-1 ${
                isAllTurkeyCity(location?.city) ? 'bg-brand-500/20 text-white' : 'text-brand-200 hover:bg-white/8'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                عموم تركيا
              </span>
              {isAllTurkeyCity(location?.city) && <Check className="w-3.5 h-3.5 text-brand-300" />}
            </button>
          )}
          <div className="px-2 pt-1 pb-2 text-[11px] text-zinc-400">
            مدن ومحافظات {country}
          </div>
          {searching && (
            <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري البحث...
            </div>
          )}
          {!searching && filtered.length === 0 && (
            <div className="px-3 py-4 text-[13px] text-zinc-400">لا توجد نتائج مطابقة</div>
          )}
          {cities.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-500">المدن</div>
              {cities.map((option) => {
                const active = option.name === location?.city && !location?.district;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyOption(option)}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-right cursor-pointer ${
                      active ? 'bg-brand-500/20 text-white' : 'text-zinc-100 hover:bg-white/8'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold truncate">{option.name}</span>
                      <span className="block text-[11px] text-zinc-400 truncate">{option.en}</span>
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-brand-300" />}
                  </button>
                );
              })}
            </div>
          )}
          {districts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-500">المحافظات والأحياء</div>
              {districts.map((option) => {
                const active = option.name === location?.district;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyOption(option)}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-right cursor-pointer ${
                      active ? 'bg-brand-500/20 text-white' : 'text-zinc-100 hover:bg-white/8'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold truncate">{option.name}</span>
                      <span className="block text-[11px] text-zinc-400 truncate">{option.cityName} · {option.en}</span>
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-brand-300" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
