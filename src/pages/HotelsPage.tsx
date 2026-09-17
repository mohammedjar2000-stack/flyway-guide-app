import { useEffect, useState, useMemo } from 'react';
import { Search, Star, MapPin, Wifi, Car, Coffee, Waves, Dumbbell, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Hotel } from '@/types';
import FlywayBookButton from '@/components/map/FlywayBookButton';

const amenityIcons: Record<string, typeof Wifi> = {
  'موقف سيارات': Car,
  'مقهى': Coffee,
  'مطعم': Coffee,
  'حمام سباحة': Waves,
  'واي فاي مجاني': Wifi,
  'مركز لياقة': Dumbbell,
  'سبا': Waves,
  'كازينو': Star,
  'شاطئ خاص': Waves,
  'غوص': Waves,
};

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  useEffect(() => {
    supabase.from('hotels').select('*').order('star_rating', { ascending: false }).then(({ data }) => {
      setHotels(data ?? []);
      setLoading(false);
    });
  }, []);

  const countryNames = useMemo(() => Array.from(new Set(hotels.map((h) => h.country_name))), [hotels]);

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      const matchesSearch = !search || h.name.includes(search) || h.country_name.includes(search);
      const matchesCountry = selectedCountry === 'all' || h.country_name === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [hotels, search, selectedCountry]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">دليل الفنادق العالمي</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm">تصفح الفنادق المتاحة مع التقييم، المرافق، وسياسات الإقامة</p>
      </div>

      <div className="max-w-[600px] mx-auto relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400/60" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن فندق أو دولة..."
          className="w-full pr-12 pl-4 py-4 glass-dark rounded-full text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-brand-700/20 transition-all focus:border-brand-500" />
      </div>

      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        <button onClick={() => setSelectedCountry('all')}
          className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all border ${
            selectedCountry === 'all' ? 'bg-brand-400 border-brand-400 text-neutral-950' : 'glass-dark border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
          }`}>
          كل الدول
        </button>
        {countryNames.map((name) => (
          <button key={name} onClick={() => setSelectedCountry(name)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all border ${
              selectedCountry === name ? 'bg-brand-400 border-brand-400 text-neutral-950' : 'glass-dark border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
            }`}>
            {name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[360px] rounded-2xl shimmer-bg animate-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 dark:text-zinc-400"><p className="text-lg">لا توجد فنادق مطابقة</p></div>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {filtered.map((h) => (
            <div key={h.id} onClick={() => setSelectedHotel(h)}
              className="glass-dark rounded-2xl overflow-hidden border border-brand-700/20 card-hover cursor-pointer group">
              <div className="relative h-[200px] overflow-hidden on-dark">
                <img src={h.image} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {[...Array(h.star_rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />)}
                </div>
                <div className="absolute bottom-3 right-3 bg-brand-600/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                  {h.country_name}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{h.name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {h.amenities.slice(0, 4).map((a, i) => {
                    const Icon = amenityIcons[a] || Wifi;
                    return (
                      <span key={i} className="flex items-center gap-1 glass px-2.5 py-1 rounded-full text-[11px] text-neutral-700 dark:text-zinc-300">
                        <Icon className="w-3 h-3" /> {a}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-brand-700 dark:text-brand-300 font-bold">{h.price_per_night_iqd.toLocaleString('en-US')} د.ع</span>
                  <span className="text-neutral-500 dark:text-zinc-400 text-xs">/ لليلة</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedHotel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedHotel(null)}>
          <div className="max-w-[560px] w-full max-h-[85vh] overflow-y-auto glass-dark rounded-2xl border border-brand-700/30 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[260px] overflow-hidden rounded-t-2xl on-dark">
              <img src={selectedHotel.image} alt={selectedHotel.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedHotel(null)} className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-red-500/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {[...Array(selectedHotel.star_rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />)}
              </div>
              <div className="absolute bottom-0 right-0 left-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="text-2xl font-bold text-white">{selectedHotel.name}</h2>
                <p className="text-white/80 text-sm flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {selectedHotel.country_name}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-brand-400 text-sm font-bold mb-2">المرافق</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedHotel.amenities.map((a, i) => {
                    const Icon = amenityIcons[a] || Wifi;
                    return (
                      <span key={i} className="flex items-center gap-1.5 glass px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-zinc-200">
                        <Icon className="w-4 h-4 text-brand-400" /> {a}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="glass rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-brand-400 font-medium mb-1">سياسة الإلغاء</p>
                  <p className="text-neutral-600 dark:text-zinc-300 text-sm">{selectedHotel.cancellation_policy}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-400 font-medium mb-1">سياسة تمديد الإقامة</p>
                  <p className="text-neutral-600 dark:text-zinc-300 text-sm">{selectedHotel.nightly_extension_policy}</p>
                </div>
              </div>
              <div className="flex items-center justify-between glass rounded-xl p-4">
                <span className="text-neutral-600 dark:text-zinc-300 text-sm">السعر لليلة (مرجعي)</span>
                <span className="text-brand-700 dark:text-brand-300 font-bold text-lg">{selectedHotel.price_per_night_iqd.toLocaleString('en-US')} د.ع</span>
              </div>
              <FlywayBookButton
                name={selectedHotel.name}
                country={selectedHotel.country_name}
                categoryKey="hotels"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
