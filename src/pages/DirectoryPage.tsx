import { useEffect, useState, useMemo } from 'react';
import {
  Hotel, UtensilsCrossed, Stethoscope, Pill, ShoppingBag, Camera,
  Banknote, Landmark, Car, Shield, Smartphone, Moon, Scissors, Fuel,
  ShoppingCart, Search, Star, MapPin, Phone, Clock, X, Filter, Compass,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';
import { isAuthenticVenueName, isNearDuplicate } from '@/lib/placeAuthenticity';
import { pinListing, pinQuery, sanitizePin } from '@/lib/placePrecision';
import { getAllVerifiedPlaces } from '@/lib/verifiedPlaces';
import FlywayBookButton from '@/components/map/FlywayBookButton';
import PlaceHoverCard from '@/components/map/PlaceHoverCard';
import { usePlacePreview } from '@/hooks/usePlacePreview';
import { appleMapsDirUrl, googleMapsSearchUrl, wazeNavUrl } from '@/lib/navLinks';

const iconMap: Record<string, typeof Hotel> = {
  Hotel, UtensilsCrossed, Stethoscope, Pill, ShoppingBag, Camera,
  Banknote, Landmark, Car, Shield, Smartphone, Moon, Scissors, Fuel, ShoppingCart,
};

interface DirectoryPageProps {
  locationFilter?: { country?: string; city?: string; district?: string; category?: string } | null;
}

export default function DirectoryPage({ locationFilter }: DirectoryPageProps) {
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(locationFilter?.category || 'hotels');
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<DirectoryListing | null>(null);
  const { preview, show: showPreview, hide: hidePreview, clear: clearPreview } = usePlacePreview();

  useEffect(() => {
    if (locationFilter) {
      const parts: string[] = [];
      if (locationFilter.country) parts.push(locationFilter.country);
      if (locationFilter.city) parts.push(locationFilter.city);
      if (locationFilter.district) parts.push(locationFilter.district);
      if (parts.length > 0) setSearch(parts.join('، '));
      if (locationFilter.category) setActiveCategory(locationFilter.category);
    }
  }, [locationFilter]);

  useEffect(() => {
    let cancelled = false;
    supabase.from('directory_listings').select('*').order('sort_order').then(({ data }) => {
      if (cancelled) return;
      const accepted: DirectoryListing[] = [];
      const ingest = (item: DirectoryListing) => {
        if (!isAuthenticVenueName(item.name, item.category_key) && !isAuthenticVenueName(item.description || '', item.category_key)) {
          return;
        }
        const pinned = pinListing(item);
        if (!pinned) return;
        if (accepted.some((existing) => existing.id === pinned.id || isNearDuplicate(existing, pinned))) return;
        accepted.push(pinned);
      };
      for (const item of (data ?? []) as DirectoryListing[]) ingest(item);
      for (const item of getAllVerifiedPlaces()) ingest(item);
      setListings(accepted);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const currentCat = CATEGORIES.find((c) => c.key === activeCategory);
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    listings.filter((l) => l.category_key === activeCategory).forEach((l) => l.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [listings, activeCategory]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (l.category_key !== activeCategory) return false;
      if (search.trim()) {
        const hay = [l.name, l.description, l.city, l.country_name, l.address].join(' ').toLowerCase();
        const tokens = search.toLowerCase().split(/[،,]+/).map((t) => t.trim()).filter(Boolean);
        if (tokens.length > 0 && !tokens.every((t) => hay.includes(t))) return false;
      }
      if (activeTags.length > 0 && !activeTags.every((t) => l.tags.includes(t))) return false;
      return true;
    });
  }, [listings, activeCategory, search, activeTags]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">الدليل الشامل لخدمات السفر</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm">15 دليلاً متخصصاً مع تصفية فورية — اختر الفئة وابحث</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon] || Hotel;
          const count = activeCategory === cat.key
            ? filtered.length
            : listings.filter((l) => l.category_key === cat.key).length;
          return (
            <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setSearch(''); setActiveTags([]); }}
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
                {count} عنصر
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400/60" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، المدينة، أو الدولة..."
            className="w-full pr-12 pl-4 py-3.5 glass-dark rounded-xl text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-white/10 transition-all focus:border-brand-400" />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-brand-400/60 shrink-0" />
            {allTags.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                  activeTags.includes(tag)
                    ? 'bg-brand-400 border-brand-400 text-neutral-950'
                    : 'glass-dark border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
                }`}>
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[300px] rounded-2xl shimmer-bg animate-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg">لا توجد نتائج مطابقة</p>
        </div>
      ) : (
        <>
          <div className="text-zinc-500 text-xs mb-4">{filtered.length} نتيجة في "{currentCat?.label}"</div>
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
                className="glass-dark rounded-2xl overflow-hidden border border-white/10 card-hover cursor-pointer group"
              >
                <div className="relative h-[180px] overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <div className="text-brand-400/80 text-[11px] mb-3 leading-relaxed">
                      {item.proximity_note}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((t, i) => (
                      <span key={i} className="glass px-2.5 py-1 rounded-full text-[10px] text-neutral-700 dark:text-zinc-300">{t}</span>
                    ))}
                  </div>
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
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
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

              <div className="flex flex-wrap gap-2">
                {selected.tags.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-400 text-neutral-950">{t}</span>
                ))}
              </div>

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
