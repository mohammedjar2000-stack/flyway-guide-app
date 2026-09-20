import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Landmark, Loader2, MapPin, Search, X } from 'lucide-react';
import {
  firstMajorCityForCountry,
  getDistrictsForCity,
  getMajorCitiesForCountry,
  listCountriesFromCatalog,
  lookupCity,
  queryMatchScore,
  resolveMapFocus,
  type AppLocation,
  type CityCoordinate,
  type DistrictCoordinate,
} from '@/lib/cityCoordinates';
import { listMajorCities, searchCities, searchCountries } from '@/lib/locations';
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
  score?: number;
}

function optionFromCity(city: CityCoordinate, score = 0): CityOption {
  return {
    id: `city:${city.countryCode}:${city.en}`,
    kind: 'city',
    name: city.name,
    en: city.en,
    country: city.country,
    cityName: city.name,
    lat: city.lat,
    lng: city.lng,
    score,
  };
}

function optionFromDistrict(district: DistrictCoordinate, city: CityCoordinate, score = 0): CityOption {
  return {
    id: `district:${city.countryCode}:${city.en}:${district.en}`,
    kind: 'district',
    name: district.name,
    en: district.en,
    country: city.country,
    cityName: city.name,
    lat: district.lat,
    lng: district.lng,
    score,
  };
}

export default function CityPickerBar({ location, onSelect }: CityPickerBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [countryMenu, setCountryMenu] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [remote, setRemote] = useState<CityOption[]>([]);
  const [remoteCountries, setRemoteCountries] = useState<Array<{ name: string; en: string; code: string }>>([]);
  const [searching, setSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countryFilterRef = useRef<HTMLInputElement>(null);

  const country = location?.country || 'تركيا';
  const countries = useMemo(() => listCountriesFromCatalog(), []);
  const currentCity = lookupCity(location?.city) || lookupCity(location?.label);
  const typed = query.trim();
  const canSuggest = typed.length >= 2;

  const localOptions = useMemo(() => {
    const cities = getMajorCitiesForCountry(country);
    const options = cities.map((city) => optionFromCity(city, queryMatchScore(typed, city.name, city.en)));
    const cityForDistricts = currentCity && currentCity.country === country ? currentCity : cities[0];
    if (cityForDistricts) {
      for (const district of getDistrictsForCity(cityForDistricts.en, cityForDistricts.countryCode)) {
        options.push(optionFromDistrict(
          district,
          cityForDistricts,
          queryMatchScore(typed, district.name, district.en, cityForDistricts.name),
        ));
      }
    }
    return options;
  }, [country, currentCity, typed]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCountryMenu(false);
        setQuery('');
        setCountryFilter('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!countryMenu) return;
    window.setTimeout(() => countryFilterRef.current?.focus(), 0);
  }, [countryMenu]);

  useEffect(() => {
    if (!open || !canSuggest) {
      setRemote([]);
      setRemoteCountries([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void Promise.all([
        searchCities(typed, country).catch(() => []),
        searchCountries(typed).catch(() => []),
      ]).then(([hits, countryHits]) => {
        if (cancelled) return;
        setRemote(hits.map((hit) => ({
          id: `city:${hit.city.countryCode}:${hit.city.en}`,
          kind: 'city' as const,
          name: hit.city.name,
          en: hit.city.en,
          country: hit.countryName,
          cityName: hit.city.name,
          lat: hit.city.lat,
          lng: hit.city.lng,
          score: queryMatchScore(typed, hit.city.name, hit.city.en),
        })));
        setRemoteCountries(countryHits.slice(0, 8).map((item) => ({
          name: item.name,
          en: item.en,
          code: item.code,
        })));
        setSearching(false);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [typed, country, open, canSuggest]);

  const countryHits = useMemo(() => {
    if (!canSuggest) return [];
    const seen = new Set<string>();
    const rows = [
      ...countries.map((item) => ({
        ...item,
        score: queryMatchScore(typed, item.name, item.en, item.code),
      })),
      ...remoteCountries.map((item) => ({
        ...item,
        score: queryMatchScore(typed, item.name, item.en, item.code),
      })),
    ]
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    const next: typeof countries = [];
    for (const item of rows) {
      if (seen.has(item.code)) continue;
      seen.add(item.code);
      next.push(item);
    }
    return next.slice(0, 6);
  }, [canSuggest, countries, remoteCountries, typed]);

  const filtered = useMemo(() => {
    if (!canSuggest) return [] as CityOption[];
    const seen = new Set<string>();
    const next: CityOption[] = [];
    const extras = listMajorCities(undefined, typed).map((hit) => ({
      id: `city:${hit.city.countryCode}:${hit.city.en}`,
      kind: 'city' as const,
      name: hit.city.name,
      en: hit.city.en,
      country: hit.countryName,
      cityName: hit.city.name,
      lat: hit.city.lat,
      lng: hit.city.lng,
      score: queryMatchScore(typed, hit.city.name, hit.city.en),
    }));
    for (const option of [...localOptions, ...extras, ...remote]) {
      const score = option.score ?? queryMatchScore(typed, option.name, option.en, option.cityName, option.country);
      if (score <= 0 || seen.has(option.id)) continue;
      seen.add(option.id);
      next.push({ ...option, score });
    }
    return next.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 24);
  }, [canSuggest, localOptions, remote, typed]);

  const cities = filtered.filter((o) => o.kind === 'city');
  const districts = filtered.filter((o) => o.kind === 'district');
  const filteredCountries = useMemo(() => {
    const q = countryFilter.trim();
    if (!q) return countries;
    return countries
      .map((item) => ({ item, score: queryMatchScore(q, item.name, item.en, item.code) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.item);
  }, [countries, countryFilter]);

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
    setCountryFilter('');
    setQuery('');
    setOpen(false);
  };

  const label = location?.district
    ? `${location.district}، ${location.city || ''}`
    : location?.city || location?.label || 'اختر مدينة';

  return (
    <div ref={rootRef} className="on-light relative w-full isolate text-slate-800" dir="rtl">
      <div className="flex items-center gap-2 rounded-[22px] bg-white text-slate-800 border border-slate-200 shadow-[0_10px_32px_rgba(15,23,42,0.16)] px-2 py-1.5">
        <button
          type="button"
          onClick={() => {
            setCountryMenu((v) => !v);
            setOpen(false);
            setQuery('');
          }}
          className="shrink-0 max-w-[38%] sm:max-w-[30%] inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-2 text-[12px] font-semibold text-slate-800 cursor-pointer"
          aria-expanded={countryMenu}
        >
          <Landmark className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300 shrink-0" />
          <span className="truncate text-slate-800">{country}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </button>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              setCountryMenu(false);
              setOpen(next.trim().length >= 2);
            }}
            onFocus={() => {
              setCountryMenu(false);
              if (query.trim().length >= 2) setOpen(true);
            }}
            placeholder={label}
            autoComplete="off"
            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pr-9 pl-8 py-2 text-[13px] font-medium text-slate-900 caret-slate-900 placeholder:text-slate-500 outline-none"
            aria-label="بحث الدولة والمدينة"
            aria-autocomplete="list"
            aria-expanded={open && canSuggest}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer dark:text-zinc-400 dark:hover:text-white"
              aria-label="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-600 dark:text-brand-300 pointer-events-none" />
          )}
        </div>
      </div>

      {countryMenu && (
        <div className="on-light absolute top-[calc(100%+6px)] right-0 z-[80] w-[min(100%,280px)] max-h-80 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-800 dark:bg-neutral-950/95 dark:border-white/10 dark:text-white">
          <div className="p-2 border-b border-slate-100 dark:border-white/10">
            <input
              ref={countryFilterRef}
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              placeholder="ابحث عن دولة..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-900 caret-slate-900 placeholder:text-slate-500 outline-none dark:bg-white/10 dark:border-white/10 dark:text-white dark:caret-white"
              aria-label="بحث الدولة"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredCountries.length === 0 && (
              <div className="px-3 py-4 text-[13px] text-zinc-400">لا توجد دولة مطابقة</div>
            )}
            {filteredCountries.map((item) => {
              const active = item.name === country;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => applyCountry(item)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-[13px] cursor-pointer ${
                    active ? 'bg-brand-100 text-slate-900 dark:bg-brand-500/20 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-white/8'
                  }`}
                >
                  <span>{item.name}</span>
                  {active && <Check className="w-3.5 h-3.5 text-brand-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open && canSuggest && (
        <div className="on-light absolute top-[calc(100%+6px)] inset-x-0 z-[80] max-h-[min(48vh,360px)] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 text-slate-800 dark:bg-neutral-950/95 dark:border-white/10 dark:text-white">
          {isTurkeyCountry(country) && queryMatchScore(typed, 'تركيا', 'turkey', 'عموم تركيا') > 0 && (
            <button
              type="button"
              onClick={applyAllTurkey}
              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-[13px] cursor-pointer mb-1 ${
                isAllTurkeyCity(location?.city) ? 'bg-brand-100 text-slate-900 dark:bg-brand-500/20 dark:text-white' : 'text-brand-700 hover:bg-slate-100 dark:text-brand-200 dark:hover:bg-white/8'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                عموم تركيا
              </span>
              {isAllTurkeyCity(location?.city) && <Check className="w-3.5 h-3.5 text-brand-300" />}
            </button>
          )}
          {countryHits.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-500">الدول</div>
              {countryHits.map((item) => (
                <button
                  key={`country:${item.code}`}
                  type="button"
                  onClick={() => applyCountry(item)}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-right cursor-pointer text-slate-800 hover:bg-slate-100 dark:text-zinc-100 dark:hover:bg-white/8"
                >
                  <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{item.name}</span>
                    <span className="block text-[11px] text-zinc-400 truncate">{item.en}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {searching && filtered.length === 0 && countryHits.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري البحث...
            </div>
          )}
          {!searching && filtered.length === 0 && countryHits.length === 0 && (
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
                      active ? 'bg-brand-100 text-slate-900 dark:bg-brand-500/20 dark:text-white' : 'text-slate-800 hover:bg-slate-100 dark:text-zinc-100 dark:hover:bg-white/8'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold truncate">{option.name}</span>
                      <span className="block text-[11px] text-zinc-400 truncate">{option.en} · {option.country}</span>
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
                      active ? 'bg-brand-100 text-slate-900 dark:bg-brand-500/20 dark:text-white' : 'text-slate-800 hover:bg-slate-100 dark:text-zinc-100 dark:hover:bg-white/8'
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
